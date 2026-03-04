export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'super_admin' | 'admin' | 'team_lead' | 'contributor' | 'viewer';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: 'super_admin' | 'admin' | 'team_lead' | 'contributor' | 'viewer';
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'super_admin' | 'admin' | 'team_lead' | 'contributor' | 'viewer';
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          name: string;
          role: string;
          description: string;
          base_persona_version: string;
          status: 'offline' | 'active' | 'disabled' | 'planned';
          default_model: string;
          provider: string;
          runtime_agent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          description?: string;
          base_persona_version?: string;
          status?: 'offline' | 'active' | 'disabled' | 'planned';
          default_model?: string;
          provider?: string;
          runtime_agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          description?: string;
          base_persona_version?: string;
          status?: 'offline' | 'active' | 'disabled' | 'planned';
          default_model?: string;
          provider?: string;
          runtime_agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      persona_overrides: {
        Row: {
          id: string;
          agent_id: string;
          scope_type: 'agent' | 'project' | 'environment' | 'hotfix';
          scope_id: string;
          rules: Json;
          skills: Json;
          templates: Json;
          knowledge_scope: Json;
          escalation_rules: Json;
          risk_tolerance: 'conservative' | 'balanced' | 'aggressive';
          version: string;
          created_by: string;
          approved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          scope_type: 'agent' | 'project' | 'environment' | 'hotfix';
          scope_id: string;
          rules?: Json;
          skills?: Json;
          templates?: Json;
          knowledge_scope?: Json;
          escalation_rules?: Json;
          risk_tolerance?: 'conservative' | 'balanced' | 'aggressive';
          version?: string;
          created_by: string;
          approved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          scope_type?: 'agent' | 'project' | 'environment' | 'hotfix';
          scope_id?: string;
          rules?: Json;
          skills?: Json;
          templates?: Json;
          knowledge_scope?: Json;
          escalation_rules?: Json;
          risk_tolerance?: 'conservative' | 'balanced' | 'aggressive';
          version?: string;
          created_by?: string;
          approved_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'persona_overrides_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'persona_overrides_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'persona_overrides_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: 'backlog' | 'ready' | 'in_progress' | 'waiting' | 'review' | 'done';
          owner_type: 'human' | 'agent';
          owner_id: string;
          priority: 'low' | 'medium' | 'high' | 'critical';
          project_tag: string;
          runtime_run_id: string | null;
          last_runtime_status: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: 'backlog' | 'ready' | 'in_progress' | 'waiting' | 'review' | 'done';
          owner_type?: 'human' | 'agent';
          owner_id: string;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          project_tag?: string;
          runtime_run_id?: string | null;
          last_runtime_status?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: 'backlog' | 'ready' | 'in_progress' | 'waiting' | 'review' | 'done';
          owner_type?: 'human' | 'agent';
          owner_id?: string;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          project_tag?: string;
          runtime_run_id?: string | null;
          last_runtime_status?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_agents: {
        Row: {
          conversation_id: string;
          agent_id: string;
          added_at: string;
        };
        Insert: {
          conversation_id: string;
          agent_id: string;
          added_at?: string;
        };
        Update: {
          conversation_id?: string;
          agent_id?: string;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_agents_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_agents_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          agent_id: string | null;
          created_by: string;
          channel: string;
          title: string | null;
          external_thread_id: string | null;
          external_channel_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id?: string | null;
          created_by: string;
          channel?: string;
          title?: string | null;
          external_thread_id?: string | null;
          external_channel_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string | null;
          created_by?: string;
          channel?: string;
          title?: string | null;
          external_thread_id?: string | null;
          external_channel_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: 'human' | 'agent' | 'system';
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_type: 'human' | 'agent' | 'system';
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_type?: 'human' | 'agent' | 'system';
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          before_state: Json | null;
          after_state: Json | null;
          reason: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          before_state?: Json | null;
          after_state?: Json | null;
          reason: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          action_type?: string;
          entity_type?: string;
          entity_id?: string;
          before_state?: Json | null;
          after_state?: Json | null;
          reason?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_events: {
        Row: {
          id: string;
          agent_id: string;
          model: string;
          token_count: number;
          cost_estimate: number;
          timestamp: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          model?: string;
          token_count?: number;
          cost_estimate?: number;
          timestamp?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          model?: string;
          token_count?: number;
          cost_estimate?: number;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_events_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
        ];
      };
      integrations: {
        Row: {
          id: string;
          type: 'slack' | 'gitlab' | 'google_drive';
          agent_id: string | null;
          status: 'not_configured' | 'configured' | 'connected' | 'error';
          config: Json;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'slack' | 'gitlab' | 'google_drive';
          agent_id?: string | null;
          status?: 'not_configured' | 'configured' | 'connected' | 'error';
          config?: Json;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'slack' | 'gitlab' | 'google_drive';
          agent_id?: string | null;
          status?: 'not_configured' | 'configured' | 'connected' | 'error';
          config?: Json;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'integrations_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integrations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integrations_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      integration_credentials: {
        Row: {
          id: string;
          integration_id: string;
          credentials: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          credentials?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          credentials?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'integration_credentials_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: true;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
        ];
      };
      knowledge_sources: {
        Row: {
          id: string;
          name: string;
          type: string;
          path: string;
          source_type: string;
          external_id: string | null;
          integration_id: string | null;
          agent_id: string | null;
          folder_tag: string | null;
          project_tag: string | null;
          content_hash: string | null;
          last_fetched_at: string | null;
          last_modified_at: string | null;
          fetch_status: string;
          refresh_interval_minutes: number;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          path: string;
          source_type?: string;
          external_id?: string | null;
          integration_id?: string | null;
          agent_id?: string | null;
          folder_tag?: string | null;
          project_tag?: string | null;
          content_hash?: string | null;
          last_fetched_at?: string | null;
          last_modified_at?: string | null;
          fetch_status?: string;
          refresh_interval_minutes?: number;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          path?: string;
          source_type?: string;
          external_id?: string | null;
          integration_id?: string | null;
          agent_id?: string | null;
          folder_tag?: string | null;
          project_tag?: string | null;
          content_hash?: string | null;
          last_fetched_at?: string | null;
          last_modified_at?: string | null;
          fetch_status?: string;
          refresh_interval_minutes?: number;
          mime_type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      knowledge_content: {
        Row: {
          id: string;
          source_id: string;
          content: string;
          chunk_index: number;
          char_count: number;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          content: string;
          chunk_index?: number;
          char_count?: number;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          content?: string;
          chunk_index?: number;
          char_count?: number;
          fetched_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_content_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_sources';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'super_admin' | 'admin' | 'team_lead' | 'contributor' | 'viewer';
      agent_status: 'offline' | 'active' | 'disabled' | 'planned';
      override_scope_type: 'agent' | 'project' | 'environment' | 'hotfix';
      risk_tolerance: 'conservative' | 'balanced' | 'aggressive';
      task_status: 'backlog' | 'ready' | 'in_progress' | 'waiting' | 'review' | 'done';
      task_priority: 'low' | 'medium' | 'high' | 'critical';
      owner_type: 'human' | 'agent';
      sender_type: 'human' | 'agent' | 'system';
      integration_type: 'slack' | 'gitlab' | 'google_drive';
      integration_status: 'not_configured' | 'configured' | 'connected' | 'error';
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
