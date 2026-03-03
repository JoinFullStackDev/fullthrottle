'use client';

import { useState, useCallback } from 'react';
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
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { PersonaOverride, PersonaRule, PersonaSkill } from '@/lib/types';
import type { RiskToleranceValue } from '@/lib/constants';
import { RiskTolerance } from '@/lib/constants';

interface PersonaEditorPanelProps {
  override: PersonaOverride;
  onSave?: (updated: PersonaOverride) => void;
  onCancel?: () => void;
}

export default function PersonaEditorPanel({ override, onSave, onCancel }: PersonaEditorPanelProps) {
  const [rules, setRules] = useState<PersonaRule[]>(override.rules);
  const [skills, setSkills] = useState<PersonaSkill[]>(override.skills);
  const [templates, setTemplates] = useState<Record<string, string>>(override.templates);
  const [knowledgeScope, setKnowledgeScope] = useState(override.knowledgeScope);
  const [escalation, setEscalation] = useState(override.escalationRules);
  const [riskTolerance, setRiskTolerance] = useState<RiskToleranceValue>(override.riskTolerance);
  const [reason, setReason] = useState('');
  const [newRuleText, setNewRuleText] = useState('');
  const [newSkillName, setNewSkillName] = useState('');

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

  const handleSave = () => {
    onSave?.({
      ...override,
      rules,
      skills,
      templates,
      knowledgeScope,
      escalationRules: escalation,
      riskTolerance,
    });
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

      {/* Rules — orderable via drag-and-drop */}
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: dragSnapshot.isDragging ? 'action.hover' : 'transparent',
                          }}
                        >
                          <Box
                            {...dragProvided.dragHandleProps}
                            sx={{ color: 'text.disabled', display: 'flex', cursor: 'grab' }}
                          >
                            <DragIndicatorIcon fontSize="small" />
                          </Box>
                          <Switch
                            checked={rule.enabled}
                            onChange={() => handleRuleToggle(rule.id)}
                            size="small"
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              textDecoration: rule.enabled ? 'none' : 'line-through',
                              color: rule.enabled ? 'text.primary' : 'text.disabled',
                            }}
                          >
                            {rule.text}
                          </Typography>
                          <IconButton size="small" onClick={() => handleRemoveRule(rule.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
            <TextField
              placeholder="Add a rule..."
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              fullWidth
            />
            <IconButton onClick={handleAddRule} color="primary">
              <AddIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Skills</Typography>
          {skills.map((skill) => (
            <Box
              key={skill.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Switch
                checked={skill.enabled}
                onChange={() => handleSkillToggle(skill.id)}
                size="small"
              />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  color: skill.enabled ? 'text.primary' : 'text.disabled',
                }}
              >
                {skill.name}
              </Typography>
              <IconButton size="small" onClick={() => handleRemoveSkill(skill.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              placeholder="Add a skill..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              fullWidth
            />
            <IconButton onClick={handleAddSkill} color="primary">
              <AddIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Output Templates</Typography>
          {Object.entries(templates).map(([key, value]) => (
            <Box key={key} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {key}
              </Typography>
              <TextField
                value={value}
                onChange={(e) =>
                  setTemplates((prev) => ({ ...prev, [key]: e.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Knowledge Scope */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Knowledge Scope</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Allowed Folders
            </Typography>
            <TextField
              value={knowledgeScope.allowedFolders.join(', ')}
              onChange={(e) =>
                setKnowledgeScope((prev) => ({
                  ...prev,
                  allowedFolders: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
              fullWidth
              helperText="Comma-separated list"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Allowed Projects
            </Typography>
            <TextField
              value={knowledgeScope.allowedProjects.join(', ')}
              onChange={(e) =>
                setKnowledgeScope((prev) => ({
                  ...prev,
                  allowedProjects: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
              fullWidth
              helperText="Comma-separated list"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Restricted Sources
            </Typography>
            <TextField
              value={knowledgeScope.restrictedSources.join(', ')}
              onChange={(e) =>
                setKnowledgeScope((prev) => ({
                  ...prev,
                  restrictedSources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
              fullWidth
              helperText="Comma-separated list"
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={knowledgeScope.preferNewest}
                onChange={(e) =>
                  setKnowledgeScope((prev) => ({ ...prev, preferNewest: e.target.checked }))
                }
              />
            }
            label="Prefer newest documents"
          />
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Escalation Rules</Typography>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Threshold</FormLabel>
            <RadioGroup
              row
              value={escalation.threshold}
              onChange={(e) =>
                setEscalation((prev) => ({
                  ...prev,
                  threshold: e.target.value as 'strict' | 'flexible',
                }))
              }
            >
              <FormControlLabel value="strict" control={<Radio size="small" />} label="Strict" />
              <FormControlLabel value="flexible" control={<Radio size="small" />} label="Flexible" />
            </RadioGroup>
          </FormControl>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Conditions
            </Typography>
            <TextField
              value={escalation.conditions.join(', ')}
              onChange={(e) =>
                setEscalation((prev) => ({
                  ...prev,
                  conditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
              fullWidth
              helperText="Comma-separated escalation conditions"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Risk Tolerance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl>
            <FormLabel>
              <Typography variant="h3" sx={{ mb: 1 }}>Risk Tolerance</Typography>
            </FormLabel>
            <RadioGroup
              row
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value as RiskToleranceValue)}
            >
              <FormControlLabel
                value={RiskTolerance.CONSERVATIVE}
                control={<Radio size="small" />}
                label="Conservative"
              />
              <FormControlLabel
                value={RiskTolerance.BALANCED}
                control={<Radio size="small" />}
                label="Balanced"
              />
              <FormControlLabel
                value={RiskTolerance.AGGRESSIVE}
                control={<Radio size="small" />}
                label="Aggressive"
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Reason + Actions */}
      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Submit Changes</Typography>
          <TextField
            label="Reason for change (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!reason.trim()}
            >
              Save Draft
            </Button>
            <Button variant="outlined" disabled={!reason.trim()}>
              Submit for Approval
            </Button>
            <Button variant="outlined" color="inherit" onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
