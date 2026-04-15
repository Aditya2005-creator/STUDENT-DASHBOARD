// backend/db/seed.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { getDB } = require('./database');
const bcrypt = require('bcryptjs');

const db = getDB();

console.log('🌱 Seeding AcademIQ database...');

// ── Clear existing data ──────────────────────────────────────────────────────
db.exec(`
  DELETE FROM chat_history;
  DELETE FROM notifications;
  DELETE FROM assignments;
  DELETE FROM attendance;
  DELETE FROM marks;
  DELETE FROM subjects;
  DELETE FROM users;
`);

// ── Helpers ──────────────────────────────────────────────────────────────────
const hash = (p) => bcrypt.hashSync(p, 10);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const calcGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};
const calcTotal = (t1, t2, assign, final) =>
  Math.round((t1 / 50) * 20 + (t2 / 50) * 20 + (assign / 25) * 10 + (final / 100) * 50);

// ── Admin ────────────────────────────────────────────────────────────────────
db.prepare(`INSERT INTO users(name,email,password,role,department) VALUES(?,?,?,?,?)`).run(
  'Principal Meena Krishnan', 'admin@school.edu', hash('admin123'), 'admin', 'Administration'
);

// ── Teachers ─────────────────────────────────────────────────────────────────
const teachers = [
  { name: 'Dr. Ramesh Subramaniam', email: 'teacher@school.edu', dept: 'Mathematics' },
  { name: 'Prof. Lakshmi Devi',     email: 'lakshmi@school.edu', dept: 'Physics' },
  { name: 'Dr. Anand Krishnan',     email: 'anand@school.edu',   dept: 'Chemistry' },
  { name: 'Ms. Priya Nair',         email: 'priya.t@school.edu', dept: 'Biology' },
  { name: 'Mr. Suresh Babu',        email: 'suresh.t@school.edu',dept: 'English' },
  { name: 'Dr. Kavitha Menon',      email: 'kavitha@school.edu', dept: 'Computer Science' },
  { name: 'Prof. Rajan Pillai',     email: 'rajan@school.edu',   dept: 'History' },
  { name: 'Ms. Geetha Rao',         email: 'geetha@school.edu',  dept: 'Geography' },
];
const teacherIds = [];
const insertUser = db.prepare(`INSERT INTO users(name,email,password,role,department) VALUES(?,?,?,?,?)`);
teachers.forEach(t => {
  const r = insertUser.run(t.name, t.email, hash('teacher123'), 'teacher', t.dept);
  teacherIds.push(r.lastInsertRowid);
});

// ── Subjects ─────────────────────────────────────────────────────────────────
const subjectDefs = [
  { name: 'Mathematics',      code: 'MATH101' },
  { name: 'Physics',          code: 'PHY101'  },
  { name: 'Chemistry',        code: 'CHEM101' },
  { name: 'Biology',          code: 'BIO101'  },
  { name: 'English',          code: 'ENG101'  },
  { name: 'Computer Science', code: 'CS101'   },
  { name: 'History',          code: 'HIST101' },
  { name: 'Geography',        code: 'GEO101'  },
];
const insertSubject = db.prepare(`INSERT INTO subjects(name,code,teacher_id) VALUES(?,?,?)`);
const subjectIds = [];
subjectDefs.forEach((s, i) => {
  const r = insertSubject.run(s.name, s.code, teacherIds[i]);
  subjectIds.push(r.lastInsertRowid);
});

// ── 100 Students ─────────────────────────────────────────────────────────────
const studentNames = [
  'Arjun Sharma','Priya Patel','Rahul Kumar','Sneha Reddy','Amit Singh',
  'Kavya Nair','Vikram Mehta','Ananya Iyer','Rohit Das','Divya Joshi',
  'Karan Verma','Meera Pillai','Suresh Babu','Pooja Mishra','Nikhil Rao',
  'Lakshmi Devi','Arun Kumar','Shruti Shah','Deepak Gupta','Nandini Chetty',
  'Prasad Gowda','Ritu Sharma','Sanjay Pillai','Aditi Nair','Manoj Tiwari',
  'Shweta Bhatt','Varun Shetty','Preethi Raj','Gaurav Singh','Harini Suresh',
  'Rajesh Kumar','Swati Kulkarni','Kartik Menon','Bhavana Rao','Ajay Reddy',
  'Madhuri Iyer','Tarun Verma','Suchitra Nair','Pavan Srinivas','Yamini Krishnan',
  'Dinesh Bose','Lavanya Menon','Vivek Sharma','Tanvi Desai','Siddharth Nair',
  'Anand Rao','Chitra Pillai','Devraj Kumar','Esha Mehta','Faisal Khan',
  'Geetha Nair','Harish Babu','Isha Verma','Jai Prakash','Kavitha Reddy',
  'Lokesh Gupta','Mala Shetty','Neel Sharma','Ola Krishnan','Puja Tiwari',
  'Quresh Ali','Rekha Iyer','Subash Chandra','Tara Singh','Usha Rani',
  'Vinay Kumar','Wena Patel','Xavier Raj','Yashoda Devi','Zara Shaikh',
  'Aditya Bhat','Bharat Kumar','Chandra Rao','Deepika Shah','Elan Suresh',
  'Farhan Malik','Geeta Pillai','Hemant Joshi','Indu Mehta','Jayesh Singh',
  'Keerthi Nair','Laxman Kumar','Manorama Devi','Naveen Rao','Omkar Patil',
  'Pallavi Gupta','Raghav Srinivas','Saraswati Iyer','Trilok Sharma','Uma Devi',
  'Vaibhav Verma','Warsha Khan','Xander Fernandez','Yuvraj Singh','Zainab Ahmed',
  'Akhil Reddy','Bindu Pillai','Chetan Shah','Durga Rao','Elango Kumar',
];

const studentIds = [];
studentNames.forEach((name, i) => {
  const email = `${name.split(' ')[0].toLowerCase()}${i + 1}@student.edu`;
  const r = insertUser.run(name, email, hash('student123'), 'student', 'Science');
  studentIds.push(r.lastInsertRowid);
});

// Override first student with known demo credentials
db.prepare(`UPDATE users SET email='student@school.edu', password=? WHERE id=?`)
  .run(hash('student123'), studentIds[0]);

// ── Marks for all students ────────────────────────────────────────────────────
const insertMark = db.prepare(`
  INSERT INTO marks(student_id,subject_id,test1,test2,assignment,final_exam,total,grade)
  VALUES(?,?,?,?,?,?,?,?)
`);

// Fixed scores for demo student (Arjun Sharma - studentIds[0])
const arjunScores = {
  0: { t1:40, t2:42, a:20, f:82 }, // Math
  1: { t1:36, t2:38, a:18, f:74 }, // Physics
  2: { t1:44, t2:45, a:23, f:88 }, // Chemistry
  3: { t1:39, t2:41, a:20, f:79 }, // Biology
  4: { t1:46, t2:47, a:24, f:91 }, // English
  5: { t1:43, t2:44, a:22, f:86 }, // CS
  6: { t1:33, t2:35, a:16, f:68 }, // History
  7: { t1:35, t2:37, a:18, f:72 }, // Geography
};

studentIds.forEach((sid, si) => {
  subjectIds.forEach((subid, subi) => {
    let t1, t2, assign, final;
    if (si === 0) {
      // Demo student gets fixed scores
      const s = arjunScores[subi];
      t1=s.t1; t2=s.t2; assign=s.a; final=s.f;
    } else {
      // Random scores with realistic distribution
      const base = rand(45, 85);
      t1    = Math.min(50, Math.max(20, rand(base - 10, base + 5)));
      t2    = Math.min(50, Math.max(20, rand(base - 8,  base + 8)));
      assign= Math.min(25, Math.max(10, rand(13, 24)));
      final = Math.min(100,Math.max(35, rand(base - 15, base + 15)));
    }
    const total = calcTotal(t1, t2, assign, final);
    insertMark.run(sid, subid, t1, t2, assign, final, total, calcGrade(total));
  });
});

// ── Attendance (last 90 days) ─────────────────────────────────────────────────
const insertAtt = db.prepare(`
  INSERT OR IGNORE INTO attendance(student_id, subject_id, date, status) VALUES(?,?,?,?)
`);

const today = new Date();
const dates = [];
for (let i = 89; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const day = d.getDay();
  if (day !== 0 && day !== 6) dates.push(d.toISOString().split('T')[0]);
}

studentIds.forEach((sid, si) => {
  subjectIds.forEach((subid, subi) => {
    // Demo student: 92% attendance, low in History (subi===6 => 68%)
    const baseRate = si === 0 ? (subi === 6 ? 0.68 : 0.92) : (0.70 + Math.random() * 0.28);
    dates.forEach(date => {
      const status = Math.random() < baseRate ? 'present' : 'absent';
      insertAtt.run(sid, subid, date, status);
    });
  });
});

// ── Assignments ───────────────────────────────────────────────────────────────
const assignDefs = [
  { title:'Calculus Problem Set',       subIdx:0, maxScore:50 },
  { title:'Wave Optics Lab Report',     subIdx:1, maxScore:50 },
  { title:'Organic Chemistry Notes',    subIdx:2, maxScore:50 },
  { title:'Cell Biology Essay',         subIdx:3, maxScore:50 },
  { title:'Literary Analysis Essay',    subIdx:4, maxScore:50 },
  { title:'Data Structures Project',    subIdx:5, maxScore:50 },
  { title:'World War II Summary',       subIdx:6, maxScore:50 },
  { title:'Map Skills Exercise',        subIdx:7, maxScore:50 },
  { title:'Trigonometry Worksheet',     subIdx:0, maxScore:50 },
  { title:'Quantum Physics Report',     subIdx:1, maxScore:50 },
];
const arjunAssignScores = [42,36,48,41,47,45,32,38,null,null];
const arjunAssignStatus = ['submitted','submitted','submitted','submitted','submitted','submitted','late','submitted','pending','pending'];

const insertAssign = db.prepare(`
  INSERT INTO assignments(student_id,subject_id,title,max_score,score,status,due_date)
  VALUES(?,?,?,?,?,?,?)
`);

studentIds.forEach((sid, si) => {
  assignDefs.forEach((a, ai) => {
    const subid = subjectIds[a.subIdx];
    const due = new Date(today);
    due.setDate(due.getDate() + rand(-30, 10));
    const dueStr = due.toISOString().split('T')[0];
    if (si === 0) {
      insertAssign.run(sid, subid, a.title, a.maxScore, arjunAssignScores[ai], arjunAssignStatus[ai], dueStr);
    } else {
      const status = Math.random() < 0.8 ? 'submitted' : Math.random() < 0.5 ? 'late' : 'pending';
      const score = status !== 'pending' ? rand(25, a.maxScore) : null;
      insertAssign.run(sid, subid, a.title, a.maxScore, score, status, dueStr);
    }
  });
});

// ── Notifications for demo student ────────────────────────────────────────────
const notifs = [
  { title:'⚠️ Low Attendance Warning', message:'Your attendance in History has dropped to 68%. Minimum required is 75%.', type:'danger' },
  { title:'📝 Assignment Due Tomorrow', message:'Trigonometry Worksheet is due tomorrow. Submit before 11:59 PM.', type:'warning' },
  { title:'📢 Mid-Term Exam Schedule', message:'Mid-term exams begin next Monday. Check the exam timetable.', type:'info' },
  { title:'🏆 Rank Improvement!', message:'Your rank improved from #7 to #3 this semester. Keep it up!', type:'success' },
  { title:'📚 Study Suggestion', message:'Based on your scores, focus more on History and Geography this week.', type:'warning' },
  { title:'📊 Report Card Available', message:'Your Semester 1 report card is now available in the Reports section.', type:'info' },
];
const insertNotif = db.prepare(`INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)`);
notifs.forEach(n => insertNotif.run(studentIds[0], n.title, n.message, n.type));

console.log(`✅ Seeded successfully!`);
console.log(`   👥 Users: 1 admin + ${teachers.length} teachers + ${studentIds.length} students`);
console.log(`   📚 Subjects: ${subjectDefs.length}`);
console.log(`   📊 Marks: ${studentIds.length * subjectIds.length} records`);
console.log(`   📅 Attendance: ${studentIds.length * subjectIds.length * dates.length} records`);
console.log(`   📝 Assignments: ${studentIds.length * assignDefs.length} records`);
console.log(`\n🔑 Demo Logins:`);
console.log(`   Student  → student@school.edu  / student123`);
console.log(`   Teacher  → teacher@school.edu  / teacher123`);
console.log(`   Admin    → admin@school.edu    / admin123`);
console.log(`\n🚀 Now run: npm run dev`);
