ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'PENDING'
  CHECK (upload_status IN ('PENDING', 'READY'));

CREATE INDEX IF NOT EXISTS media_assets_ready_idx ON media_assets (user_id, upload_status, created_at DESC);
