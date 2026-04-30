import db from './database';
import { v4 as uuid } from 'uuid';

// Clear existing data
db.exec('DELETE FROM reservations');
db.exec('DELETE FROM rooms');

// Seed rooms
const rooms = [
  { id: uuid(), name: 'Big Drop', color: '#3B82F6' },
  { id: uuid(), name: 'North Conference', color: '#10B981' },
  { id: uuid(), name: 'Room A', color: '#F59E0B' },
  { id: uuid(), name: 'Room B', color: '#8B5CF6' },
  { id: uuid(), name: 'Room C', color: '#EF4444' },
  { id: uuid(), name: 'Room D', color: '#EC4899' },
  { id: uuid(), name: 'Room E', color: '#14B8A6' },
  { id: uuid(), name: 'Overlook Barn', color: '#F97316' },
  { id: uuid(), name: 'Adventure Pavilion', color: '#6366F1' },
  { id: uuid(), name: 'Old Stage', color: '#84CC16' },
  { id: uuid(), name: 'Biergarten', color: '#A855F7' },
  { id: uuid(), name: 'Trail Center', color: '#06B6D4' },
  { id: uuid(), name: 'Ridge Pavilion', color: '#D946EF' },
  { id: uuid(), name: 'South Ridge Pavilion', color: '#0EA5E9' },
  { id: uuid(), name: 'Yurt', color: '#F43F5E' },
  { id: uuid(), name: 'Basecamp Classroom', color: '#22C55E' },
];

const insertRoom = db.prepare(
  'INSERT INTO rooms (id, name, color) VALUES (?, ?, ?)'
);

for (const room of rooms) {
  insertRoom.run(room.id, room.name, room.color);
}

console.log(`Seeded ${rooms.length} rooms.`);
process.exit(0);
