-- migrations/create_media_system.sql
SET search_path TO gurukul_main;

-- Folders for organizing media
CREATE TABLE IF NOT EXISTS gurukul_main.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES gurukul_main.media_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, parent_id)
);

-- Media metadata table
CREATE TABLE IF NOT EXISTS gurukul_main.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  folder_id UUID REFERENCES gurukul_main.media_folders(id) ON DELETE SET NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add featured_image_id to posts
ALTER TABLE gurukul_main.posts
  ADD COLUMN IF NOT EXISTS featured_image_id UUID REFERENCES gurukul_main.media(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_folder_id ON gurukul_main.media(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON gurukul_main.media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON gurukul_main.media_folders(parent_id);

-- RLS: media_folders
ALTER TABLE gurukul_main.media_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view media folders" ON gurukul_main.media_folders FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage media folders" ON gurukul_main.media_folders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: media
ALTER TABLE gurukul_main.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view media" ON gurukul_main.media FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage media" ON gurukul_main.media FOR ALL TO authenticated USING (true) WITH CHECK (true);
