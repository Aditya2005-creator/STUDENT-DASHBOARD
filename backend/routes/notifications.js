// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);
  res.json(rows);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?')
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

// POST /api/notifications — admin/teacher sends to student
router.post('/', authMiddleware, requireRole('admin','teacher'), (req, res) => {
  const { user_id, title, message, type } = req.body;
  if (!user_id||!title||!message) return res.status(400).json({ error:'Missing fields' });
  const db = getDB();
  db.prepare('INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)')
    .run(user_id, title, message, type||'info');
  res.status(201).json({ success:true });
});

module.exports = router;
