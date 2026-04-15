// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'academiq_secret';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email, 'active');

  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['student', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const db = getDB();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hashedPw = bcrypt.hashSync(password, 10);
  const r = db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run(name, email, hashedPw, role);

  res.status(201).json({ success: true, message: 'Account created successfully', id: r.lastInsertRowid });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id,name,email,role,department,status,created_at FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

module.exports = router;
