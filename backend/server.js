// backend/server.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/students');
const marksRoutes   = require('./routes/marks');
const subjectRoutes = require('./routes/subjects');
const notifRoutes   = require('./routes/notifications');
const assignRoutes  = require('./routes/assignments');
const chatRoutes    = require('./routes/chat');
const userRoutes    = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/marks',         marksRoutes);
app.use('/api/subjects',      subjectRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/assignments',   assignRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/users',         userRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'AcademIQ' });
});

// ── Fallback: serve index.html for SPA routing ─────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 AcademIQ Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API Base:  http://localhost:${PORT}/api`);
  console.log(`\n🔑 Demo Logins:`);
  console.log(`   Student → student@school.edu / student123`);
  console.log(`   Teacher → teacher@school.edu / teacher123`);
  console.log(`   Admin   → admin@school.edu   / admin123`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
