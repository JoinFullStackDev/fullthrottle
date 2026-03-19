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
import type { DocFolder } from '@/lib/types';
import { buildFolderTree } from '../service';

interface FolderTreeProps {
  folders: DocFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
}

interface FolderNodeProps {
  folder: DocFolder & { children?: DocFolder[] };
  depth: number;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
}

function FolderNode({ folder, depth, selectedFolderId, onSelectFolder, onCreateFolder, onDeleteFolder }: FolderNodeProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: depth * 1.5 + 0.5,
          pr: 0.5,
          py: 0.25,
          borderRadius: 1,
          cursor: 'pointer',
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
          '&:hover .folder-actions': { opacity: 1 },
        }}
        onClick={() => onSelectFolder(folder.id)}
      >
        <IconButton
          size="small"
          sx={{ p: 0, mr: 0.25, opacity: hasChildren ? 1 : 0, pointerEvents: hasChildren ? 'auto' : 'none' }}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        >
          {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
        </IconButton>
        {open ? (
          <FolderOpenIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />
        ) : (
          <FolderIcon sx={{ fontSize: 16, mr: 0.75, color: 'text.secondary' }} />
        )}
        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }} noWrap>
          {folder.name}
        </Typography>
        <Box className="folder-actions" sx={{ opacity: 0, display: 'flex', transition: 'opacity 0.15s' }}>
          <Tooltip title="New subfolder">
            <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); onCreateFolder(folder.id); }}>
              <AddIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete folder">
            <IconButton size="small" sx={{ p: 0.25, color: 'error.main' }} onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}>
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
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function FolderTree({ folders, selectedFolderId, onSelectFolder, onCreateFolder, onDeleteFolder }: FolderTreeProps) {
  const tree = buildFolderTree(folders);

  return (
    <Box>
      {/* Root level */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          cursor: 'pointer',
          bgcolor: selectedFolderId === null ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: selectedFolderId === null ? 'action.selected' : 'action.hover' },
        }}
        onClick={() => onSelectFolder(null)}
      >
        <FolderIcon sx={{ fontSize: 16, mr: 0.75, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>
          All Docs
        </Typography>
        <Tooltip title="New folder">
          <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); onCreateFolder(null); }}>
            <AddIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {tree.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder as DocFolder & { children?: DocFolder[] }}
          depth={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </Box>
  );
}
