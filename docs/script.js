const savedHistory = localStorage.getItem('fluent_chat_history');
let chatHistory = savedHistory ? JSON.parse(savedHistory) : [];
let isSending = false;
let abortCtrl = null;
let lastShownDate = null;

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isSameYear = d.getFullYear() === now.getFullYear();
  let str = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  if (!isSameYear) str += ' · ' + d.getFullYear();
  return str;
}

function formatDateDivider(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Вчера';
  if (isToday) return 'Сегодня';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shouldShowDate(ts) {
  const currentDate = new Date(ts).toDateString();
  if (lastShownDate !== currentDate) {
    lastShownDate = currentDate;
    return true;
  }
  return false;
}

function addDateDivider(ts) {
  const wrap = document.getElementById('chat-messages');
  const divider = document.createElement('div');
  divider.className = 'date-divider';
  divider.textContent = formatDateDivider(ts);
  wrap.appendChild(divider);
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!isSending) sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function addMsg(role, text, ts = Date.now(), streaming = false) {
  const wrap = document.getElementById('chat-messages');
  if (shouldShowDate(ts)) addDateDivider(ts);
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  if (!streaming) div.style.animation = 'msg-in .3s var(--ease)';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatMsg(text);
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = formatTime(ts);
  div.appendChild(bubble);
  div.appendChild(meta);
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return bubble;
}

function renderStaticMsg(role, text, ts = Date.now()) {
  const wrap = document.getElementById('chat-messages');
  if (shouldShowDate(ts)) addDateDivider(ts);
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatMsg(text);
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = formatTime(ts);
  div.appendChild(bubble);
  div.appendChild(meta);
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function formatMsg(t) {
  return t
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code style="background:rgba(0,184,148,.15);color:var(--jade);padding:1px 5px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/\n/g,'<br/>');
}

function showTyping() {
  const wrap = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg msg-ai';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const btn = document.getElementById("send-btn");
  const userMessage = input.value.trim();
  if (!userMessage || isSending) return;

  isSending = true;
  btn.innerHTML = `<img src="./imgs/svg-spinners--blocks-wave.svg" alt="↑">`;
  btn.onclick = cancelRequest;
  addMsg("user", userMessage);
  chatHistory.push({ role: "user", text: userMessage, time: Date.now() });
  localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));

  input.value = "";
  input.style.height = "auto";
  showTyping();

  abortCtrl = new AbortController();

  try {
    const response = await fetch("https://fluent-ai-ujjf.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        history: chatHistory.slice(0, -1)
      }),
      signal: abortCtrl.signal
    });

    if (response.status === 429) {
      removeTyping();
      addMsg("ai", "⏳ Лимит запросов исчерпан.");
      chatHistory.push({ role: "assistant", text: "⏳ Лимит запросов исчерпан.", time: Date.now() });
      localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));
      resetInputState();
      return;
    }
    
    if (!response.ok) {
      removeTyping();
      addMsg("ai", "⚠️ Ошибка сервера");
      chatHistory.push({ role: "assistant", text: "⚠️ Ошибка сервера", time: Date.now() });
      localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));
      resetInputState();
      return;
    }

    const data = await response.json();
    removeTyping();
    const reply = data.reply || "AI не вернул ответ";
    addMsg("ai", reply);
    chatHistory.push({ role: "assistant", text: reply, time: Date.now() });
    localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));

  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error(err);
    removeTyping();
    addMsg("ai", "⚠️ Ошибка подключения к серверу");
    chatHistory.push({ role: "assistant", text: "⚠️ Ошибка подключения к серверу", time: Date.now() });
    localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));
  } finally {
    if (isSending) resetInputState();
    abortCtrl = null;
  }
}

function cancelRequest() {
  if (abortCtrl) abortCtrl.abort();
  removeTyping();
  addMsg("ai", "⏹️ Генерация остановлена");
  chatHistory.push({ role: "assistant", text: "⏹️ Генерация остановлена", time: Date.now() });
  localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));
  resetInputState();
}

function resetInputState() {
  isSending = false;
  const btn = document.getElementById("send-btn");
  btn.innerHTML = '<img src="./imgs/ri--arrow-up-long-line.svg" alt="↑">';
  btn.onclick = sendMessage;
}

function initChat() {
  const wrap = document.getElementById('chat-messages');
  const saved = localStorage.getItem('fluent_chat_history');
  lastShownDate = null;
  if (saved) {
    chatHistory = JSON.parse(saved);
    if (chatHistory.length > 0) {
      wrap.innerHTML = '';
      chatHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'ai';
        const ts = msg.time || Date.now();
        renderStaticMsg(role, msg.text, ts);
      });
      const last = chatHistory[chatHistory.length - 1];
      if (last && last.role === 'user') {
        chatHistory.pop();
        localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));
        const userMsgs = wrap.querySelectorAll('.msg-user');
        if (userMsgs.length > 0) userMsgs[userMsgs.length - 1].remove();
        setTimeout(() => {
          document.getElementById('chat-input').value = last.text;
          sendMessage();
        }, 500);
      }
      return;
    }
  }
  const defaultBubble = wrap.querySelector('.msg-ai .msg-bubble');
  if (defaultBubble && chatHistory.length === 0) {
    const txt = defaultBubble.innerHTML.replace(/<<br\s*\/?>/gi, '\n');
    chatHistory.push({ role: 'assistant', text: txt, time: Date.now() });
    localStorage.setItem('fluent_chat_history', JSON.stringify(chatHistory));
  }
}

initChat();
