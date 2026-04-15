# 🎓 AcademIQ — Student Performance Analysis Dashboard

A full-stack web application with AI chatbot for tracking and analyzing student academic performance.

---

## 🚀 Quick Start (3 Steps)

### Prerequisites
- [Node.js](https://nodejs.org) v18+ installed
- Internet connection (for Google Fonts & Chart.js CDN)

### Step 1 — Install Dependencies
```bash
npm install
```

### Step 2 — Seed the Database (creates 100 students + all data)
```bash
npm run seed
```

### Step 3 — Start the Server
```bash
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Student | student@school.edu       | student123   |
| Teacher | teacher@school.edu       | teacher123   |
| Admin   | admin@school.edu         | admin123     |

---

## 🤖 AI Chatbot Setup (Optional)

The chatbot works with a built-in smart fallback by default — **no API key needed**.

To enable real Claude AI responses:
1. Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. Open `.env` and replace:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
   with your actual key.
3. Restart the server: `npm run dev`

---

## 📁 Project Structure

```
academiq/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── db/
│   │   ├── database.js        # SQLite schema & connection
│   │   └── seed.js            # Database seeder (100 students)
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── routes/
│       ├── auth.js            # Login, register, session
│       ├── students.js        # Student data & dashboard
│       ├── marks.js           # Marks CRUD
│       ├── subjects.js        # Subject management
│       ├── attendance.js      # Attendance tracking
│       ├── assignments.js     # Assignment management
│       ├── notifications.js   # Notifications
│       ├── chat.js            # AI chatbot (Claude API)
│       └── users.js           # User management (admin)
├── frontend/
│   ├── index.html             # Single-page app shell
│   ├── css/
│   │   └── style.css          # Full stylesheet
│   └── js/
│       ├── api.js             # API client (all fetch calls)
│       ├── auth.js            # Login/logout/session
│       ├── app.js             # Navigation & utilities
│       ├── dashboard.js       # Student dashboard
│       ├── analytics.js       # Analytics & charts
│       ├── attendance.js      # Attendance calendar
│       ├── chatbot.js         # AI chat interface
│       ├── reports.js         # Report generation
│       ├── marks.js           # Marks management
│       └── admin.js           # Admin & teacher pages
├── .env                       # Environment config
├── .vscode/
│   ├── launch.json            # VS Code debug config
│   └── extensions.json        # Recommended extensions
└── package.json
```

---

## 🌟 Features

### Student Portal
- **Dashboard** — GPA, attendance, rank, assignment stats + live charts
- **Analytics** — Test score timeline, subject comparison vs class average, monthly attendance
- **Attendance** — Visual calendar, subject-wise breakdown with warning flags
- **AI Chatbot** — Ask questions about your performance, get personalised study tips
- **Notifications** — Alerts for low attendance, due assignments, rank changes
- **Reports** — Generate Performance, Attendance, Assignment, and Improvement Plan reports

### Teacher Portal
- **Overview** — Class grade distribution, at-risk students, average scores
- **Marks Management** — Add/edit marks for any student and subject
- **Reports** — System-wide performance reports

### Admin Portal
- **Overview** — System stats, grade distribution, subject averages
- **User Management** — Add, activate/deactivate, delete users
- **Marks** — Full marks database access

---

## 🗄️ Database

SQLite database created at `backend/db/academiq.db` after seeding.

**Seed data includes:**
- 100 students with realistic performance profiles
- 8 subjects with class averages
- 800 mark records (100 students × 8 subjects)
- 57,600+ attendance records (100 × 8 × ~72 working days)
- 1,000 assignment records
- Notifications for demo student

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/students/:id/dashboard` | Full student dashboard data |
| GET | `/api/marks/my` | Current student's marks |
| GET | `/api/marks/class-average` | Subject averages |
| POST | `/api/marks` | Save/update marks |
| GET | `/api/attendance/my` | My attendance |
| GET | `/api/notifications` | My notifications |
| POST | `/api/chat` | Send AI chat message |
| GET | `/api/users` | All users (admin) |
| GET | `/api/users/stats` | System stats (admin) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| AI | Anthropic Claude API |
| Frontend | Vanilla HTML/CSS/JavaScript |
| Charts | Chart.js 4.x |
| Fonts | Google Fonts (Syne + DM Sans) |

---

## 📝 VS Code Tips

- Press **F5** to launch with the built-in debugger
- Install recommended extensions from `.vscode/extensions.json`
- Use the **REST Client** extension to test API endpoints
- Use **SQLTools** extension to browse the database visually

---

Made with ❤️ for academic excellence.
