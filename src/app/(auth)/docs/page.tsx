'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import UploadIcon from '@mui/icons-material/UploadOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import LinkIcon from '@mui/icons-material/Link';
import FolderTree from '@/features/docs/components/FolderTree';
import DocEditor from '@/features/docs/components/DocEditor';
import MoveDocModal from '@/features/docs/components/MoveDocModal';
import {
  listFolders,
  listDocs,
  listDocFiles,
  createFolder,
  deleteFolder,
  updateFolder,
  createDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  uploadDocFile,
  deleteDocFile,
} from '@/features/docs/service';
import type { Doc, DocFolder, DocFile } from '@/lib/types';

type NewFolderState = { open: boolean; parentId: string | null };
type ContextMenu = { mouseX: number; mouseY: number; docId: string } | null;

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

/** Walk folders flat list to get all ancestor IDs of a given folderId */
function getAncestorIds(folderId: string, folders: DocFolder[]): Set<string> {
  const map = new Map(folders.map((f) => [f.id, f.parentId]));
  const result = new Set<string>();
  let cursor: string | null = folderId;
  while (cursor) {
    result.add(cursor);
    cursor = map.get(cursor) ?? null;
  }
  return result;
}

// ─── Inner page (needs useSearchParams) ───────────────────────────────────────

function DocsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);
  const [moveDocId, setMoveDocId] = useState<string | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Capture deep-link docId on mount only
  const deepLinkDocId = useRef(searchParams.get('docId')).current;

  const loadFolders = useCallback(async () => {
    const data = await listFolders();
    setFolders(data);
    setFoldersLoaded(true);
    return data;
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
    if (!deepLinkDocId) setActiveDoc(null);
  }, [selectedFolderId, loadContents, deepLinkDocId]);

  // Deep-link: once folders are loaded, resolve docId → folder → doc
  useEffect(() => {
    if (!foldersLoaded || !deepLinkDocId) return;

    getDoc(deepLinkDocId)
      .then((doc) => {
        if (doc.folderId) {
          const ancestors = getAncestorIds(doc.folderId, folders);
          setExpandedFolderIds(ancestors);
          setSelectedFolderId(doc.folderId);
        }
        setActiveDoc(doc);
        router.replace(`/docs?docId=${doc.id}`, { scroll: false });
      })
      .catch(() => {
        // 404 fallback: show empty state, no error
        setActiveDoc(null);
      });
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersLoaded]);

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
    // Folder delete guard: warn if docs exist
    const folderDocs = await listDocs(id);
    const message =
      folderDocs.length > 0
        ? `This folder contains ${folderDocs.length} document(s). Delete folder and all its contents?`
        : 'Delete this folder and all its contents?';
    if (!confirm(message)) return;
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
      router.replace(`/docs?docId=${doc.id}`, { scroll: false });
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await deleteDoc(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (activeDoc?.id === id) {
      setActiveDoc(null);
      router.replace('/docs', { scroll: false });
    }
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

  const handleDocClick = (doc: Doc) => {
    setActiveDoc(doc);
    router.push(`/docs?docId=${doc.id}`, { scroll: false });
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, docId });
  };

  const handleContextMenuClose = () => setContextMenu(null);

  const handleMoveDocOpen = (docId: string) => {
    setMoveDocId(docId);
    handleContextMenuClose();
  };

  const handleMoveDocConfirm = async (docId: string, newFolderId: string | null) => {
    setMoveDocId(null);
    // Optimistic: remove from current list
    const original = docs.find((d) => d.id === docId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    if (activeDoc?.id === docId) setActiveDoc(null);

    try {
      await updateDoc(docId, { folderId: newFolderId });
    } catch {
      // Rollback
      if (original) {
        setDocs((prev) => [original, ...prev]);
      }
    }
  };

  const handleCopyLink = (docId: string) => {
    const url = `${window.location.origin}/docs?docId=${docId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedDocId(docId);
    handleContextMenuClose();
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedDocId(null), 2000);
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
            expandedFolderIds={expandedFolderIds}
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
                      onClick={() => handleDocClick(doc)}
                      onContextMenu={(e) => handleContextMenu(e, doc.id)}
                      sx={{ px: 1.5, py: 0.5, '&:hover .doc-actions': { opacity: 1 } }}
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
                      <ListItemSecondaryAction className="doc-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', gap: 0 }}>
                        <Tooltip title={copiedDocId === doc.id ? 'Copied!' : 'Copy link'}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopyLink(doc.id); }}>
                            <LinkIcon sx={{ fontSize: 12, color: copiedDocId === doc.id ? 'success.main' : 'text.secondary' }} />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleContextMenu(e, doc.id); }}>
                          <MoreVertIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        </IconButton>
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

      {/* Doc context menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => contextMenu && handleMoveDocOpen(contextMenu.docId)} dense>
          <DriveFileMoveIcon sx={{ fontSize: 16, mr: 1 }} />
          Move to…
        </MenuItem>
        <MenuItem onClick={() => contextMenu && handleCopyLink(contextMenu.docId)} dense>
          <LinkIcon sx={{ fontSize: 16, mr: 1 }} />
          {copiedDocId === contextMenu?.docId ? 'Copied!' : 'Copy link'}
        </MenuItem>
      </Menu>

      {/* Move doc modal */}
      {moveDocId && (
        <MoveDocModal
          docId={moveDocId}
          folders={folders}
          currentFolderId={docs.find((d) => d.id === moveDocId)?.folderId ?? null}
          onConfirm={handleMoveDocConfirm}
          onClose={() => setMoveDocId(null)}
        />
      )}
    </Box>
  );
}

// ─── Suspense wrapper (required for useSearchParams in App Router) ─────────────

export default function DocsPage() {
  return (
    <Suspense>
      <DocsPageInner />
    </Suspense>
  );
}
