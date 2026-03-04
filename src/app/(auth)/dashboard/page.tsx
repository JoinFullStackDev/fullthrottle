'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import RateReviewIcon from '@mui/icons-material/RateReviewOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardOutlined';
import Link from 'next/link';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import { StatCard } from '@/components/shared';
import { getAgentCount } from '@/features/agents/service';
import { getTaskCounts } from '@/features/tasks/service';
import { listAuditLogs } from '@/features/audit/service';
import type { AuditLogEntry } from '@/lib/types';

export default function DashboardPage() {
  const [agentCount, setAgentCount] = useState<number | null>(null);
  const [taskCounts, setTaskCounts] = useState<{ total: number; active: number; review: number } | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    getAgentCount().then(setAgentCount).catch(() => setAgentCount(0));
    getTaskCounts().then(setTaskCounts).catch(() => setTaskCounts({ total: 0, active: 0, review: 0 }));
    listAuditLogs({ limit: 5 }).then(setRecentActivity).catch(() => {});
  }, []);

  return (
    <PageContainer>
      <Header title="Dashboard" subtitle="Overview of your AI operations" />

      <SectionContainer>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatCard label="Agents" value={agentCount ?? '—'} icon={<SmartToyIcon />} />
          <StatCard label="Active Tasks" value={taskCounts?.active ?? '—'} icon={<AssignmentIcon />} />
          <StatCard label="In Review" value={taskCounts?.review ?? '—'} icon={<RateReviewIcon />} />
          <StatCard label="Total Tasks" value={taskCounts?.total ?? '—'} icon={<AssignmentIcon />} />
        </Box>
      </SectionContainer>

      <SectionContainer title="Recent Activity">
        <Card>
          {recentActivity.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No recent activity</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {recentActivity.map((entry, idx) => (
                <ListItemButton
                  key={entry.id}
                  divider={idx < recentActivity.length - 1}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                    <HistoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.primary">
                          {entry.actorName}
                        </Typography>
                        <Chip
                          label={entry.actionType.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={entry.reason}
                    secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                  />
                  <Typography variant="caption" color="text.disabled" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          )}
        </Card>
      </SectionContainer>

      <SectionContainer title="Quick Links">
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'View Agents', href: '/agents', icon: <SmartToyIcon /> },
            { label: 'Task Board', href: '/tasks', icon: <AssignmentIcon /> },
            { label: 'Audit Logs', href: '/admin', icon: <HistoryIcon /> },
          ].map((link) => (
            <Card
              key={link.href}
              component={Link}
              href={link.href}
              sx={{ flex: '1 1 0', minWidth: 200, textDecoration: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: 'primary.main' }}>{link.icon}</Box>
                  <Typography variant="body1" fontWeight={500}>{link.label}</Typography>
                </Box>
                <ArrowForwardIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionContainer>
    </PageContainer>
  );
}
