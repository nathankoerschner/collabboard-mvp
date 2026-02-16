CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_snapshots (
  board_id TEXT PRIMARY KEY REFERENCES boards(id) ON DELETE CASCADE,
  data BYTEA NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_updates (
  id SERIAL PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_updates_board_id ON board_updates(board_id);
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards(owner_id);
