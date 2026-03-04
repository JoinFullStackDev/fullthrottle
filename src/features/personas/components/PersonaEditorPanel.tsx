'use client';

import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { listKnowledgeSources } from '@/features/knowledge/service';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { PersonaOverride, PersonaRule, PersonaSkill } from '@/lib/types';
import type { RiskToleranceValue } from '@/lib/constants';
import { RiskTolerance } from '@/lib/constants';
import { updateOverride } from '@/features/personas/service';
import { useAuth } from '@/hooks/useAuth';

function bumpVersion(version: string): string {
  const match = version.match(/^v?(\d+)\.(\d+)$/);
  if (!match) return version;
  return `${match[1]}.${Number(match[2]) + 1}`;
}

interface PersonaEditorPanelProps {
  override: PersonaOverride;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function PersonaEditorPanel({ override, onSave, onCancel }: PersonaEditorPanelProps) {
  const { user: currentUser } = useAuth();
  const canApprove = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const [rules, setRules] = useState<PersonaRule[]>(override.rules);
  const [skills, setSkills] = useState<PersonaSkill[]>(override.skills);
  const [templates, setTemplates] = useState<Record<string, string>>(override.templates);
  const [knowledgeScope, setKnowledgeScope] = useState(override.knowledgeScope);
  const [escalation, setEscalation] = useState(override.escalationRules);
  const [riskTolerance, setRiskTolerance] = useState<RiskToleranceValue>(override.riskTolerance);
  const [reason, setReason] = useState('');
  const [newRuleText, setNewRuleText] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [availableFolderTags, setAvailableFolderTags] = useState<string[]>([]);
  const [availableProjectTags, setAvailableProjectTags] = useState<string[]>([]);

  useEffect(() => {
    listKnowledgeSources().then((sources) => {
      const folders = new Set<string>();
      const projects = new Set<string>();
      for (const s of sources) {
        if (s.folderTag) folders.add(s.folderTag);
        if (s.projectTag) projects.add(s.projectTag);
      }
      setAvailableFolderTags(Array.from(folders).sort());
      setAvailableProjectTags(Array.from(projects).sort());
    }).catch(() => {});
  }, []);

  const handleRuleToggle = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setRules((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, text: newRuleText.trim(), enabled: true },
    ]);
    setNewRuleText('');
  };

  const handleRemoveRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleRuleReorder = useCallback((result: DropResult) => {
    if (!result.destination) return;
    setRules((prev) => {
      const items = Array.from(prev);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, moved);
      return items;
    });
  }, []);

  const handleSkillToggle = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, name: newSkillName.trim(), enabled: true },
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  const handleSave = async (approve = false) => {
    setSaving(true);
    setSaveError(null);
    try {
      const newVersion = bumpVersion(override.version);
      const updates: Partial<PersonaOverride> = {
        rules,
        skills,
        templates,
        knowledgeScope,
        escalationRules: escalation,
        riskTolerance,
        version: newVersion,
      };

      if (approve && canApprove && currentUser) {
        updates.approvedBy = currentUser.id;
      }

      await updateOverride(override.id, updates, {
        actorId: currentUser?.id ?? override.createdBy,
        reason,
      });
      onSave?.();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Chip label={override.scopeType} size="small" variant="outlined" />
        <Chip label={`v${override.version}`} size="small" variant="outlined" />
        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
          {override.approvedBy ? 'Approved' : 'Pending approval'}
        </Typography>
      </Box>

      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Rules</Typography>
          <DragDropContext onDragEnd={handleRuleReorder}>
            <Droppable droppableId="rules-list">
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps}>
                  {rules.map((rule, index) => (
                    <Draggable key={rule.id} draggableId={rule.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <Box
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1, py: 1,
                            borderBottom: 1, borderColor: 'divider',
                            bgcolor: dragSnapshot.isDragging ? 'action.hover' : 'transparent',
                          }}
                        >
                          <Box {...dragProvided.dragHandleProps} sx={{ color: 'text.disabled', display: 'flex', cursor: 'grab' }}>
                            <DragIndicatorIcon fontSize="small" />
                          </Box>
                          <Switch checked={rule.enabled} onChange={() => handleRuleToggle(rule.id)} size="small" />
                          <Typography variant="body2" sx={{ flex: 1, textDecoration: rule.enabled ? 'none' : 'line-through', color: rule.enabled ? 'text.primary' : 'text.disabled' }}>
                            {rule.text}
                          </Typography>
                          <IconButton size="small" onClick={() => handleRemoveRule(rule.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField placeholder="Add a rule..." value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddRule()} fullWidth />
            <IconButton onClick={handleAddRule} color="primary"><AddIcon /></IconButton>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Skills</Typography>
          {skills.map((skill) => (
            <Box key={skill.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Switch checked={skill.enabled} onChange={() => handleSkillToggle(skill.id)} size="small" />
              <Typography variant="body2" sx={{ flex: 1, color: skill.enabled ? 'text.primary' : 'text.disabled' }}>{skill.name}</Typography>
              <IconButton size="small" onClick={() => handleRemoveSkill(skill.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField placeholder="Add a skill..." value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} fullWidth />
            <IconButton onClick={handleAddSkill} color="primary"><AddIcon /></IconButton>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Output Templates</Typography>
          {Object.entries(templates).map(([key, value]) => (
            <Box key={key} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>{key}</Typography>
              <TextField value={value} onChange={(e) => setTemplates((prev) => ({ ...prev, [key]: e.target.value }))} fullWidth multiline minRows={2} />
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Knowledge Scope</Typography>
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={availableFolderTags}
              value={knowledgeScope.allowedFolders}
              onChange={(_, newValue) => setKnowledgeScope((prev) => ({ ...prev, allowedFolders: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  return <Chip key={key} label={option} size="small" variant="outlined" {...rest} />;
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Allowed Folders" placeholder="Type or select folder tags" helperText="Folder tags from registered knowledge sources" />
              )}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={availableProjectTags}
              value={knowledgeScope.allowedProjects}
              onChange={(_, newValue) => setKnowledgeScope((prev) => ({ ...prev, allowedProjects: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  return <Chip key={key} label={option} size="small" variant="outlined" {...rest} />;
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Allowed Projects" placeholder="Type or select project tags" helperText="Project tags from registered knowledge sources" />
              )}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[...availableFolderTags, ...availableProjectTags]}
              value={knowledgeScope.restrictedSources}
              onChange={(_, newValue) => setKnowledgeScope((prev) => ({ ...prev, restrictedSources: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  return <Chip key={key} label={option} size="small" variant="outlined" color="error" {...rest} />;
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Restricted Sources" placeholder="Sources to exclude" helperText="These tags/names will be excluded" />
              )}
            />
          </Box>
          <FormControlLabel control={<Switch checked={knowledgeScope.preferNewest} onChange={(e) => setKnowledgeScope((prev) => ({ ...prev, preferNewest: e.target.checked }))} />} label="Prefer newest documents" />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Escalation Rules</Typography>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Threshold</FormLabel>
            <RadioGroup row value={escalation.threshold} onChange={(e) => setEscalation((prev) => ({ ...prev, threshold: e.target.value as 'strict' | 'flexible' }))}>
              <FormControlLabel value="strict" control={<Radio size="small" />} label="Strict" />
              <FormControlLabel value="flexible" control={<Radio size="small" />} label="Flexible" />
            </RadioGroup>
          </FormControl>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Conditions</Typography>
            <TextField value={escalation.conditions.join(', ')} onChange={(e) => setEscalation((prev) => ({ ...prev, conditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} fullWidth helperText="Comma-separated escalation conditions" />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl>
            <FormLabel><Typography variant="h3" sx={{ mb: 1 }}>Risk Tolerance</Typography></FormLabel>
            <RadioGroup row value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value as RiskToleranceValue)}>
              <FormControlLabel value={RiskTolerance.CONSERVATIVE} control={<Radio size="small" />} label="Conservative" />
              <FormControlLabel value={RiskTolerance.BALANCED} control={<Radio size="small" />} label="Balanced" />
              <FormControlLabel value={RiskTolerance.AGGRESSIVE} control={<Radio size="small" />} label="Aggressive" />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Submit Changes</Typography>
          <TextField label="Reason for change (required)" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth required multiline minRows={2} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canApprove ? (
              <Button variant="contained" onClick={() => handleSave(true)} disabled={!reason.trim() || saving}>
                {saving ? <CircularProgress size={20} color="inherit" /> : 'Save & Apply'}
              </Button>
            ) : (
              <>
                <Button variant="contained" onClick={() => handleSave(false)} disabled={!reason.trim() || saving}>
                  {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Draft'}
                </Button>
                <Button variant="outlined" disabled={!reason.trim() || saving} onClick={() => handleSave(false)}>
                  Submit for Approval
                </Button>
              </>
            )}
            <Button variant="outlined" color="inherit" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
