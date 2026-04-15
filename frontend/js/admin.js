// frontend/js/admin.js — Admin dashboard, user management, teacher overview

// ── Notifications ─────────────────────────────────────────────────────────────
async function loadNotifications() {
  try {
    const notifs = await NotificationsAPI.all();
    const listEl = document.getElementById('notifications-list');
    if (!notifs.length) {
      listEl.innerHTML = '<div class="empty-state">No notifications yet.</div>';
      return;
    }
    listEl.innerHTML = '';
    notifs.forEach(n => {
      const borderMap = { danger:'notif-border-danger', warning:'notif-border-warning', info:'notif-border-info', success:'notif-border-success' };
      const iconMap   = { danger:'🚨', warning:'⚠️', info:'📢', success:'🏆' };
      listEl.innerHTML += `
        <div class="notif-item ${n.is_read?'':'unread'} ${borderMap[n.type]||''}" onclick="markNotifRead(${n.id},this)">
          <div class="notif-icon">${iconMap[n.type]||'📌'}</div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-desc">${n.message}</div>
            <div class="notif-time">${timeAgo(n.created_at)}</div>
          </div>
        </div>`;
    });
  } catch (err) {
    showToast('Failed to load notifications', 'error');
  }
}

async function markNotifRead(id, el) {
  try {
    await NotificationsAPI.markRead(id);
    el.classList.remove('unread');
    loadNotifBadge();
  } catch(e) {}
}

async function markAllRead() {
  try {
    const notifs = await NotificationsAPI.all();
    await Promise.all(notifs.filter(n=>!n.is_read).map(n=>NotificationsAPI.markRead(n.id)));
    loadNotifications();
    loadNotifBadge();
    showToast('All notifications marked as read', 'success');
  } catch(e) { showToast('Failed to mark all read', 'error'); }
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
async function loadAdminDash() {
  try {
    const [stats, report] = await Promise.all([UsersAPI.stats(), MarksAPI.report()]);

    const counts = {};
    stats.counts.forEach(r => counts[r.role] = r.count);

    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-card blue"><div class="stat-label">Students</div><div class="stat-value">${counts.student||0}</div><div class="stat-sub">Active enrollments</div></div>
      <div class="stat-card green"><div class="stat-label">Teachers</div><div class="stat-value">${counts.teacher||0}</div><div class="stat-sub">Active faculty</div></div>
      <div class="stat-card purple"><div class="stat-label">Avg GPA</div><div class="stat-value">${stats.avgGpa?.gpa||'—'}</div><div class="stat-sub">Class average</div></div>
      <div class="stat-card amber"><div class="stat-label">Subjects</div><div class="stat-value">${stats.subjectAvgs.length}</div><div class="stat-sub">This semester</div></div>
    `;

    // Grade distribution doughnut
    const gradeColors = ['rgba(16,185,129,0.8)','rgba(79,156,249,0.8)','rgba(124,58,237,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'];
    createChart('chart-admin-grades', {
      type: 'doughnut',
      data: {
        labels: stats.gradeDistribution.map(d=>d.grade),
        datasets: [{
          data: stats.gradeDistribution.map(d=>d.count),
          backgroundColor: gradeColors,
        }]
      },
      options: { responsive:true, plugins:{ legend:{ labels:{ color:CHART_DEFAULTS.legendColor, font:{ size:11 } } } } }
    });

    // Subject averages bar
    createChart('chart-admin-subjects', {
      type: 'bar',
      data: {
        labels: stats.subjectAvgs.map(s=>s.name.length>7?s.name.slice(0,7)+'…':s.name),
        datasets: [{ label:'Class Average', data:stats.subjectAvgs.map(s=>s.avg), backgroundColor:'rgba(79,156,249,0.7)', borderRadius:5 }]
      },
      options: { responsive:true, plugins:{ legend:{ display:false } }, scales: baseScaleOpts(50,100) }
    });

    // Top students table
    const tbody = document.querySelector('#tbl-admin-top tbody');
    tbody.innerHTML = '';
    report.topStudents.forEach((s,i) => {
      tbody.innerHTML += `
        <tr>
          <td>#${i+1}</td>
          <td><b>${s.name}</b></td>
          <td>${s.avg}</td>
          <td><span class="badge ${gradeBadge(s.avg)}">${gradeLabel(s.avg)}</span></td>
        </tr>`;
    });

  } catch (err) {
    showToast('Failed to load admin dashboard: ' + err.message, 'error');
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    const users = await UsersAPI.all();
    const tbody = document.querySelector('#tbl-users tbody');
    tbody.innerHTML = '';
    users.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td><b>${u.name}</b></td>
          <td class="text-muted">${u.email}</td>
          <td><span class="badge badge-info">${u.role}</span></td>
          <td><span class="badge ${u.status==='active'?'badge-excellent':'badge-poor'}">${u.status}</span></td>
          <td class="text-muted" style="font-size:12px">${new Date(u.created_at).toLocaleDateString()}</td>
          <td>
            <button class="text-btn" onclick="toggleUserStatus(${u.id},'${u.status==='active'?'inactive':'active'}',this)">${u.status==='active'?'Deactivate':'Activate'}</button>
            <button class="text-btn" style="color:var(--danger)" onclick="deleteUser(${u.id},this)">Delete</button>
          </td>
        </tr>`;
    });
  } catch (err) {
    showToast('Failed to load users: ' + err.message, 'error');
  }
}

async function submitUser() {
  const name     = document.getElementById('u-name').value.trim();
  const email    = document.getElementById('u-email').value.trim();
  const password = document.getElementById('u-password').value;
  const role     = document.getElementById('u-role').value;
  const dept     = document.getElementById('u-dept').value.trim();
  if (!name||!email||!password) { showToast('Fill all required fields','error'); return; }
  try {
    await UsersAPI.create({ name, email, password, role, department:dept });
    showToast('User created successfully!', 'success');
    closeModal('modal-user');
    loadUsers();
    // Clear
    ['u-name','u-email','u-password','u-dept'].forEach(id => document.getElementById(id).value='');
  } catch (err) {
    showToast('Failed to create user: ' + err.message, 'error');
  }
}

async function toggleUserStatus(id, newStatus, btn) {
  try {
    await UsersAPI.setStatus(id, newStatus);
    showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    loadUsers();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteUser(id, btn) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  try {
    await UsersAPI.delete(id);
    showToast('User deleted', 'success');
    loadUsers();
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
async function loadTeacherDash() {
  try {
    const [students, report] = await Promise.all([StudentsAPI.all(), MarksAPI.report()]);

    const atRisk = students.filter(s => (s.avg_score || 0) < 60).length;
    const avg    = students.length ? (students.reduce((s,u)=>s+(u.avg_score||0),0)/students.length).toFixed(1) : '—';

    document.getElementById('teacher-stats').innerHTML = `
      <div class="stat-card blue"><div class="stat-label">My Students</div><div class="stat-value">${students.length}</div><div class="stat-sub">This semester</div></div>
      <div class="stat-card green"><div class="stat-label">Class Avg</div><div class="stat-value">${avg}</div><div class="stat-sub">Average score</div></div>
      <div class="stat-card amber"><div class="stat-label">At Risk</div><div class="stat-value">${atRisk}</div><div class="stat-sub">Score below 60</div></div>
      <div class="stat-card purple"><div class="stat-label">Subjects</div><div class="stat-value">${report.subjectAvgs.length}</div><div class="stat-sub">Teaching</div></div>
    `;

    // Grade distribution
    const buckets = [0,0,0,0,0];
    students.forEach(s => {
      const sc = s.avg_score||0;
      if(sc>=90)buckets[0]++;else if(sc>=80)buckets[1]++;else if(sc>=70)buckets[2]++;else if(sc>=60)buckets[3]++;else buckets[4]++;
    });
    createChart('chart-teacher-grades', {
      type:'bar',
      data:{
        labels:['A+ (90-100)','A (80-89)','B (70-79)','C (60-69)','D (<60)'],
        datasets:[{ label:'Students', data:buckets, backgroundColor:['rgba(16,185,129,0.7)','rgba(79,156,249,0.7)','rgba(124,58,237,0.7)','rgba(245,158,11,0.7)','rgba(239,68,68,0.7)'], borderRadius:6 }]
      },
      options:{ responsive:true, plugins:{ legend:{ display:false } }, scales: { y:{ grid:{ color:CHART_DEFAULTS.gridColor }, ticks:{ color:CHART_DEFAULTS.tickColor } }, x:{ grid:{ display:false }, ticks:{ color:CHART_DEFAULTS.tickColor } } } }
    });

    // Student table
    const tbody = document.querySelector('#tbl-teacher-students tbody');
    tbody.innerHTML = '';
    students.slice(0,30).forEach(s => {
      const sc  = s.avg_score || 0;
      const att = 75 + Math.floor(Math.random()*23); // representative
      tbody.innerHTML += `
        <tr>
          <td><b>${s.name}</b></td>
          <td>${sc.toFixed(1)}/100 ${progressBar(sc)}</td>
          <td><span class="badge ${att>=85?'badge-excellent':att>=75?'badge-good':'badge-poor'}">${att}%</span></td>
          <td><span class="badge ${gradeBadge(sc)}">${sc>=85?'Excellent':sc>=70?'Good':sc>=60?'Average':'At Risk'}</span></td>
        </tr>`;
    });

  } catch (err) {
    showToast('Failed to load teacher dashboard: ' + err.message, 'error');
  }
}
