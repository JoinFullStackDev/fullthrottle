'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import UploadIcon from '@mui/icons-material/UploadOutlined';
import FolderTree from '@/features/docs/components/FolderTree';
import DocEditor from '@/features/docs/components/DocEditor';
import {
  listFolders,
  listDocs,
  listDocFiles,
  createFolder,
  deleteFolder,
  updateFolder,
  createDoc,
  deleteDoc,
  uploadDocFile,
  deleteDocFile,
} from '@/features/docs/service';
import type { Doc, DocFolder, DocFile } from '@/lib/types';

type NewFolderState = { open: boolean; parentId: string | null };

function fileIcon(mimeType: string | null) {
  if (!mimeType) return <InsertDriveFileIcon fontSize="small" />;
  if (mimeType.startsWith('image/')) return <ImageIcon fontSize="small" />;
  return <InsertDriveFileIcon fontSize="small" />;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocsPage() {
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [files, setFiles] = useState<DocFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFolder, setNewFolder] = useState<NewFolderState>({ open: false, parentId: null });
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadFolders = useCallback(async () => {
    const data = await listFolders();
    setFolders(data);
  }, []);

  const loadContents = useCallback(async (folderId: string | null) => {
    setLoading(true);
    try {
      const [docsData, filesData] = await Promise.all([
        listDocs(folderId),
        listDocFiles(folderId),
      ]);
      setDocs(docsData);
      setFiles(filesData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadContents(selectedFolderId);
    setActiveDoc(null);
  }, [selectedFolderId, loadContents]);

  const handleSelectFolder = (id: string | null) => setSelectedFolderId(id);

  const handleCreateFolder = (parentId: string | null) => {
    setNewFolderName('');
    setNewFolder({ open: true, parentId });
  };

  const handleConfirmFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName.trim(), parentId: newFolder.parentId });
    setNewFolder({ open: false, parentId: null });
    await loadFolders();
  };

  const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
    try {
      await updateFolder(folderId, { parentId: newParentId });
      await loadFolders();
    } catch (err) {
      console.error('Failed to move folder:', err);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its contents?')) return;
    await deleteFolder(id);
    if (selectedFolderId === id) setSelectedFolderId(null);
    await loadFolders();
    await loadContents(selectedFolderId === id ? null : selectedFolderId);
  };

  const handleCreateDoc = async () => {
    setCreatingDoc(true);
    try {
      const doc = await createDoc({ title: 'Untitled Document', folderId: selectedFolderId });
      setDocs((prev) => [doc, ...prev]);
      setActiveDoc(doc);
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await deleteDoc(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (activeDoc?.id === id) setActiveDoc(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadDocFile({ file, folderId: selectedFolderId });
      setFiles((prev) => [uploaded, ...prev]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (id: string, storagePath: string) => {
    if (!confirm('Delete this file?')) return;
    await deleteDocFile(id, storagePath);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDocSaved = (updated: Doc) => {
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
    setActiveDoc((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Folder sidebar */}
      <Paper
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 0,
        }}
      >
        <Box sx={{ px: 1.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight={600}>Docs</Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5, px: 0.5 }}>
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveFolder={handleMoveFolder}
          />
        </Box>
      </Paper>

      {/* File list */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={500} sx={{ flex: 1, fontSize: '0.8rem' }}>
            {selectedFolderId === null ? 'All Docs' : folders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder'}
          </Typography>
          <Tooltip title="New document">
            <IconButton size="small" onClick={handleCreateDoc} disabled={creatingDoc}>
              {creatingDoc ? <CircularProgress size={14} /> : <AddIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload file">
            <IconButton size="small" component="label" disabled={uploading}>
              {uploading ? <CircularProgress size={14} /> : <UploadIcon sx={{ fontSize: 16 }} />}
              <input type="file" hidden onChange={handleUpload} />
            </IconButton>
          </Tooltip>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {docs.length === 0 && files.length === 0 && (
              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled">No documents yet</Typography>
                <Box sx={{ mt: 1 }}>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleCreateDoc}>New Doc</Button>
                </Box>
              </Box>
            )}

            {docs.length > 0 && (
              <>
                <Typography variant="caption" color="text.disabled" sx={{ px: 1.5, pt: 1, display: 'block' }}>DOCUMENTS</Typography>
                <List dense disablePadding>
                  {docs.map((doc) => (
                    <ListItemButton
                      key={doc.id}
                      selected={activeDoc?.id === doc.id}
                      onClick={() => setActiveDoc(doc)}
                      sx={{ px: 1.5, py: 0.5, '&:hover .doc-delete': { opacity: 1 } }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <ArticleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.title}
                        primaryTypographyProps={{ variant: 'body2', fontSize: '0.78rem', noWrap: true }}
                        secondary={new Date(doc.updatedAt).toLocaleDateString()}
                        secondaryTypographyProps={{ fontSize: '0.68rem' }}
                      />
                      <ListItemSecondaryAction className="doc-delete" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}>
                          <DeleteIcon sx={{ fontSize: 13, color: 'error.main' }} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}

            {files.length > 0 && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="caption" color="text.disabled" sx={{ px: 1.5, display: 'block' }}>FILES</Typography>
                <List dense disablePadding>
                  {files.map((file) => (
                    <ListItemButton
                      key={file.id}
                      component="a"
                      href={file.publicUrl ?? '#'}
                      target="_blank"
                      sx={{ px: 1.5, py: 0.5, '&:hover .file-delete': { opacity: 1 } }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {fileIcon(file.mimeType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        primaryTypographyProps={{ variant: 'body2', fontSize: '0.78rem', noWrap: true }}
                        secondary={formatBytes(file.sizeBytes)}
                        secondaryTypographyProps={{ fontSize: '0.68rem' }}
                      />
                      <ListItemSecondaryAction className="file-delete" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, file.storagePath); }}>
                          <DeleteIcon sx={{ fontSize: 13, color: 'error.main' }} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Editor pane */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeDoc ? (
          <DocEditor key={activeDoc.id} doc={activeDoc} onSaved={handleDocSaved} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
            <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography color="text.disabled">Select a document or create a new one</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleCreateDoc}>New Document</Button>
          </Box>
        )}
      </Box>

      {/* New folder dialog */}
      <Dialog open={newFolder.open} onClose={() => setNewFolder({ open: false, parentId: null })} maxWidth="xs" fullWidth>
        <DialogTitle>New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmFolder(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolder({ open: false, parentId: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmFolder} disabled={!newFolderName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
