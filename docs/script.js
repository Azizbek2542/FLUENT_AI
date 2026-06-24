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

(function () {
  'use strict';

  let isDark = false;
  let busy   = false;

  const themeBtn = document.getElementById('theme');

  const MOON_SVG =`<svg class="moon" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><g fill="none" stroke="currentcolor" stroke-dasharray="4" stroke-dashoffset="4" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5"><animate id="lineMdMoonAltLoop0" fill="freeze" attributeName="stroke-dashoffset" begin="0.7s;lineMdMoonAltLoop0.begin+6s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="lineMdMoonAltLoop0.begin+2s;lineMdMoonAltLoop0.begin+4s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="lineMdMoonAltLoop0.begin+1.2s;lineMdMoonAltLoop0.begin+3.2s;lineMdMoonAltLoop0.begin+5.2s" dur="0.4s" values="0;4"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop0.begin+1.8s" to="M12 5h1.5M12 5h-1.5M12 5v1.5M12 5v-1.5"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop0.begin+3.8s" to="M12 4h1.5M12 4h-1.5M12 4v1.5M12 4v-1.5"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop0.begin+5.8s" to="M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5"/></path><path d="M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5"><animate id="lineMdMoonAltLoop1" fill="freeze" attributeName="stroke-dashoffset" begin="1.1s;lineMdMoonAltLoop1.begin+6s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="lineMdMoonAltLoop1.begin+2s;lineMdMoonAltLoop1.begin+4s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="lineMdMoonAltLoop1.begin+1.2s;lineMdMoonAltLoop1.begin+3.2s;lineMdMoonAltLoop1.begin+5.2s" dur="0.4s" values="0;4"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop1.begin+1.8s" to="M17 11h1.5M17 11h-1.5M17 11v1.5M17 11v-1.5"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop1.begin+3.8s" to="M18 12h1.5M18 12h-1.5M18 12v1.5M18 12v-1.5"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop1.begin+5.8s" to="M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5"/></path><path d="M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5"><animate id="lineMdMoonAltLoop2" fill="freeze" attributeName="stroke-dashoffset" begin="2s;lineMdMoonAltLoop2.begin+6s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="lineMdMoonAltLoop2.begin+2s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="lineMdMoonAltLoop2.begin+1.2s;lineMdMoonAltLoop2.begin+3.2s" dur="0.4s" values="0;4"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop2.begin+1.8s" to="M20 5h1.5M20 5h-1.5M20 5v1.5M20 5v-1.5"/><set fill="freeze" attributeName="d" begin="lineMdMoonAltLoop2.begin+5.8s" to="M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5"/></path></g><path fill="none" stroke="currentcolor" stroke-dasharray="56" stroke-dashoffset="56" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="56;0"/></path></svg>`;

  const SUN_SVG = `<svg class="sun" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="36" stroke-dashoffset="36" d="M12 7c2.76 0 5 2.24 5 5c0 2.76 -2.24 5 -5 5c-2.76 0 -5 -2.24 -5 -5c0 -2.76 2.24 -5 5 -5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="36;0"/></path><g><path stroke-dasharray="2" stroke-dashoffset="2" d="M12 19v1M19 12h1M12 5v-1M5 12h-1"><animate fill="freeze" attributeName="d" begin="0.5s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="2;0"/></path><path stroke-dasharray="2" stroke-dashoffset="2" d="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5"><animate fill="freeze" attributeName="d" begin="0.7s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="2;0"/></path><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></g></svg>`;

  /* ── Inject styles ── */
  const style = document.createElement('style');
  style.textContent = `
    .no-tr, .no-tr * { transition: none !important; }

    /* TO DARK: new layer expands on top */
    .to-dark::view-transition-old(root) { z-index: 1; animation: none; }
    .to-dark::view-transition-new(root) { z-index: 2; animation: vt-expand var(--vt-dur,600ms) cubic-bezier(.4,0,.2,1) forwards; }

    /* TO LIGHT: old layer shrinks on top, new is already below */
    .to-light::view-transition-old(root) { z-index: 2; animation: vt-shrink var(--vt-dur,600ms) cubic-bezier(.4,0,.2,1) forwards; }
    .to-light::view-transition-new(root) { z-index: 1; animation: none; }

    @keyframes vt-expand {
      from { clip-path: var(--vt-small); }
      to   { clip-path: var(--vt-big);   }
    }
    @keyframes vt-shrink {
      from { clip-path: var(--vt-big);   }
      to   { clip-path: var(--vt-small); }
    }

    @media (prefers-reduced-motion: reduce) {
      .to-dark::view-transition-new(root),
      .to-light::view-transition-old(root) { animation-duration: 1ms !important; }
    }
  `;
  document.head.appendChild(style);

  /**
   * Get the pixel-perfect center of the SVG icon in VIEWPORT coordinates.
   *
   * The root issue on mobile Chrome/Samsung:
   *   getBoundingClientRect() is relative to the visual viewport,
   *   BUT the fixed overlay we place uses the LAYOUT viewport as its origin.
   *   When the mobile browser's UI bars (address bar, bottom nav) are visible,
   *   visualViewport.offsetTop > 0, meaning the layout viewport is scrolled
   *   relative to the visual viewport — so raw clientRect.top is WRONG
   *   for positioning a position:fixed element.
   *
   * Fix: subtract visualViewport offsets so coordinates are in layout-viewport
   * space, which is what position:fixed / clip-path on the root element uses.
   */
  function getIconCenter() {
    const svg = themeBtn?.querySelector('svg');
    const el  = svg || themeBtn;
    if (!el) return { x: window.innerWidth / 2, y: 40 };

    const rect = el.getBoundingClientRect();

    // Raw center in visual-viewport space
    let cx = rect.left + rect.width  / 2;
    let cy = rect.top  + rect.height / 2;

    // Correct for mobile browser chrome offset (address bar, bottom bar, etc.)
    // visualViewport.offsetTop = how many px the visual viewport is shifted
    // relative to the layout viewport (layout vp is what fixed positioning uses)
    if (window.visualViewport) {
      cx += window.visualViewport.offsetLeft;
      cy += window.visualViewport.offsetTop;
    }

    return { x: Math.round(cx), y: Math.round(cy) };
  }

  /**
   * Max radius from point (x,y) to the farthest corner of the LAYOUT viewport.
   * Use window.innerWidth/Height — these are layout viewport dimensions,
   * consistent with what position:fixed elements use.
   */
  function maxR(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));
  }

  /* ── Apply theme state to DOM ── */
  function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    const iconWrap = themeBtn?.querySelector('.icon-wrap');
    const btnText  = themeBtn?.querySelector('.btn-text');
    if (iconWrap) iconWrap.innerHTML = dark ? SUN_SVG : MOON_SVG;
    if (btnText)  btnText.textContent = dark ? 'Light mode' : 'Dark mode';
  }

  /* ── Main toggle ── */
  async function toggle() {
    if (busy) return;
    busy = true;

    // Read icon center BEFORE any DOM change
    const { x: cx, y: cy } = getIconCenter();
    const r        = maxR(cx, cy);
    const dur      = 600;
    const nextDark = !isDark;

    const small = `circle(0px at ${cx}px ${cy}px)`;
    const big   = `circle(${r}px at ${cx}px ${cy}px)`;

    /* ── View Transition API (Chrome 111+, Safari 18+) ── */
    if (document.startViewTransition) {
      const root = document.documentElement;
      root.style.setProperty('--vt-small', small);
      root.style.setProperty('--vt-big',   big);
      root.style.setProperty('--vt-dur',   dur + 'ms');
      root.classList.add(nextDark ? 'to-dark' : 'to-light');

      document.startViewTransition(() => {
        isDark = nextDark;
        applyTheme(isDark);
      }).finished.finally(() => {
        root.classList.remove('to-dark', 'to-light');
        busy = false;
      });
      return;
    }

    /* ── Fallback: manual overlay for older browsers ── */
    document.body.classList.add('no-tr');

    if (nextDark) {
      // Dark sweeps IN (overlay expands from icon center)
      const ov = document.createElement('div');
      ov.style.cssText = `position:fixed;inset:0;z-index:9999;pointer-events:none;background:#111119;clip-path:${small};will-change:clip-path;`;
      document.body.appendChild(ov);

      isDark = true;
      applyTheme(true);
      document.body.classList.remove('no-tr');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        ov.style.transition = `clip-path ${dur}ms cubic-bezier(.4,0,.2,1)`;
        ov.style.clipPath   = big;
        ov.addEventListener('transitionend', () => { ov.remove(); busy = false; }, { once: true });
      }));

    } else {
      // Light sweeps IN: apply light immediately, dark overlay shrinks back to icon
      isDark = false;
      applyTheme(false);
      document.body.classList.remove('no-tr');

      const ov = document.createElement('div');
      ov.style.cssText = `position:fixed;inset:0;z-index:9999;pointer-events:none;background:#111119;clip-path:${big};will-change:clip-path;`;
      document.body.appendChild(ov);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        ov.style.transition = `clip-path ${dur}ms cubic-bezier(.4,0,.2,1)`;
        ov.style.clipPath   = small;
        ov.addEventListener('transitionend', () => { ov.remove(); busy = false; }, { once: true });
      }));
    }
  }

  if (themeBtn) themeBtn.addEventListener('click', toggle);

  applyTheme(false);
})();
