import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'aerozag.db');

// Ensure directory exists (needed for Railway /data volume mount)
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    airline     TEXT,
    role        TEXT,
    team_size   TEXT,
    ticket_vol  TEXT,
    pain_point  TEXT,
    timeline    TEXT,
    intent      TEXT,          -- ready_to_buy | evaluating | comparing | not_serious
    score       INTEGER,       -- 1-10
    source      TEXT DEFAULT 'chatbot',
    conv_id     TEXT,
    email_sent  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    intent      TEXT,
    score       INTEGER,
    lead_id     TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    conv_id     TEXT NOT NULL,
    role        TEXT NOT NULL,  -- user | assistant | tool
    content     TEXT NOT NULL,
    tool_name   TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conv_id) REFERENCES conversations(id)
  );
`);

export default db;
