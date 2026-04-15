// frontend/js/api.js — Central API helper
const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('aq_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

const AuthAPI = {
  login:    (email, password) => apiFetch('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) }),
  register: (data)            => apiFetch('/auth/register', { method:'POST', body: JSON.stringify(data) }),
  me:       ()                => apiFetch('/auth/me'),
};
const StudentsAPI = {
  all:       ()   => apiFetch('/students'),
  dashboard: (id) => apiFetch(`/students/${id}/dashboard`),
  calendar:  (id) => apiFetch(`/students/${id}/attendance-calendar`),
};
const MarksAPI = {
  my:           ()     => apiFetch('/marks/my'),
  all:          ()     => apiFetch('/marks'),
  classAverage: ()     => apiFetch('/marks/class-average'),
  report:       ()     => apiFetch('/marks/report'),
  save:         (data) => apiFetch('/marks', { method:'POST', body: JSON.stringify(data) }),
};
const SubjectsAPI = {
  all:    ()     => apiFetch('/subjects'),
  create: (data) => apiFetch('/subjects', { method:'POST', body: JSON.stringify(data) }),
};
const NotificationsAPI = {
  all:     ()   => apiFetch('/notifications'),
  markRead:(id) => apiFetch(`/notifications/${id}/read`, { method:'PATCH' }),
  send:    (d)  => apiFetch('/notifications', { method:'POST', body: JSON.stringify(d) }),
};
const AssignmentsAPI = {
  my:     ()     => apiFetch('/assignments/my'),
  all:    ()     => apiFetch('/assignments'),
  grade:  (id,d) => apiFetch(`/assignments/${id}`, { method:'PATCH', body: JSON.stringify(d) }),
  create: (d)    => apiFetch('/assignments', { method:'POST', body: JSON.stringify(d) }),
};
const ChatAPI = {
  send:         (message) => apiFetch('/chat', { method:'POST', body: JSON.stringify({ message }) }),
  history:      ()        => apiFetch('/chat/history'),
  clearHistory: ()        => apiFetch('/chat/history', { method:'DELETE' }),
};
const UsersAPI = {
  all:       ()     => apiFetch('/users'),
  stats:     ()     => apiFetch('/users/stats'),
  create:    (d)    => apiFetch('/users', { method:'POST', body: JSON.stringify(d) }),
  setStatus: (id,s) => apiFetch(`/users/${id}/status`, { method:'PATCH', body: JSON.stringify({ status:s }) }),
  delete:    (id)   => apiFetch(`/users/${id}`, { method:'DELETE' }),
};
