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

interface KanbanBoardProps {
  tasks: Task[];
  ownerNames?: Record<string, string>;
  onTaskMove?: (taskId: string, newStatus: TaskStatusValue) => void;
}

export default function KanbanBoard({ tasks: initialTasks, ownerNames, onTaskMove }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const getColumnTasks = useCallback(
    (status: TaskStatusValue) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatusValue;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
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
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
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
                            <TaskCard task={task} ownerName={ownerNames?.[task.ownerId]} />
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
