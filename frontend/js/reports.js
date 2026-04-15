// frontend/js/reports.js

const REPORT_DEFS = [
  { id:'performance', icon:'📊', title:'Performance Summary', desc:'Full academic performance with subject-wise breakdown, trends, and comparison with class averages.' },
  { id:'attendance',  icon:'📅', title:'Attendance Report',   desc:'Detailed attendance record with monthly breakdowns, subject-wise stats, and warning flags.' },
  { id:'assignments', icon:'📝', title:'Assignment Report',   desc:'Track all submitted and pending assignments with scores, deadlines, and completion rates.' },
  { id:'improvement', icon:'🎯', title:'Improvement Plan',    desc:'Personalised improvement plan based on weak subjects and attendance gaps.' },
];

function loadReports() {
  const grid = document.getElementById('reports-grid');
  grid.innerHTML = '';
  REPORT_DEFS.forEach(r => {
    grid.innerHTML += `
      <div class="report-card">
        <div class="report-icon">${r.icon}</div>
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
        <button class="btn-primary-sm" onclick="generateReport('${r.id}')">Generate Report</button>
      </div>`;
  });
}

async function generateReport(type) {
  const user   = window._currentUser;
  const outEl  = document.getElementById('report-output');
  const titleEl= document.getElementById('report-output-title');
  const bodyEl = document.getElementById('report-output-body');
  outEl.style.display = 'block';
  bodyEl.innerHTML = '<div class="loading-text">⏳ Generating report...</div>';

  try {
    let html = '';
    if (user.role === 'student') {
      const [data, classAvg] = await Promise.all([StudentsAPI.dashboard(user.id), MarksAPI.classAverage()]);
      const avgMap = {}; classAvg.forEach(r => avgMap[r.subject] = r.avg);

      if (type === 'performance') {
        titleEl.textContent = `📊 Performance Summary — ${data.student.name}`;
        html = `
          <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Generated: ${new Date().toLocaleString()} | Semester: 2024-25</p>
          <div class="stats-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="stat-card blue"><div class="stat-label">GPA</div><div class="stat-value">${data.gpa}</div></div>
            <div class="stat-card green"><div class="stat-label">Attendance</div><div class="stat-value">${data.attPct}%</div></div>
            <div class="stat-card purple"><div class="stat-label">Rank</div><div class="stat-value">#${data.rank}</div></div>
            <div class="stat-card amber"><div class="stat-label">Subjects</div><div class="stat-value">${data.marks.length}</div></div>
          </div>
          <table style="width:100%;margin-top:16px">
            <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Class Avg</th><th>Difference</th></tr></thead>
            <tbody>${data.marks.map(m => {
              const diff = m.total - (avgMap[m.subject] || 0);
              return `<tr>
                <td><b>${m.subject}</b></td>
                <td>${m.total}/100 ${progressBar(m.total)}</td>
                <td><span class="badge ${gradeBadge(m.total)}">${m.grade}</span></td>
                <td class="text-muted">${(avgMap[m.subject]||0).toFixed(1)}</td>
                <td style="color:${diff>=0?'var(--accent3)':'var(--danger)'}">${diff>=0?'+':''}${diff.toFixed(1)}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>`;

      } else if (type === 'attendance') {
        titleEl.textContent = `📅 Attendance Report — ${data.student.name}`;
        const { present, absent, total } = data.attSummary;
        html = `
          <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Total working days: ${total}</p>
          <div class="stats-row" style="grid-template-columns:1fr 1fr 1fr">
            <div class="stat-card green"><div class="stat-label">Present</div><div class="stat-value">${present}</div></div>
            <div class="stat-card blue"><div class="stat-label">Absent</div><div class="stat-value" style="color:var(--danger)">${absent}</div></div>
            <div class="stat-card amber"><div class="stat-label">Percentage</div><div class="stat-value">${data.attPct}%</div></div>
          </div>
          <table style="width:100%;margin-top:16px">
            <thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>Attendance %</th><th>Status</th></tr></thead>
            <tbody>${(data.attBySubject||[]).map(a => `<tr>
              <td><b>${a.name}</b></td><td>${a.present}</td><td>${a.total}</td>
              <td>${progressBar(a.pct)} ${a.pct}%</td>
              <td><span class="badge ${a.pct>=85?'badge-excellent':a.pct>=75?'badge-good':'badge-poor'}">${a.pct>=85?'Excellent':a.pct>=75?'OK':'⚠️ Low'}</span></td>
            </tr>`).join('')}</tbody>
          </table>`;

      } else if (type === 'assignments') {
        titleEl.textContent = `📝 Assignment Report — ${data.student.name}`;
        html = `
          <table style="width:100%">
            <thead><tr><th>Assignment</th><th>Subject</th><th>Score</th><th>Max</th><th>%</th><th>Status</th><th>Due</th></tr></thead>
            <tbody>${(data.assignments||[]).map(a => `<tr>
              <td>${a.title}</td>
              <td class="text-muted" style="font-size:12px">${a.subject}</td>
              <td>${a.score ?? '—'}</td>
              <td class="text-muted">${a.max_score}</td>
              <td>${a.status==='pending'?'—':Math.round(a.score/a.max_score*100)+'%'}</td>
              <td><span class="badge ${statusBadge(a.status)}">${a.status}</span></td>
              <td class="text-muted" style="font-size:12px">${a.due_date||'—'}</td>
            </tr>`).join('')}</tbody>
          </table>`;

      } else if (type === 'improvement') {
        titleEl.textContent = `🎯 Improvement Plan — ${data.student.name}`;
        const weakSubjects = data.marks.filter(m=>m.total<75).sort((a,b)=>a.total-b.total);
        const lowAtt = (data.attBySubject||[]).filter(a=>a.pct<75);
        html = `
          <div style="margin-bottom:20px">
            <h3 style="font-size:15px;margin-bottom:10px">📉 Subjects Needing Attention</h3>
            ${weakSubjects.length===0?'<p class="text-muted">All subjects are above 75! Great job.</p>':weakSubjects.map(m=>`
              <div class="subject-bar-item">
                <div class="subject-bar-row"><b>${m.subject}</b><span style="color:var(--danger)">${m.total}/100</span></div>
                ${progressBar(m.total,'var(--danger)')}
                <p style="font-size:12px;color:var(--text2);margin-top:6px">Target: +${75-m.total} marks needed to reach B grade. Practice past papers, attend all classes, form study groups.</p>
              </div>`).join('')}
          </div>
          <div>
            <h3 style="font-size:15px;margin-bottom:10px">📅 Low Attendance Subjects</h3>
            ${lowAtt.length===0?'<p class="text-muted">Attendance is good in all subjects!</p>':lowAtt.map(a=>`
              <div style="margin-bottom:10px;padding:12px;background:rgba(239,68,68,0.08);border-radius:8px;border-left:3px solid var(--danger)">
                <b>${a.name}</b> — ${a.pct}% (${75-a.pct}% below minimum)
                <p style="font-size:12px;color:var(--text2);margin-top:4px">Attend every class immediately. Missing more classes may make you ineligible for the final exam.</p>
              </div>`).join('')}
          </div>`;
      }

    } else {
      // Teacher/Admin report
      titleEl.textContent = '📊 System Performance Report';
      const report = await MarksAPI.report();
      html = `
        <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Generated: ${new Date().toLocaleString()}</p>
        <h3 style="font-size:14px;margin-bottom:10px">Grade Distribution</h3>
        <table style="width:100%;margin-bottom:20px">
          <thead><tr><th>Grade</th><th>Students</th></tr></thead>
          <tbody>${report.dist.map(d=>`<tr><td><span class="badge ${gradeBadge(d.grade==='A+'?91:d.grade==='A'?81:d.grade==='B'?71:d.grade==='C'?61:51)}">${d.grade}</span></td><td>${d.count}</td></tr>`).join('')}</tbody>
        </table>
        <h3 style="font-size:14px;margin-bottom:10px">Top Students</h3>
        <table style="width:100%">
          <thead><tr><th>Rank</th><th>Student</th><th>Avg Score</th><th>Grade</th></tr></thead>
          <tbody>${report.topStudents.map((s,i)=>`<tr><td>#${i+1}</td><td>${s.name}</td><td>${s.avg}</td><td><span class="badge ${gradeBadge(s.avg)}">${gradeLabel(s.avg)}</span></td></tr>`).join('')}</tbody>
        </table>`;
    }

    bodyEl.innerHTML = html;
  } catch (err) {
    bodyEl.innerHTML = `<p class="text-red">Failed to generate report: ${err.message}</p>`;
  }
  outEl.scrollIntoView({ behavior:'smooth' });
}
