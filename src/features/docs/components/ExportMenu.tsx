'use client';

import { useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface ExportMenuProps {
  docId: string;
  title: string;
  /** Current editor content (may differ from saved state) */
  content: string;
}

function slugify(title: string) {
  return title.replace(/[^a-z0-9_\-\s]/gi, '').trim().replace(/\s+/g, '-') || 'document';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportMenu({ docId, title, content }: ExportMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = () => setAnchorEl(buttonRef.current);
  const handleClose = () => setAnchorEl(null);

  const handleExportMd = () => {
    handleClose();
    const frontMatter = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: "${new Date().toISOString().split('T')[0]}"\n---\n\n# ${title}\n\n`;
    const markdown = `${frontMatter}${content}`;
    downloadBlob(new Blob([markdown], { type: 'text/markdown' }), `${slugify(title)}.md`);
  };

  const handleExportPdf = async () => {
    handleClose();
    setExportingPdf(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/clutch/docs/${docId}/export?format=pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        alert(`PDF export failed: ${err.error ?? 'Unknown error'}`);
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, `${slugify(title)}.pdf`);
    } catch (err) {
      console.error('[ExportMenu] PDF error:', err);
      alert('PDF export failed. See console for details.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <>
      <Tooltip title="Export">
        <IconButton ref={buttonRef} size="small" onClick={handleOpen} disabled={exportingPdf}>
          {exportingPdf ? <CircularProgress size={16} /> : <DownloadIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleExportMd} dense>
          <ListItemIcon>
            <ArticleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export Markdown (.md)" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <MenuItem onClick={handleExportPdf} dense>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export PDF" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
      </Menu>
    </>
  );
}
