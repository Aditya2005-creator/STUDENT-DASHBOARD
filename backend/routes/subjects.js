// backend/routes/subjects.js
const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT s.*, u.name as teacher_name FROM subjects s
    LEFT JOIN users u ON u.id=s.teacher_id ORDER BY s.name
  `).all();
  res.json(rows);
});

router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, code, teacher_id } = req.body;
  if (!name||!code) return res.status(400).json({ error:'name and code required' });
  const db=getDB();
  const r=db.prepare('INSERT INTO subjects(name,code,teacher_id) VALUES(?,?,?)').run(name,code,teacher_id||null);
  res.status(201).json({ success:true, id:r.lastInsertRowid });
});

module.exports = router;
