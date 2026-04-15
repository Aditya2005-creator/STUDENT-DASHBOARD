// frontend/js/auth.js — Login, register, session management

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  document.getElementById('login-form').style.display    = tab==='login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab==='register' ? 'block' : 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.querySelector('.btn-text').style.display    = 'none';
  btn.querySelector('.btn-loading').style.display = 'inline';
  try {
    const data = await AuthAPI.login(email, password);
    localStorage.setItem('aq_token', data.token);
    localStorage.setItem('aq_user',  JSON.stringify(data.user));
    startApp(data.user);
  } catch (err) {
    errEl.textContent    = err.message;
    errEl.style.display  = 'block';
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display    = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  const errEl    = document.getElementById('reg-error');
  errEl.style.display = 'none';
  try {
    await AuthAPI.register({ name, email, password, role });
    showToast('Account created! Please sign in.', 'success');
    switchAuthTab('login');
    document.getElementById('login-email').value    = email;
    document.getElementById('login-password').value = password;
  } catch (err) {
    errEl.textContent   = err.message;
    errEl.style.display = 'block';
  }
}

async function quickLogin(email, password) {
  document.getElementById('login-email').value    = email;
  document.getElementById('login-password').value = password;
  try {
    const data = await AuthAPI.login(email, password);
    localStorage.setItem('aq_token', data.token);
    localStorage.setItem('aq_user',  JSON.stringify(data.user));
    startApp(data.user);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function logout() {
  localStorage.removeItem('aq_token');
  localStorage.removeItem('aq_user');
  // Destroy all charts
  Object.values(window._charts || {}).forEach(c => { try { c.destroy(); } catch(e){} });
  window._charts = {};
  document.getElementById('app').style.display         = 'none';
  document.getElementById('login-page').style.display  = 'flex';
  document.getElementById('chat-messages').innerHTML   = '';
  window._chatLoaded = false;
}

// Auto-login if token exists
(async function checkSession() {
  const token = localStorage.getItem('aq_token');
  const user  = JSON.parse(localStorage.getItem('aq_user') || 'null');
  if (token && user) {
    try {
      const me = await AuthAPI.me();
      startApp(me);
    } catch {
      localStorage.removeItem('aq_token');
      localStorage.removeItem('aq_user');
    }
  }
})();
