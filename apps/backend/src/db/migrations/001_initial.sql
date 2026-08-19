DO $$ BEGIN
  CREATE TYPE task_type AS ENUM (
    'SOURCE_DOWNLOAD',
    'VIDEO_WATERMARK_REMOVE',
    'IMAGE_WATERMARK_REMOVE',
    'IMAGE_PROCESS'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  storage_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'unknown')),
  mime_type TEXT NOT NULL,
  byte_size BIGINT,
  original_filename TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  task_type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'PENDING',
  input JSONB NOT NULL,
  output JSONB,
  error_code TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status task_status NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_created_idx ON tasks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_status_created_idx ON tasks (status, created_at ASC);
CREATE INDEX IF NOT EXISTS media_assets_user_created_idx ON media_assets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS task_events_task_created_idx ON task_events (task_id, created_at ASC);
