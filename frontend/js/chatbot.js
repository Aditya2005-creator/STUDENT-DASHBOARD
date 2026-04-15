// frontend/js/chatbot.js

const QUICK_QUESTIONS = [
  'How is my overall performance?',
  'Which subjects need improvement?',
  'Give me study tips for my weak subjects',
  'What is my attendance status?',
  'How can I improve my GPA?',
  'Compare my score with class average',
  'What are my strongest subjects?',
  'Suggest a weekly study plan',
  'What assignments are pending?',
  'How to manage exam stress?',
  'Give me tips for History',
  'How to improve concentration?',
];

async function loadChatbot() {
  if (window._chatLoaded) return;
  window._chatLoaded = true;

  // Quick questions
  const qqEl = document.getElementById('quick-questions-list');
  qqEl.innerHTML = '';
  QUICK_QUESTIONS.forEach(q => {
    const btn = document.createElement('button');
    btn.className   = 'quick-q-btn';
    btn.textContent = q;
    btn.onclick     = () => sendQuickQuestion(q);
    qqEl.appendChild(btn);
  });

  // Load history from server
  try {
    const history = await ChatAPI.history();
    const msgsEl  = document.getElementById('chat-messages');
    msgsEl.innerHTML = '';
    if (history.length === 0) {
      addChatMessage('bot', '👋 Hello! I\'m your **AcademIQ AI Assistant**.\n\nI have access to your academic data — scores, attendance, assignments and more. Ask me anything about your performance or how to improve!\n\nWhat would you like to know today?');
    } else {
      history.forEach(h => addChatMessage(h.role === 'assistant' ? 'bot' : 'user', h.content, false));
    }
  } catch (e) {
    addChatMessage('bot', '👋 Hello! I\'m your AcademIQ AI Assistant. How can I help you today?');
  }

  // Enter key to send
  const input = document.getElementById('chat-input');
  input.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  };
}

function addChatMessage(role, text, scroll = true) {
  const msgsEl = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const avatar = role === 'bot' ? '🤖' : (window._currentUser?.name?.[0]?.toUpperCase() || 'U');
  // Render basic markdown: **bold**, *italic*, bullet lists
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g,     '<i>$1</i>')
    .replace(/\n/g, '<br>');
  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div>
      <div class="msg-bubble">${html}</div>
      <div class="msg-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
    </div>`;
  msgsEl.appendChild(div);
  if (scroll) msgsEl.scrollTop = msgsEl.scrollHeight;
}

function showTyping() {
  const msgsEl = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot'; div.id = 'typing-msg';
  div.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing-bubble"><span></span><span></span><span></span></div></div>`;
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-msg');
  if (t) t.remove();
}

async function sendChatMessage() {
  const input   = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const msg     = input.value.trim();
  if (!msg) return;

  input.value      = '';
  sendBtn.disabled = true;

  addChatMessage('user', msg);
  showTyping();

  try {
    const { reply } = await ChatAPI.send(msg);
    removeTyping();
    addChatMessage('bot', reply);
  } catch (err) {
    removeTyping();
    addChatMessage('bot', '⚠️ I had trouble connecting. Please try again in a moment.');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

async function sendQuickQuestion(q) {
  document.getElementById('chat-input').value = q;
  await sendChatMessage();
}

async function clearChat() {
  if (!confirm('Clear all chat history?')) return;
  try {
    await ChatAPI.clearHistory();
    document.getElementById('chat-messages').innerHTML = '';
    window._chatLoaded = false;
    loadChatbot();
    showToast('Chat history cleared', 'info');
  } catch (e) {
    showToast('Failed to clear chat', 'error');
  }
}
