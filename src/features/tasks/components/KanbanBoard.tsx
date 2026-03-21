'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { Task } from '@/lib/types';
import type { TaskStatusValue } from '@/lib/constants';
import { KANBAN_COLUMN_ORDER, TASK_STATUS_LABELS } from '@/lib/constants';
import TaskCard from './TaskCard';

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export type AgentState = 'active' | 'waiting' | 'stalled' | 'idle';

export function getAgentState(task: Task): AgentState {
  if (task.status === 'waiting') return 'waiting';

  if (task.status === 'in_progress') {
    const stalledByAge =
      new Date().getTime() - new Date(task.updatedAt).getTime() > STALE_THRESHOLD_MS;
    const hasRunId = Boolean(task.runtimeRunId);

    if (hasRunId && !stalledByAge) return 'active';
    return 'stalled';
  }

  return 'idle';
}

interface ColumnStateCounts {
  active: number;
  waiting: number;
  stalled: number;
}

function getColumnStateCounts(tasks: Task[]): ColumnStateCounts {
  const counts: ColumnStateCounts = { active: 0, waiting: 0, stalled: 0 };
  for (const t of tasks) {
    const state = getAgentState(t);
    if (state === 'active') counts.active++;
    else if (state === 'waiting') counts.waiting++;
    else if (state === 'stalled') counts.stalled++;
  }
  return counts;
}

interface KanbanBoardProps {
  tasks: Task[];
  ownerNames?: Record<string, string>;
  onTaskMove?: (taskId: string, newStatus: TaskStatusValue) => void;
  onReengage?: (taskId: string) => Promise<void>;
}

export default function KanbanBoard({
  tasks: initialTasks,
  ownerNames,
  onTaskMove,
  onReengage,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Sync when parent passes new tasks (e.g. after re-engage or refetch)
  const [prevInitial, setPrevInitial] = useState(initialTasks);
  if (initialTasks !== prevInitial) {
    setPrevInitial(initialTasks);
    setTasks(initialTasks);
  }

  const getColumnTasks = useCallback(
    (status: TaskStatusValue) => tasks.filter((t) => t.status === status),
    [tasks],
  );

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId as TaskStatusValue;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t)),
    );
    onTaskMove?.(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 400,
        }}
      >
        {KANBAN_COLUMN_ORDER.map((status) => {
          const columnTasks = getColumnTasks(status);
          const stateCounts = getColumnStateCounts(columnTasks);
          const hasAgentActivity =
            stateCounts.active + stateCounts.waiting + stateCounts.stalled > 0;

          return (
            <Paper
              key={status}
              sx={{
                flex: '0 0 260px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                maxHeight: 'calc(100vh - 280px)',
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  pt: 1.5,
                  pb: hasAgentActivity ? 0.75 : 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {TASK_STATUS_LABELS[status]}
                  </Typography>
                  <Chip
                    label={columnTasks.length}
                    size="small"
                    sx={{ height: 22, minWidth: 22, fontSize: '0.7rem' }}
                  />
                </Box>
                {hasAgentActivity && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mt: 0.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    {stateCounts.active > 0 && (
                      <Typography variant="caption" sx={{ color: '#4CAF50', fontSize: '0.65rem' }}>
                        🟢 {stateCounts.active} active
                      </Typography>
                    )}
                    {stateCounts.waiting > 0 && (
                      <Typography variant="caption" sx={{ color: '#FFA726', fontSize: '0.65rem' }}>
                        🟡 {stateCounts.waiting} waiting
                      </Typography>
                    )}
                    {stateCounts.stalled > 0 && (
                      <Typography variant="caption" sx={{ color: '#EF5350', fontSize: '0.65rem' }}>
                        🔴 {stateCounts.stalled} stalled
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      flex: 1,
                      p: 1,
                      overflowY: 'auto',
                      minHeight: 60,
                      bgcolor: snapshot.isDraggingOver
                        ? 'action.hover'
                        : 'transparent',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <Box
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            sx={{
                              opacity: dragSnapshot.isDragging ? 0.9 : 1,
                            }}
                          >
                            <TaskCard
                              task={task}
                              ownerName={ownerNames?.[task.ownerId]}
                              agentState={getAgentState(task)}
                              onReengage={onReengage}
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          );
        })}
      </Box>
    </DragDropContext>
  );
}
