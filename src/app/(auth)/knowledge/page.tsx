'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import { listActiveProjects } from '@/features/projects/service';
import { listKnowledgeSources, refreshKnowledgeSource } from '@/features/knowledge/service';
import { KnowledgeSourceTable, KnowledgePreviewDialog, UploadDialog, DriveBrowserDialog } from '@/features/knowledge/components';
import { listAgents } from '@/features/agents/service';
import type { KnowledgeSource, Agent, Project } from '@/lib/types';

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<KnowledgeSource | null>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listKnowledgeSources();
      setSources(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
    listActiveProjects().then(setProjects).catch(() => {});
    listAgents().then(setAgents).catch(() => {});
  }, [loadSources]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      setDriveOpen(true);
    }
  }, []);

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      await refreshKnowledgeSource(id);
      await loadSources();
    } catch {
      /* ignore */
    } finally {
      setRefreshingId(null);
    }
  };

  const filteredSources = useMemo(() => {
    if (projectFilter === 'all') return sources;
    return sources.filter((s) => s.projectTag === projectFilter);
  }, [sources, projectFilter]);

  return (
    <PageContainer>
      <Header
        title="Knowledge"
        subtitle="Upload documents and browse Google Drive to build the team knowledge base"
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Document
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudIcon />}
              onClick={() => setDriveOpen(true)}
            >
              Browse Google Drive
            </Button>
          </Box>
        }
      />

      <SectionContainer
        title="Knowledge Sources"
        actions={
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Project</InputLabel>
            <Select
              value={projectFilter}
              label="Filter by Project"
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.slug}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      >
        <KnowledgeSourceTable
          sources={filteredSources}
          loading={loading}
          refreshingId={refreshingId}
          onRefresh={handleRefresh}
          onView={setPreviewSource}
        />
      </SectionContainer>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={loadSources}
        projects={projects}
        agents={agents}
      />

      <DriveBrowserDialog
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        onRegisterComplete={loadSources}
        projects={projects}
        agents={agents}
      />

      <KnowledgePreviewDialog
        open={!!previewSource}
        onClose={() => setPreviewSource(null)}
        source={previewSource}
      />
    </PageContainer>
  );
}
