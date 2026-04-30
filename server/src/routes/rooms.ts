import { Router } from 'express';
import db from '../db/database';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET all rooms
router.get('/', (_req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms ORDER BY name').all();
  res.json(rooms);
});

// GET single room
router.get('/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// POST create room
router.post('/', (req, res) => {
  const { name, color, description, capacity } = req.body;
  if (!name || !color) return res.status(400).json({ error: 'Name and color are required' });

  const id = uuid();
  db.prepare('INSERT INTO rooms (id, name, color, description, capacity) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, color, description || null, capacity || null);

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  res.status(201).json(room);
});

// PUT update room
router.put('/:id', (req, res) => {
  const { name, color, description, capacity } = req.body;
  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Room not found' });

  db.prepare('UPDATE rooms SET name = ?, color = ?, description = ?, capacity = ? WHERE id = ?')
    .run(name, color, description || null, capacity || null, req.params.id);

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  res.json(room);
});

// DELETE room
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Room not found' });
  res.status(204).send();
});

export default router;
