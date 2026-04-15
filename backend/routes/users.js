// backend/routes/users.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/users — admin only
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB();
  const users = db.prepare(`
    SELECT id, name, email, role, department, status, created_at FROM users ORDER BY role, name
  `).all();
  res.json(users);
});

// POST /api/users — admin creates user
router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name||!email||!password||!role) return res.status(400).json({ error:'All fields required' });
  const db = getDB();
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (exists) return res.status(409).json({ error:'Email already exists' });
  const r = db.prepare('INSERT INTO users(name,email,password,role,department) VALUES(?,?,?,?,?)')
    .run(name, email, bcrypt.hashSync(password,10), role, department||null);
  res.status(201).json({ success:true, id:r.lastInsertRowid });
});

// PATCH /api/users/:id/status — activate/deactivate
router.patch('/:id/status', authMiddleware, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  if (!['active','inactive'].includes(status)) return res.status(400).json({ error:'Invalid status' });
  const db = getDB();
  db.prepare('UPDATE users SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success:true });
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM users WHERE id=? AND role != ?').run(req.params.id, 'admin');
  res.json({ success:true });
});

// GET /api/users/stats — admin overview stats
router.get('/stats', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB();
  const counts = db.prepare(`
    SELECT role, COUNT(*) as count FROM users WHERE status='active' GROUP BY role
  `).all();
  const avgGpa = db.prepare(`
    SELECT ROUND(AVG(avg_score)/10,2) as gpa FROM (
      SELECT student_id, AVG(total) as avg_score FROM marks GROUP BY student_id
    )
  `).get();
  const gradeDistribution = db.prepare(`
    SELECT grade, COUNT(*) as count FROM marks GROUP BY grade ORDER BY grade
  `).all();
  const subjectAvgs = db.prepare(`
    SELECT s.name, ROUND(AVG(m.total),1) as avg
    FROM marks m JOIN subjects s ON s.id=m.subject_id
    GROUP BY m.subject_id ORDER BY s.name
  `).all();
  res.json({ counts, avgGpa, gradeDistribution, subjectAvgs });
});

module.exports = router;
