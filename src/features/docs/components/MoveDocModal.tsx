'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import type { DocFolder } from '@/lib/types';
import { buildFolderTree } from '../service';

interface MoveDocModalProps {
  docId: string;
  folders: DocFolder[];
  currentFolderId: string | null;
  onConfirm: (docId: string, newFolderId: string | null) => void;
  onClose: () => void;
}

interface FolderPickerNodeProps {
  folder: DocFolder & { children?: DocFolder[] };
  depth: number;
  selectedId: string | null;
  currentFolderId: string | null;
  onSelect: (id: string | null) => void;
}

function FolderPickerNode({ folder, depth, selectedId, currentFolderId, onSelect }: FolderPickerNodeProps) {
  return (
    <>
      <ListItemButton
        selected={selectedId === folder.id}
        disabled={folder.id === currentFolderId}
        onClick={() => onSelect(folder.id)}
        sx={{ pl: depth * 2 + 1, py: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          <FolderIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        </ListItemIcon>
        <ListItemText
          primary={folder.name}
          primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem' }}
          secondary={folder.id === currentFolderId ? 'current location' : undefined}
          secondaryTypographyProps={{ fontSize: '0.7rem' }}
        />
      </ListItemButton>
      {(folder.children ?? []).map((child) => (
        <FolderPickerNode
          key={child.id}
          folder={child as DocFolder & { children?: DocFolder[] }}
          depth={depth + 1}
          selectedId={selectedId}
          currentFolderId={currentFolderId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function MoveDocModal({
  docId,
  folders,
  currentFolderId,
  onConfirm,
  onClose,
}: MoveDocModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tree = buildFolderTree(folders);

  const handleConfirm = () => {
    // selectedId === null means "move to root (no folder)"
    onConfirm(docId, selectedId);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Move document to…</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {folders.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ px: 2, py: 2 }}>
            No folders available.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {/* Root option */}
            <ListItemButton
              selected={selectedId === null}
              disabled={currentFolderId === null}
              onClick={() => setSelectedId(null)}
              sx={{ pl: 1, py: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText
                primary="No folder (root)"
                primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem', fontWeight: 500 }}
                secondary={currentFolderId === null ? 'current location' : undefined}
                secondaryTypographyProps={{ fontSize: '0.7rem' }}
              />
            </ListItemButton>

            {tree.map((folder) => (
              <FolderPickerNode
                key={folder.id}
                folder={folder as DocFolder & { children?: DocFolder[] }}
                depth={0}
                selectedId={selectedId}
                currentFolderId={currentFolderId}
                onSelect={setSelectedId}
              />
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedId === currentFolderId && selectedId !== null}
        >
          Move here
        </Button>
      </DialogActions>
    </Dialog>
  );
}
