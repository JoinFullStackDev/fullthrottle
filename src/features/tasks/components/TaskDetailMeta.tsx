'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import ChatIcon from '@mui/icons-material/ChatOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { SectionContainer } from '@/components/layout';
import MarkdownRenderer from '@/features/conversations/components/MarkdownRenderer';
import { getKnowledgeSourcesByIds, getKnowledgeContent } from '@/features/knowledge/service';
import type { Task, KnowledgeSource } from '@/lib/types';

const AGENT_LABELS: Record<string, string> = {
  axel: 'Axel (Engineering)',
  riff: 'Riff (Product)',
  torque: 'Torque (QA)',
};

interface Props {
  task: Task;
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function LinkedDocuments({ knowledgeSourceIds }: { knowledgeSourceIds: string[] }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getKnowledgeSourcesByIds(knowledgeSourceIds)
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, [knowledgeSourceIds]);

  const handleToggle = useCallback(async (sourceId: string) => {
    if (expandedId === sourceId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sourceId);
    if (!docContent[sourceId]) {
      setLoadingContent(sourceId);
      const content = await getKnowledgeContent(sourceId).catch(() => null);
      setDocContent((prev) => ({ ...prev, [sourceId]: content ?? 'Unable to load content.' }));
      setLoadingContent(null);
    }
  }, [expandedId, docContent]);

  if (loading) {
    return (
      <SectionContainer title="Documents">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      </SectionContainer>
    );
  }

  if (sources.length === 0) return null;

  return (
    <SectionContainer title={`Documents (${sources.length})`}>
      {sources.map((source) => (
        <Box key={source.id} sx={{ mb: 2 }}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
              ...(expandedId === source.id ? { borderColor: 'primary.main' } : {}),
            }}
            onClick={() => handleToggle(source.id)}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DescriptionIcon sx={{ fontSize: 20, color: 'primary.light' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>{source.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {source.sourceType} &middot; {source.mimeType ?? 'Document'}
                    {source.lastFetchedAt ? ` &middot; Fetched ${new Date(source.lastFetchedAt).toLocaleDateString()}` : ''}
                  </Typography>
                </Box>
                {source.path && (
                  <Link
                    href={source.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Open original
                  </Link>
                )}
                <Chip
                  label={source.fetchStatus}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.65rem' }}
                />
              </Box>
            </CardContent>
          </Card>
          {expandedId === source.id && (
            <Card sx={{ mt: 0.5, borderColor: 'primary.dark' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Document Content
                  </Typography>
                  <IconButton size="small" onClick={() => setExpandedId(null)}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                {loadingContent === source.id ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      maxHeight: 400,
                      overflow: 'auto',
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <MarkdownRenderer content={docContent[source.id] ?? ''} />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      ))}
    </SectionContainer>
  );
}

function IntakeParentMeta({ task }: { task: Task }) {
  const meta = task.metadata;
  const source = meta.source as Record<string, unknown> | undefined;
  const attachments = (meta.attachments as string[]) ?? [];
  const requestedOutcome = meta.requestedOutcome as string | undefined;
  const rawRequest = meta.rawRequest as string | undefined;
  const knowledgeSourceIds = (meta.knowledgeSourceIds as string[]) ?? [];

  return (
    <>
      {knowledgeSourceIds.length > 0 && (
        <LinkedDocuments knowledgeSourceIds={knowledgeSourceIds} />
      )}

      {requestedOutcome && (
        <SectionContainer title="Requested Outcome">
          <Card>
            <CardContent>
              <MarkdownRenderer content={requestedOutcome} />
            </CardContent>
          </Card>
        </SectionContainer>
      )}

      {rawRequest && (
        <Accordion
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:before': { display: 'none' },
            mb: 3,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={500}>Raw Request</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                bgcolor: 'background.default',
                borderRadius: 1,
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'text.secondary',
              }}
            >
              {rawRequest}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {source && (
        <SectionContainer title="Source">
          <Card>
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.5, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Chip label={String(source.type ?? '')} size="small" variant="outlined" />

                {source.channelId ? (
                  <>
                    <Typography variant="caption" color="text.secondary">Channel</Typography>
                    <Typography variant="body2">{String(source.channelId)}</Typography>
                  </>
                ) : null}
                {source.userId ? (
                  <>
                    <Typography variant="caption" color="text.secondary">User</Typography>
                    <Typography variant="body2">{String(source.userId)}</Typography>
                  </>
                ) : null}
                {source.permalink ? (
                  <>
                    <Typography variant="caption" color="text.secondary">Permalink</Typography>
                    <Link
                      href={String(source.permalink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                    >
                      View in Slack
                    </Link>
                  </>
                ) : null}
                {source.messageTs ? (
                  <>
                    <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                    <Typography variant="body2" color="text.secondary">{String(source.messageTs)}</Typography>
                  </>
                ) : null}
              </Box>
            </CardContent>
          </Card>
        </SectionContainer>
      )}

      {attachments.length > 0 && (
        <SectionContainer title="Attachments">
          <Card>
            <CardContent>
              {attachments.map((url, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Link href={url} target="_blank" rel="noopener noreferrer" variant="body2">
                    {url}
                  </Link>
                </Box>
              ))}
            </CardContent>
          </Card>
        </SectionContainer>
      )}

      {task.externalRef && (
        <MetaField label="External Reference (Idempotency Key)">
          <Typography variant="body2" color="text.disabled" fontFamily="monospace" fontSize="0.8rem">
            {task.externalRef}
          </Typography>
        </MetaField>
      )}
    </>
  );
}

function DerivedTaskMeta({ task }: { task: Task }) {
  const meta = task.metadata;
  const acceptanceCriteria = meta.acceptanceCriteria as string | undefined;
  const sourceCitations = (meta.sourceCitations as string[]) ?? [];
  const suggestedAgent = meta.suggestedAgent as string | undefined;
  const knowledgeSourceIds = (meta.knowledgeSourceIds as string[]) ?? [];

  return (
    <>
      {knowledgeSourceIds.length > 0 && (
        <LinkedDocuments knowledgeSourceIds={knowledgeSourceIds} />
      )}

      {suggestedAgent && (
        <SectionContainer title="Suggested Agent">
          <Card>
            <CardContent>
              <Chip
                icon={<SmartToyIcon sx={{ fontSize: 16 }} />}
                label={AGENT_LABELS[suggestedAgent] ?? suggestedAgent}
                variant="outlined"
                sx={{ borderColor: 'primary.main', color: 'primary.light' }}
              />
            </CardContent>
          </Card>
        </SectionContainer>
      )}

      {acceptanceCriteria && (
        <SectionContainer title="Acceptance Criteria">
          <Card>
            <CardContent>
              <MarkdownRenderer content={acceptanceCriteria} />
            </CardContent>
          </Card>
        </SectionContainer>
      )}

      {sourceCitations.length > 0 && (
        <SectionContainer title="Source Citations">
          <Card>
            <CardContent>
              <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                {sourceCitations.map((cite, i) => (
                  <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
                    {cite}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </SectionContainer>
      )}
    </>
  );
}

export default function TaskDetailMeta({ task }: Props) {
  const intakeType = task.metadata?.intakeType as string | undefined;

  if (intakeType === 'parent') return <IntakeParentMeta task={task} />;
  if (intakeType === 'derived') return <DerivedTaskMeta task={task} />;

  return (
    <Typography variant="body2" color="text.secondary">
      No additional metadata for this task.
    </Typography>
  );
}
