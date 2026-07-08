import { Router } from 'express';
import db from '../db/database';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET all coordinators
router.get('/', (_req, res) => {
  const coordinators = db.prepare('SELECT * FROM coordinators ORDER BY name').all();
  res.json(coordinators);
});

// POST create coordinator
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const trimmed = name.trim();
  const existing = db.prepare('SELECT * FROM coordinators WHERE name = ? COLLATE NOCASE').get(trimmed);
  if (existing) return res.status(409).json({ error: 'A coordinator with this name already exists' });

  const id = uuid();
  db.prepare('INSERT INTO coordinators (id, name) VALUES (?, ?)').run(id, trimmed);

  const coordinator = db.prepare('SELECT * FROM coordinators WHERE id = ?').get(id);
  res.status(201).json(coordinator);
});

// DELETE coordinator
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM coordinators WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Coordinator not found' });
  res.status(204).send();
});

export default router;
