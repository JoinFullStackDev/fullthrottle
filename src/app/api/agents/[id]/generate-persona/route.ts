import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/runtime/providers/registry';
import type { Tables, Json } from '@/lib/supabase/database.types';

type AgentRow = Tables<'agents'>;

const PERSONA_SYSTEM_PROMPT = `You are an AI persona configuration assistant. Your job is to generate a structured persona override configuration for an AI agent based on a user's description.

You MUST output ONLY valid JSON (no markdown fences, no explanation) with this exact shape:

{
  "rules": [
    { "id": "r-1", "text": "rule text here", "enabled": true }
  ],
  "skills": [
    { "id": "s-1", "name": "skill name", "description": "optional description", "enabled": true }
  ],
  "templates": {
    "template_name": "template content"
  },
  "knowledgeScope": {
    "allowedFolders": [],
    "allowedProjects": [],
    "restrictedSources": [],
    "preferNewest": true
  },
  "escalationRules": {
    "threshold": "flexible",
    "conditions": ["condition text"],
    "outputFormat": ""
  },
  "riskTolerance": "balanced"
}

Rules for generation:
- Generate 5-15 specific, actionable rules appropriate for the agent's role
- Generate 3-8 relevant skills
- Include at least one output template if appropriate for the role
- Set riskTolerance to "conservative", "balanced", or "aggressive" based on the role
- Set escalation threshold to "strict" or "flexible"
- Each rule id should be "r-1", "r-2", etc. Each skill id should be "s-1", "s-2", etc.
- Output ONLY the JSON object, nothing else`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: agentId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = createServiceRoleClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.prompt?.trim()) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  const { data: agentData, error: agentErr } = await svc
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agentErr || !agentData) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  const agent = agentData as AgentRow;

  const userMessage = `Agent name: ${agent.name}
Agent role: ${agent.role}
Agent description: ${agent.description || 'No description provided'}

User request: ${body.prompt.trim()}`;

  try {
    const provider = getProvider(agent.provider);
    const { stream } = await provider.chatStream({
      model: agent.default_model,
      systemPrompt: PERSONA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7,
      maxTokens: 4096,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        fullResponse += chunk.content;
      }
      if (chunk.type === 'error') {
        return Response.json({ error: chunk.content }, { status: 500 });
      }
    }

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return Response.json(
        { error: 'Failed to parse AI response as valid JSON' },
        { status: 502 },
      );
    }

    if (!Array.isArray(parsed.rules) || !Array.isArray(parsed.skills)) {
      return Response.json(
        { error: 'AI response missing required fields (rules, skills)' },
        { status: 502 },
      );
    }

    const { data: override, error: insertErr } = await svc
      .from('persona_overrides')
      .insert({
        agent_id: agentId,
        scope_type: 'agent',
        scope_id: agentId,
        rules: parsed.rules as unknown as Json,
        skills: parsed.skills as unknown as Json,
        templates: (parsed.templates ?? {}) as unknown as Json,
        knowledge_scope: (parsed.knowledgeScope ?? {}) as unknown as Json,
        escalation_rules: (parsed.escalationRules ?? {}) as unknown as Json,
        risk_tolerance: (['conservative', 'balanced', 'aggressive'].includes(parsed.riskTolerance as string)
          ? parsed.riskTolerance
          : 'balanced') as 'conservative' | 'balanced' | 'aggressive',
        version: 'v1.0',
        created_by: user.id,
      } as never)
      .select('*')
      .single();

    if (insertErr || !override) {
      return Response.json({ error: insertErr?.message ?? 'Failed to save override' }, { status: 500 });
    }

    const overrideRow = override as Tables<'persona_overrides'>;

    try {
      await svc
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: 'persona_override_generated',
          entity_type: 'PersonaOverride',
          entity_id: overrideRow.id,
          after_state: { agentId, scopeType: 'agent', version: 'v1.0' } as unknown as Json,
          reason: `AI-generated persona from prompt: ${body.prompt.trim().slice(0, 200)}`,
        } as never);
    } catch {
      // audit log failure is non-fatal
    }

    return Response.json({ override: overrideRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
