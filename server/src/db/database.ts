import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'rooms.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    capacity INTEGER
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('held', 'booked')),
    start_datetime TEXT NOT NULL,
    end_datetime TEXT NOT NULL,
    notes TEXT,
    client_name TEXT,
    salesperson_name TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
  CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON reservations(start_datetime, end_datetime);
`);

// Auto-seed rooms if the table is empty (handles ephemeral filesystems like Render free tier)
const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number };
if (roomCount.count === 0) {
  const { v4: uuid } = require('uuid');
  const rooms = [
    { name: 'Big Drop', color: '#3B82F6' },
    { name: 'North Conference', color: '#10B981' },
    { name: 'Room A', color: '#F59E0B' },
    { name: 'Room B', color: '#8B5CF6' },
    { name: 'Room C', color: '#EF4444' },
    { name: 'Room D', color: '#EC4899' },
    { name: 'Room E', color: '#14B8A6' },
    { name: 'Overlook Barn', color: '#F97316' },
    { name: 'Adventure Pavilion', color: '#6366F1' },
    { name: 'Old Stage', color: '#84CC16' },
    { name: 'Biergarten', color: '#A855F7' },
    { name: 'Trail Center', color: '#06B6D4' },
    { name: 'Ridge Pavilion', color: '#D946EF' },
    { name: 'South Ridge Pavilion', color: '#0EA5E9' },
    { name: 'Yurt', color: '#F43F5E' },
    { name: 'Basecamp Classroom', color: '#22C55E' },
  ];
  const insert = db.prepare('INSERT INTO rooms (id, name, color) VALUES (?, ?, ?)');
  for (const room of rooms) {
    insert.run(uuid(), room.name, room.color);
  }
  console.log(`Auto-seeded ${rooms.length} rooms.`);
}

export default db;
