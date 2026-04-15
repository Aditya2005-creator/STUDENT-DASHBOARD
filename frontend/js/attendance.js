// frontend/js/attendance.js

async function loadAttendance() {
  const user = window._currentUser;
  if (!user || user.role !== 'student') return;
  try {
    const [data, calendar] = await Promise.all([
      StudentsAPI.dashboard(user.id),
      StudentsAPI.calendar(user.id),
    ]);

    const { present, absent, total } = data.attSummary;
    const pct = total > 0 ? Math.round(present / total * 100) : 0;
    const pctColor = pct >= 85 ? 'green' : pct >= 75 ? 'blue' : 'amber';

    document.getElementById('attendance-stats').innerHTML = `
      <div class="stat-card green">
        <div class="stat-label">Present Days</div>
        <div class="stat-value">${present}</div>
        <div class="stat-sub">This semester</div>
      </div>
      <div class="stat-card blue" style="--accent:var(--danger)">
        <div class="stat-label">Absent Days</div>
        <div class="stat-value" style="color:var(--danger)">${absent}</div>
        <div class="stat-sub">This semester</div>
      </div>
      <div class="stat-card ${pctColor}">
        <div class="stat-label">Overall %</div>
        <div class="stat-value">${pct}%</div>
        <div class="stat-sub">Min required: 75%</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">Working Days</div>
        <div class="stat-value">${total}</div>
        <div class="stat-sub">Total recorded</div>
      </div>
    `;

    // Calendar
    const calEl = document.getElementById('att-calendar');
    calEl.innerHTML = '';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
      calEl.innerHTML += `<div class="att-day-label">${d}</div>`;
    });

    // Build 7-col grid from calendar data (last 63 working days -> fill to 7 cols)
    const calRows = calendar.slice(0, 63);
    // Pad start to align to weekday (Mon=0)
    if (calRows.length > 0) {
      const firstDate = new Date(calRows[0].date);
      const dayOfWeek = (firstDate.getDay() + 6) % 7; // Mon=0
      for (let i = 0; i < dayOfWeek; i++) {
        calEl.innerHTML += `<div class="att-day att-holiday">–</div>`;
      }
    }
    calRows.forEach((row, i) => {
      const cls = row.status === 'present' ? 'att-present' : 'att-absent';
      calEl.innerHTML += `<div class="att-day ${cls}" title="${row.date}: ${row.status}">${i+1}</div>`;
    });

    // Subject-wise attendance chart
    const attSubj = data.attBySubject || [];
    const labels   = attSubj.map(a => a.name.length > 7 ? a.name.slice(0,7)+'…' : a.name);
    const pcts     = attSubj.map(a => parseFloat(a.pct));

    createChart('chart-subj-att', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Attendance %',
          data: pcts,
          backgroundColor: pcts.map(p => p >= 85 ? 'rgba(16,185,129,0.7)' : p >= 75 ? 'rgba(79,156,249,0.7)' : 'rgba(239,68,68,0.7)'),
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend:{ display:false } },
        scales: {
          y: { min:50, max:100, grid:{ color:CHART_DEFAULTS.gridColor }, ticks:{ color:CHART_DEFAULTS.tickColor, callback: v => v+'%' } },
          x: { grid:{ display:false }, ticks:{ color:CHART_DEFAULTS.tickColor, font:{ size:11 } } }
        }
      }
    });

  } catch (err) {
    showToast('Failed to load attendance: ' + err.message, 'error');
  }
}
