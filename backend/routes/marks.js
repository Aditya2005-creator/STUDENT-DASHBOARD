// backend/routes/marks.js
const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const calcGrade = s => s>=90?'A+':s>=80?'A':s>=70?'B':s>=60?'C':s>=50?'D':'F';
const calcTotal = (t1,t2,a,f) => Math.round((t1/50)*20+(t2/50)*20+(a/25)*10+(f/100)*50);

// GET /api/marks — all marks (teacher/admin)
router.get('/', authMiddleware, requireRole('teacher','admin'), (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT m.*, u.name as student_name, s.name as subject_name, s.code
    FROM marks m
    JOIN users u ON u.id=m.student_id
    JOIN subjects s ON s.id=m.subject_id
    ORDER BY u.name, s.name
  `).all();
  res.json(rows);
});

// GET /api/marks/my — current student's marks
router.get('/my', authMiddleware, requireRole('student'), (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT m.*, s.name as subject_name, s.code
    FROM marks m
    JOIN subjects s ON s.id=m.subject_id
    WHERE m.student_id=?
    ORDER BY s.name
  `).all(req.user.id);
  res.json(rows);
});

// GET /api/marks/class-average — avg per subject
router.get('/class-average', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT s.name as subject, ROUND(AVG(m.total),1) as avg,
           MIN(m.total) as min, MAX(m.total) as max
    FROM marks m JOIN subjects s ON s.id=m.subject_id
    GROUP BY m.subject_id ORDER BY s.name
  `).all();
  res.json(rows);
});

// POST /api/marks — add/update marks (teacher/admin)
router.post('/', authMiddleware, requireRole('teacher','admin'), (req, res) => {
  const { student_id, subject_id, test1, test2, assignment, final_exam } = req.body;
  if (!student_id || !subject_id) {
    return res.status(400).json({ error: 'student_id and subject_id required' });
  }
  const t1=parseInt(test1)||0, t2=parseInt(test2)||0;
  const a=parseInt(assignment)||0, f=parseInt(final_exam)||0;
  const total=calcTotal(t1,t2,a,f);
  const grade=calcGrade(total);
  const db=getDB();

  db.prepare(`
    INSERT INTO marks(student_id,subject_id,test1,test2,assignment,final_exam,total,grade)
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(student_id,subject_id,semester)
    DO UPDATE SET test1=excluded.test1, test2=excluded.test2,
      assignment=excluded.assignment, final_exam=excluded.final_exam,
      total=excluded.total, grade=excluded.grade, updated_at=CURRENT_TIMESTAMP
  `).run(student_id, subject_id, t1, t2, a, f, total, grade);

  res.json({ success:true, total, grade });
});

// GET /api/marks/report — grade distribution for admin
router.get('/report', authMiddleware, requireRole('admin','teacher'), (req, res) => {
  const db = getDB();
  const dist = db.prepare(`
    SELECT grade, COUNT(*) as count FROM marks GROUP BY grade ORDER BY grade
  `).all();
  const subjectAvgs = db.prepare(`
    SELECT s.name as subject, ROUND(AVG(m.total),1) as avg
    FROM marks m JOIN subjects s ON s.id=m.subject_id
    GROUP BY m.subject_id ORDER BY s.name
  `).all();
  const topStudents = db.prepare(`
    SELECT u.name, ROUND(AVG(m.total),1) as avg
    FROM marks m JOIN users u ON u.id=m.student_id
    GROUP BY m.student_id ORDER BY avg DESC LIMIT 10
  `).all();
  res.json({ dist, subjectAvgs, topStudents });
});

module.exports = router;
