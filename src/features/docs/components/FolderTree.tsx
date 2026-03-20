'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import type { DocFolder } from '@/lib/types';
import { buildFolderTree } from '../service';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FolderTreeProps {
  folders: DocFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null) => void;
}

interface FolderNodeProps {
  folder: DocFolder & { children?: DocFolder[] };
  depth: number;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  activeDragId: string | null;
  allFolders: DocFolder[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns all descendant ids of a folder (including itself) */
function getDescendantIds(folderId: string, folders: DocFolder[]): Set<string> {
  const result = new Set<string>([folderId]);
  const queue = [folderId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const f of folders) {
      if (f.parentId === current) {
        result.add(f.id);
        queue.push(f.id);
      }
    }
  }
  return result;
}

// ─── Draggable + Droppable folder row ─────────────────────────────────────────

function FolderNode({
  folder,
  depth,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  activeDragId,
  allFolders,
}: FolderNodeProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isSelected = selectedFolderId === folder.id;

  // Draggable
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: folder.id,
  });

  // Droppable — determine if this is a valid drop target
  const isDraggedDescendant =
    activeDragId !== null && getDescendantIds(activeDragId, allFolders).has(folder.id);
  const isDropDisabled = activeDragId === folder.id || isDraggedDescendant;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${folder.id}`,
    disabled: isDropDisabled,
  });

  const showDropHighlight = isOver && !isDropDisabled;

  return (
    <Box ref={setDropRef}>
      <Box
        ref={setDragRef}
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: depth * 1.5 + 0.5,
          pr: 0.5,
          py: 0.25,
          borderRadius: 1,
          cursor: isDragging ? 'grabbing' : 'pointer',
          bgcolor: showDropHighlight
            ? 'primary.light'
            : isSelected
            ? 'action.selected'
            : 'transparent',
          border: showDropHighlight ? '1.5px dashed' : '1.5px solid transparent',
          borderColor: showDropHighlight ? 'primary.main' : 'transparent',
          opacity: isDragging ? 0.4 : 1,
          transition: 'background-color 0.1s, border-color 0.1s, opacity 0.1s',
          '&:hover': {
            bgcolor: showDropHighlight
              ? 'primary.light'
              : isSelected
              ? 'action.selected'
              : 'action.hover',
          },
          '&:hover .folder-actions': { opacity: 1 },
        }}
        onClick={(e) => {
          // Suppress click during/after drag
          if (isDragging) return;
          e.stopPropagation();
          onSelectFolder(folder.id);
        }}
      >
        {/* Expand/collapse button — stop drag propagation */}
        <IconButton
          size="small"
          sx={{
            p: 0,
            mr: 0.25,
            opacity: hasChildren ? 1 : 0,
            pointerEvents: hasChildren ? 'auto' : 'none',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {open ? (
            <ExpandMoreIcon sx={{ fontSize: 14 }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>

        {open ? (
          <FolderOpenIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />
        ) : (
          <FolderIcon sx={{ fontSize: 16, mr: 0.75, color: 'text.secondary' }} />
        )}

        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }} noWrap>
          {folder.name}
        </Typography>

        <Box
          className="folder-actions"
          sx={{ opacity: 0, display: 'flex', transition: 'opacity 0.15s' }}
        >
          <Tooltip title="New subfolder">
            <IconButton
              size="small"
              sx={{ p: 0.25 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(folder.id);
              }}
            >
              <AddIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete folder">
            <IconButton
              size="small"
              sx={{ p: 0.25, color: 'error.main' }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
            >
              <DeleteIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {open && hasChildren && (
        <Box>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child as DocFolder & { children?: DocFolder[] }}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              activeDragId={activeDragId}
              allFolders={allFolders}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Root drop zone ───────────────────────────────────────────────────────────

function RootDropZone({
  activeDragId,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
}: {
  activeDragId: string | null;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'drop-root' });

  const showDropHighlight = isOver && activeDragId !== null;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        cursor: 'pointer',
        bgcolor: showDropHighlight
          ? 'primary.light'
          : selectedFolderId === null
          ? 'action.selected'
          : 'transparent',
        border: showDropHighlight ? '1.5px dashed' : '1.5px solid transparent',
        borderColor: showDropHighlight ? 'primary.main' : 'transparent',
        transition: 'background-color 0.1s, border-color 0.1s',
        '&:hover': {
          bgcolor:
            showDropHighlight
              ? 'primary.light'
              : selectedFolderId === null
              ? 'action.selected'
              : 'action.hover',
        },
      }}
      onClick={() => onSelectFolder(null)}
    >
      {showDropHighlight ? (
        <HomeIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />
      ) : (
        <FolderIcon sx={{ fontSize: 16, mr: 0.75, color: 'text.secondary' }} />
      )}
      <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>
        {showDropHighlight ? 'Move to root' : 'All Docs'}
      </Typography>
      <Tooltip title="New folder">
        <IconButton
          size="small"
          sx={{ p: 0.25 }}
          onClick={(e) => {
            e.stopPropagation();
            onCreateFolder(null);
          }}
        >
          <AddIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Drag overlay label ───────────────────────────────────────────────────────

function DragOverlayContent({ name }: { name: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 4,
        gap: 0.75,
        opacity: 0.95,
      }}
    >
      <FolderIcon sx={{ fontSize: 16, color: 'primary.main' }} />
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        {name}
      </Typography>
    </Box>
  );
}

// ─── Main FolderTree ──────────────────────────────────────────────────────────

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderTreeProps) {
  const tree = buildFolderTree(folders);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeDragFolder = activeDragId ? folders.find((f) => f.id === activeDragId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || !onMoveFolder) return;

    const draggedId = String(active.id);
    const dropId = String(over.id);

    // Determine new parent
    let newParentId: string | null;
    if (dropId === 'drop-root') {
      newParentId = null;
    } else {
      // dropId is "drop-<folderId>"
      newParentId = dropId.replace(/^drop-/, '');
    }

    // Client-side guard: same parent (no-op)
    const dragged = folders.find((f) => f.id === draggedId);
    if (dragged && dragged.parentId === newParentId) return;

    // Client-side guard: self or descendant
    if (newParentId !== null) {
      const descendants = getDescendantIds(draggedId, folders);
      if (descendants.has(newParentId)) return;
    }

    onMoveFolder(draggedId, newParentId);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Box>
        <RootDropZone
          activeDragId={activeDragId}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
        />

        {tree.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder as DocFolder & { children?: DocFolder[] }}
            depth={0}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            activeDragId={activeDragId}
            allFolders={folders}
          />
        ))}
      </Box>

      <DragOverlay>
        {activeDragFolder ? <DragOverlayContent name={activeDragFolder.name} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
