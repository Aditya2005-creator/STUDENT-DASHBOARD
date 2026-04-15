// backend/routes/chat.js
const express = require('express');
const router  = express.Router();
const https   = require('https');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// Build student context from DB
function buildStudentContext(userId, db) {
  const student = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  if (!student) return '';

  const marks = db.prepare(`
    SELECT s.name as subject, m.total, m.grade
    FROM marks m JOIN subjects s ON s.id=m.subject_id
    WHERE m.student_id=? ORDER BY m.total DESC
  `).all(userId);

  const attSummary = db.prepare(`
    SELECT COUNT(CASE WHEN status='present' THEN 1 END) as present, COUNT(*) as total
    FROM attendance WHERE student_id=?
  `).get(userId);

  const attBySubject = db.prepare(`
    SELECT s.name,
      ROUND(COUNT(CASE WHEN a.status='present' THEN 1 END)*100.0/COUNT(*),0) as pct
    FROM attendance a JOIN subjects s ON s.id=a.subject_id
    WHERE a.student_id=? GROUP BY a.subject_id ORDER BY pct ASC
  `).all(userId);

  const assignments = db.prepare(`
    SELECT title, status, score, max_score FROM assignments WHERE student_id=? ORDER BY due_date DESC LIMIT 5
  `).all(userId);

  const allAvgs = db.prepare('SELECT student_id, AVG(total) as avg FROM marks GROUP BY student_id ORDER BY avg DESC').all();
  const rank = allAvgs.findIndex(r => r.student_id === userId) + 1;
  const myAvg = allAvgs.find(r => r.student_id === userId);
  const gpa = myAvg ? (myAvg.avg / 10).toFixed(1) : 'N/A';
  const attPct = attSummary.total > 0 ? Math.round(attSummary.present / attSummary.total * 100) : 0;

  const strongSubjects = marks.filter(m => m.total >= 80).map(m => `${m.subject}(${m.total})`).join(', ') || 'None';
  const weakSubjects   = marks.filter(m => m.total <  70).map(m => `${m.subject}(${m.total})`).join(', ') || 'None';
  const lowAttSubjects = attBySubject.filter(a => a.pct < 75).map(a => `${a.name}(${a.pct}%)`).join(', ') || 'None';

  return `You are AcademIQ AI, a friendly and knowledgeable academic assistant embedded in a student performance dashboard.

STUDENT PROFILE:
- Name: ${student.name}
- GPA: ${gpa}/10
- Class Rank: #${rank} out of ${allAvgs.length} students
- Overall Attendance: ${attPct}%

SUBJECT SCORES:
${marks.map(m => `  • ${m.subject}: ${m.total}/100 (${m.grade})`).join('\n')}

ATTENDANCE BY SUBJECT:
${attBySubject.map(a => `  • ${a.name}: ${a.pct}% ${a.pct < 75 ? '⚠️ Below minimum' : '✓'}`).join('\n')}

STRONG SUBJECTS: ${strongSubjects}
WEAK SUBJECTS: ${weakSubjects}
LOW ATTENDANCE SUBJECTS: ${lowAttSubjects}

RECENT ASSIGNMENTS:
${assignments.map(a => `  • ${a.title}: ${a.status}${a.score ? ` (${a.score}/${a.max_score})` : ''}`).join('\n')}

INSTRUCTIONS:
- Provide personalized, encouraging, and specific academic advice using the actual data above.
- When asked about performance, reference real scores and specific subjects.
- Give actionable study tips tailored to weak areas.
- Keep responses concise (3-6 sentences or a short bulleted list).
- Use a warm, supportive tone. Use emojis sparingly for emphasis.
- If attendance is below 75% in any subject, proactively mention it.
- Never make up data not provided above.`;
}

// Helper: call Anthropic API via raw HTTPS (no SDK needed)
function callAnthropic(apiKey, systemPrompt, messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.content?.[0]?.text || 'No response');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// POST /api/chat
router.post('/', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const db = getDB();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Build context from DB
  const systemPrompt = buildStudentContext(req.user.id, db);

  // Get recent chat history
  const history = db.prepare(`
    SELECT role, content FROM chat_history
    WHERE user_id=? ORDER BY created_at DESC LIMIT 10
  `).all(req.user.id).reverse();

  // Save user message
  db.prepare('INSERT INTO chat_history(user_id,role,content) VALUES(?,?,?)').run(req.user.id, 'user', message);

  const messages = [...history, { role: 'user', content: message }];

  let reply;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    // Smart local fallback (no API key needed for demo)
    reply = generateLocalReply(message, req.user.id, db);
  } else {
    try {
      reply = await callAnthropic(apiKey, systemPrompt, messages);
    } catch (err) {
      console.error('Anthropic API error:', err.message);
      reply = generateLocalReply(message, req.user.id, db);
    }
  }

  // Save assistant reply
  db.prepare('INSERT INTO chat_history(user_id,role,content) VALUES(?,?,?)').run(req.user.id, 'assistant', reply);

  res.json({ reply });
});

// GET /api/chat/history
router.get('/history', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT role, content, created_at FROM chat_history
    WHERE user_id=? ORDER BY created_at ASC LIMIT 50
  `).all(req.user.id);
  res.json(rows);
});

// DELETE /api/chat/history
router.delete('/history', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM chat_history WHERE user_id=?').run(req.user.id);
  res.json({ success: true });
});

function generateLocalReply(text, userId, db) {
  const t = text.toLowerCase();
  const marks = db.prepare(`
    SELECT s.name as subject, m.total, m.grade FROM marks m
    JOIN subjects s ON s.id=m.subject_id WHERE m.student_id=? ORDER BY m.total DESC
  `).all(userId);
  const attPct = db.prepare(`
    SELECT ROUND(COUNT(CASE WHEN status='present' THEN 1 END)*100.0/COUNT(*),0) as pct
    FROM attendance WHERE student_id=?
  `).get(userId)?.pct || 0;
  const allAvgs = db.prepare('SELECT student_id, AVG(total) as avg FROM marks GROUP BY student_id ORDER BY avg DESC').all();
  const rank = allAvgs.findIndex(r => r.student_id === userId) + 1;
  const myAvg = allAvgs.find(r => r.student_id === userId);
  const gpa = myAvg ? (myAvg.avg / 10).toFixed(1) : '?';
  const strong = marks.filter(m=>m.total>=80).map(m=>m.subject).join(', ') || 'None';
  const weak   = marks.filter(m=>m.total<70).map(m=>m.subject).join(', ')  || 'None';

  if (t.includes('gpa') || t.includes('overall') || t.includes('performance') || t.includes('summary')) {
    return `📊 **Your Performance Summary:**\n\n• GPA: **${gpa}/10** | Rank: **#${rank}**\n• Attendance: **${attPct}%**\n• Strong subjects: ${strong}\n• Need improvement: ${weak}\n\nYou're doing well! Focus on ${weak || 'maintaining your current performance'} to move up the rankings.`;
  }
  if (t.includes('attendance') || t.includes('absent')) {
    return `📅 **Attendance Status:** Overall **${attPct}%**\n\nThe minimum required is 75%. ${attPct < 75 ? '⚠️ Your attendance is below the minimum — you may be ineligible for exams in some subjects. Prioritize attending all classes immediately.' : '✅ You\'re above the minimum. Keep it consistent!'}`;
  }
  if (t.includes('weak') || t.includes('improv') || t.includes('poor') || t.includes('fail')) {
    return `📈 **Improvement Plan for ${weak || 'your weaker areas'}:**\n\n1. Attend every class without fail\n2. Review notes within 24 hours of each lecture\n3. Practice 2-3 past papers per week\n4. Create flashcards for key concepts\n5. Form a study group with classmates\n\nConsistent daily effort beats last-minute cramming every time!`;
  }
  if (t.includes('study plan') || t.includes('schedule') || t.includes('routine')) {
    return `🗓️ **Recommended Weekly Study Plan:**\n\n• **Mon-Fri:** 2hrs focused study after school (weakest subjects first)\n• **Saturday:** Practice papers + assignment completion\n• **Sunday:** Review the week's material + rest\n\n**Daily tip:** Use the Pomodoro method — 25 min study, 5 min break. Your weak subjects (${weak || 'review your marks'}) deserve extra time this week!`;
  }
  if (t.includes('tip') || t.includes('how to') || t.includes('help')) {
    return `💡 **Top Study Strategies for You:**\n\n1. **Active Recall** — Test yourself instead of re-reading\n2. **Spaced Repetition** — Review after 1 day, 1 week, 1 month\n3. **Teach to Learn** — Explain topics to classmates\n4. **Mind Maps** — Great for History, Geography, Biology\n5. **Past Papers** — Essential for Math, Physics, Chemistry\n\nYou're ranked #${rank} — these strategies can push you even higher! 🎯`;
  }
  if (t.includes('rank') || t.includes('position') || t.includes('class')) {
    return `🏆 You are currently ranked **#${rank}** in your class.\n\nYour GPA of **${gpa}** is ${parseFloat(gpa) >= 8 ? 'excellent' : parseFloat(gpa) >= 7 ? 'good' : 'developing'}. To improve your rank, focus on bringing up your scores in **${weak || 'all subjects'}** as even small improvements there will make a significant difference.`;
  }
  return `I can see your academic data. Your GPA is **${gpa}/10** and you're ranked **#${rank}** with **${attPct}% attendance**.\n\nYour strengths are ${strong || 'being developed'}. Would you like specific tips on improving ${weak || 'any subject'}, a study plan, or strategies for upcoming exams? Just ask! 📚`;
}

module.exports = router;
