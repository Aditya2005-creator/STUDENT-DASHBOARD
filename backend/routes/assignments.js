// backend/routes/assignments.js
const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/assignments/my
router.get('/my', authMiddleware, requireRole('student'), (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT a.*, s.name as subject FROM assignments a
    JOIN subjects s ON s.id=a.subject_id
    WHERE a.student_id=? ORDER BY a.due_date DESC
  `).all(req.user.id);
  res.json(rows);
});

// GET /api/assignments — all (teacher/admin)
router.get('/', authMiddleware, requireRole('teacher','admin'), (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT a.*, u.name as student_name, s.name as subject
    FROM assignments a
    JOIN users u ON u.id=a.student_id
    JOIN subjects s ON s.id=a.subject_id
    ORDER BY a.due_date DESC LIMIT 200
  `).all();
  res.json(rows);
});

// PATCH /api/assignments/:id — grade assignment
router.patch('/:id', authMiddleware, requireRole('teacher','admin'), (req, res) => {
  const { score, status } = req.body;
  const db = getDB();
  db.prepare('UPDATE assignments SET score=?, status=? WHERE id=?')
    .run(score, status||'graded', req.params.id);
  res.json({ success:true });
});

// POST /api/assignments — create assignment for student
router.post('/', authMiddleware, requireRole('teacher','admin'), (req, res) => {
  const { student_id, subject_id, title, description, max_score, due_date } = req.body;
  if(!student_id||!subject_id||!title) return res.status(400).json({ error:'Missing fields' });
  const db=getDB();
  const r=db.prepare(`
    INSERT INTO assignments(student_id,subject_id,title,description,max_score,due_date)
    VALUES(?,?,?,?,?,?)
  `).run(student_id,subject_id,title,description||'',max_score||50,due_date||null);
  res.status(201).json({ success:true, id:r.lastInsertRowid });
});

module.exports = router;
