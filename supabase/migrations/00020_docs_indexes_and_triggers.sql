-- Indexes for docs feature performance
CREATE INDEX IF NOT EXISTS idx_docs_folder_id ON docs(folder_id);
CREATE INDEX IF NOT EXISTS idx_docs_project_tag ON docs(project_tag);
CREATE INDEX IF NOT EXISTS idx_docs_updated_at ON docs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_folders_parent_id ON doc_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_doc_folders_project_tag ON doc_folders(project_tag);

-- Auto-update updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on docs
DROP TRIGGER IF EXISTS docs_updated_at_trigger ON docs;
CREATE TRIGGER docs_updated_at_trigger
  BEFORE UPDATE ON docs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger on doc_folders
DROP TRIGGER IF EXISTS doc_folders_updated_at_trigger ON doc_folders;
CREATE TRIGGER doc_folders_updated_at_trigger
  BEFORE UPDATE ON doc_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
