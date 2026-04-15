// backend/db/database.js
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_PATH = process.env.DB_PATH || './backend/db/academiq.db';
const dbPath = path.resolve(DB_PATH);

let db;

function getDB() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
      department TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      teacher_id INTEGER,
      max_marks INTEGER DEFAULT 100,
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      test1 INTEGER DEFAULT 0,
      test2 INTEGER DEFAULT 0,
      assignment INTEGER DEFAULT 0,
      final_exam INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      grade TEXT,
      semester TEXT DEFAULT '2024-25',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id),
      UNIQUE(student_id, subject_id, semester)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present','absent','holiday')),
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id),
      UNIQUE(student_id, subject_id, date)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      max_score INTEGER DEFAULT 50,
      score INTEGER,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','submitted','late','graded')),
      due_date TEXT,
      submitted_at DATETIME,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info','warning','danger','success')),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

module.exports = { getDB };
