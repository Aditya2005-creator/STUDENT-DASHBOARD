// backend/routes/students.js
const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/students — list all students (teacher/admin)
router.get('/', authMiddleware, requireRole('teacher', 'admin'), (req, res) => {
  const db = getDB();
  const students = db.prepare(`
    SELECT u.id, u.name, u.email, u.department, u.status, u.created_at,
      ROUND(AVG(m.total), 1) as avg_score,
      COUNT(DISTINCT m.subject_id) as subject_count
    FROM users u
    LEFT JOIN marks m ON m.student_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY avg_score DESC
  `).all();
  res.json(students);
});

// GET /api/students/:id/dashboard — full student dashboard data
router.get('/:id/dashboard', authMiddleware, (req, res) => {
  const sid = parseInt(req.params.id);
  // Students can only see their own data
  if (req.user.role === 'student' && req.user.id !== sid) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = getDB();

  // Basic info
  const student = db.prepare(`SELECT id,name,email,department FROM users WHERE id=? AND role='student'`).get(sid);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Marks with subject names
  const marks = db.prepare(`
    SELECT s.name as subject, s.code, m.test1, m.test2, m.assignment, m.final_exam, m.total, m.grade
    FROM marks m
    JOIN subjects s ON s.id = m.subject_id
    WHERE m.student_id = ?
    ORDER BY s.name
  `).all(sid);

  // Attendance summary
  const attSummary = db.prepare(`
    SELECT
      COUNT(CASE WHEN status='present' THEN 1 END) as present,
      COUNT(CASE WHEN status='absent'  THEN 1 END) as absent,
      COUNT(*) as total
    FROM attendance WHERE student_id=?
  `).get(sid);

  // Attendance by subject
  const attBySubject = db.prepare(`
    SELECT s.name as subject,
      COUNT(CASE WHEN a.status='present' THEN 1 END) as present,
      COUNT(*) as total,
      ROUND(COUNT(CASE WHEN a.status='present' THEN 1 END)*100.0/COUNT(*),1) as pct
    FROM attendance a
    JOIN subjects s ON s.id = a.subject_id
    WHERE a.student_id=?
    GROUP BY a.subject_id
    ORDER BY s.name
  `).all(sid);

  // Assignments
  const assignments = db.prepare(`
    SELECT a.*, s.name as subject
    FROM assignments a
    JOIN subjects s ON s.id = a.subject_id
    WHERE a.student_id=?
    ORDER BY a.due_date DESC
  `).all(sid);

  // Rank
  const allAvgs = db.prepare(`
    SELECT student_id, AVG(total) as avg FROM marks GROUP BY student_id ORDER BY avg DESC
  `).all();
  const rank = allAvgs.findIndex(r => r.student_id === sid) + 1;
  const total_students = allAvgs.length;

  // GPA (avg/10 scaled to 10.0)
  const myAvg = allAvgs.find(r => r.student_id === sid);
  const gpa = myAvg ? (myAvg.avg / 10).toFixed(1) : '0.0';

  // Attendance percentage
  const attPct = attSummary.total > 0
    ? Math.round(attSummary.present / attSummary.total * 100)
    : 0;

  // Trend: average per attendance date-group (monthly)
  const monthlyTrend = db.prepare(`
    SELECT strftime('%Y-%m', a.date) as month,
           ROUND(AVG(m.total),1) as avg
    FROM attendance a
    JOIN marks m ON m.student_id = a.student_id AND m.subject_id = a.subject_id
    WHERE a.student_id = ?
    GROUP BY month
    ORDER BY month
    LIMIT 12
  `).all(sid);

  // Notifications
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 10
  `).all(sid);

  res.json({
    student, marks, attSummary, attBySubject,
    assignments, rank, total_students,
    gpa, attPct, monthlyTrend, notifications
  });
});

// GET /api/students/:id/attendance-calendar
router.get('/:id/attendance-calendar', authMiddleware, (req, res) => {
  const sid = parseInt(req.params.id);
  if (req.user.role === 'student' && req.user.id !== sid) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const db = getDB();
  const rows = db.prepare(`
    SELECT date, status FROM attendance WHERE student_id=?
    GROUP BY date
    ORDER BY date DESC LIMIT 90
  `).all(sid);
  res.json(rows);
});

module.exports = router;
