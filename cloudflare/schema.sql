CREATE TABLE IF NOT EXISTS app_storage (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_app_storage_updated_at ON app_storage(updated_at);