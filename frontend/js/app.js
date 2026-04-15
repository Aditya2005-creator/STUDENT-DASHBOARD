// frontend/js/app.js — App bootstrap, navigation, utilities

window._charts = {};
window._currentUser = null;
window._chatLoaded  = false;

// ── Nav configs per role ──────────────────────────────────────────────────────
const NAV_CONFIG = {
  student: [
    { icon:'📊', label:'Dashboard',     page:'dashboard'     },
    { icon:'📈', label:'Analytics',     page:'analytics'     },
    { icon:'📅', label:'Attendance',    page:'attendance'    },
    { icon:'🔔', label:'Notifications', page:'notifications' },
    { icon:'📄', label:'Reports',       page:'reports'       },
    { icon:'🤖', label:'AI Chatbot',    page:'chatbot'       },
  ],
  teacher: [
    { icon:'🏠', label:'Overview',      page:'teacher-dash'  },
    { icon:'📝', label:'Manage Marks',  page:'marks'         },
    { icon:'📄', label:'Reports',       page:'reports'       },
    { icon:'🔔', label:'Notifications', page:'notifications' },
    { icon:'🤖', label:'AI Chatbot',    page:'chatbot'       },
  ],
  admin: [
    { icon:'🏠', label:'Overview',      page:'admin-dash'    },
    { icon:'👥', label:'Users',         page:'users'         },
    { icon:'📝', label:'Marks',         page:'marks'         },
    { icon:'📄', label:'Reports',       page:'reports'       },
    { icon:'🤖', label:'AI Chatbot',    page:'chatbot'       },
  ],
};

const PAGE_TITLES = {
  'dashboard':   'Dashboard',
  'analytics':   'Analytics & Insights',
  'attendance':  'Attendance',
  'notifications':'Notifications',
  'reports':     'Reports',
  'chatbot':     'AI Academic Assistant',
  'teacher-dash':'Teacher Overview',
  'marks':       'Marks Management',
  'admin-dash':  'Admin Overview',
  'users':       'User Management',
};

// ── Start app after login ─────────────────────────────────────────────────────
function startApp(user) {
  window._currentUser = user;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display        = 'block';

  // Sidebar user info
  document.getElementById('nav-avatar').textContent    = user.name[0].toUpperCase();
  document.getElementById('nav-name').textContent      = user.name;
  document.getElementById('nav-role').textContent      = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  document.getElementById('brand-portal').textContent  = user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' Portal';
  document.getElementById('topbar-user-info').textContent = user.name;

  // Build nav
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';
  (NAV_CONFIG[user.role] || []).forEach(item => {
    const el = document.createElement('div');
    el.className   = 'nav-item';
    el.dataset.page = item.page;
    el.innerHTML   = `<span class="nav-icon">${item.icon}</span><span>${item.label}</span>`;
    el.onclick     = () => navigateTo(item.page);
    nav.appendChild(el);
  });

  // Notification badge
  loadNotifBadge();

  // Navigate to default page
  const defaults = { student:'dashboard', teacher:'teacher-dash', admin:'admin-dash' };
  navigateTo(defaults[user.role] || 'dashboard');
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigateTo(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Active nav item
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  // Show page
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  // Update title
  document.getElementById('page-title').textContent = PAGE_TITLES[pageId] || pageId;
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  // Load page data
  switch (pageId) {
    case 'dashboard':    loadDashboard();    break;
    case 'analytics':    loadAnalytics();    break;
    case 'attendance':   loadAttendance();   break;
    case 'notifications':loadNotifications();break;
    case 'reports':      loadReports();      break;
    case 'chatbot':      loadChatbot();      break;
    case 'teacher-dash': loadTeacherDash();  break;
    case 'marks':        loadMarks();        break;
    case 'admin-dash':   loadAdminDash();    break;
    case 'users':        loadUsers();        break;
  }
}

// ── Sidebar toggle (mobile) ───────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Notification badge ────────────────────────────────────────────────────────
async function loadNotifBadge() {
  try {
    const notifs = await NotificationsAPI.all();
    const unread = notifs.filter(n => !n.is_read).length;
    const badge  = document.getElementById('notif-badge');
    badge.textContent    = unread;
    badge.style.display  = unread > 0 ? 'flex' : 'none';
  } catch(e) {}
}

// ── Chart helpers ─────────────────────────────────────────────────────────────
function destroyChart(id) {
  if (window._charts[id]) {
    try { window._charts[id].destroy(); } catch(e) {}
    delete window._charts[id];
  }
}

function createChart(id, config) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  window._charts[id] = new Chart(ctx, config);
  return window._charts[id];
}

const CHART_DEFAULTS = {
  gridColor: 'rgba(255,255,255,0.04)',
  tickColor: '#8fa3bf',
  legendColor: '#8fa3bf',
};

function baseScaleOpts(min = 0, max = 100) {
  return {
    y: { min, max, grid:{ color:CHART_DEFAULTS.gridColor }, ticks:{ color:CHART_DEFAULTS.tickColor } },
    x: { grid:{ display:false }, ticks:{ color:CHART_DEFAULTS.tickColor, font:{ size:11 } } },
  };
}

// ── Badge helper ──────────────────────────────────────────────────────────────
function gradeBadge(score) {
  if (score >= 85) return 'badge-excellent';
  if (score >= 70) return 'badge-good';
  if (score >= 55) return 'badge-average';
  return 'badge-poor';
}
function gradeLabel(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
function statusBadge(status) {
  const map = { submitted:'badge-submitted', pending:'badge-pending', late:'badge-late', graded:'badge-excellent', active:'badge-good', inactive:'badge-poor' };
  return map[status] || 'badge-info';
}

// ── Progress bar HTML ─────────────────────────────────────────────────────────
function progressBar(pct, color) {
  const c = color || (pct>=85?'var(--accent3)':pct>=70?'var(--accent)':pct>=55?'var(--accent4)':'var(--danger)');
  return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${c}"></div></div>`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOnBg(e, id) { if (e.target.id === id) closeModal(id); }

// ── Search ────────────────────────────────────────────────────────────────────
document.getElementById('topbar-search').addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  if (!q || q.length < 2) return;
  document.querySelectorAll('table tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});
document.getElementById('topbar-search').addEventListener('blur', function() {
  if (!this.value) {
    document.querySelectorAll('table tbody tr').forEach(r => r.style.display = '');
  }
});

// ── Time formatter ────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
