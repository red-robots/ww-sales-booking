import { Router } from 'express';
import db from '../db/database';
import { v4 as uuid } from 'uuid';

const router = Router();

// Check for overlapping reservations in the same room
function hasConflict(roomId: string, start: string, end: string, excludeId?: string): boolean {
  const query = excludeId
    ? `SELECT COUNT(*) as count FROM reservations
       WHERE room_id = ? AND id != ?
       AND start_datetime < ? AND end_datetime > ?`
    : `SELECT COUNT(*) as count FROM reservations
       WHERE room_id = ?
       AND start_datetime < ? AND end_datetime > ?`;

  const params = excludeId
    ? [roomId, excludeId, end, start]
    : [roomId, end, start];

  const result = db.prepare(query).get(...params) as { count: number };
  return result.count > 0;
}

// GET reservations with optional date range filter
router.get('/', (req, res) => {
  const { start, end, room_id, status } = req.query;

  let query = 'SELECT * FROM reservations WHERE 1=1';
  const params: string[] = [];

  if (start) {
    query += ' AND end_datetime > ?';
    params.push(start as string);
  }
  if (end) {
    query += ' AND start_datetime < ?';
    params.push(end as string);
  }
  if (room_id) {
    query += ' AND room_id = ?';
    params.push(room_id as string);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status as string);
  }

  query += ' ORDER BY start_datetime';
  const reservations = db.prepare(query).all(...params);
  res.json(reservations);
});

// GET single reservation
router.get('/:id', (req, res) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
  res.json(reservation);
});

// POST create reservation
router.post('/', (req, res) => {
  const { room_id, title, status, start_datetime, end_datetime, notes, client_name, salesperson_name, created_by } = req.body;

  if (!room_id || !title || !status || !start_datetime || !end_datetime) {
    return res.status(400).json({ error: 'room_id, title, status, start_datetime, and end_datetime are required' });
  }

  if (!['held', 'booked'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "held" or "booked"' });
  }

  if (new Date(start_datetime) >= new Date(end_datetime)) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // Check for conflicts
  if (hasConflict(room_id, start_datetime, end_datetime)) {
    return res.status(409).json({ error: 'This reservation conflicts with an existing reservation in the same room' });
  }

  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reservations (id, room_id, title, status, start_datetime, end_datetime, notes, client_name, salesperson_name, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, room_id, title, status, start_datetime, end_datetime, notes || null, client_name || null, salesperson_name || null, created_by || null, now, now);

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
  res.status(201).json(reservation);
});

// PUT update reservation
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id) as Record<string, string> | undefined;
  if (!existing) return res.status(404).json({ error: 'Reservation not found' });

  const { room_id, title, status, start_datetime, end_datetime, notes, client_name, salesperson_name } = req.body;

  const newRoomId = room_id || existing.room_id;
  const newStart = start_datetime || existing.start_datetime;
  const newEnd = end_datetime || existing.end_datetime;
  const newStatus = status || existing.status;

  if (newStatus && !['held', 'booked'].includes(newStatus)) {
    return res.status(400).json({ error: 'Status must be "held" or "booked"' });
  }

  if (new Date(newStart) >= new Date(newEnd)) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // Check for conflicts (exclude self)
  if (hasConflict(newRoomId, newStart, newEnd, req.params.id)) {
    return res.status(409).json({ error: 'This reservation conflicts with an existing reservation in the same room' });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE reservations SET
      room_id = ?, title = ?, status = ?, start_datetime = ?, end_datetime = ?,
      notes = ?, client_name = ?, salesperson_name = ?, updated_at = ?
    WHERE id = ?
  `).run(
    newRoomId,
    title ?? existing.title,
    newStatus,
    newStart,
    newEnd,
    notes !== undefined ? notes : existing.notes,
    client_name !== undefined ? client_name : existing.client_name,
    salesperson_name !== undefined ? salesperson_name : existing.salesperson_name,
    now,
    req.params.id
  );

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  res.json(reservation);
});

// DELETE reservation
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Reservation not found' });
  res.status(204).send();
});

export default router;
