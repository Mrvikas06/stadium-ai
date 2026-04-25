import { askGemini } from './services/gemini.js';

let i18nDict = {};
let activeLang = localStorage.getItem('stadium_lang') || 'en';

function t(key, fallback = '') {
  return i18nDict[key] || fallback || key;
}

async function loadLanguage(lang) {
  try {
    const res = await fetch(`./lang/${lang}.json`);
    if (!res.ok) throw new Error('Language file missing');
    i18nDict = await res.json();
    activeLang = lang;
    localStorage.setItem('stadium_lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (i18nDict[key]) el.textContent = i18nDict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (i18nDict[key]) el.setAttribute('placeholder', i18nDict[key]);
    });

    const welcome = document.getElementById('assistant-welcome');
    if (welcome) {
      welcome.textContent = t(
        'assistant.welcome',
        'Welcome. I can help with directions, queue times, food options, accessibility, and lost & found information.'
      );
    }
  } catch (err) {
    console.warn('Language load error:', err.message);
  }
}

function saveGeminiKey() {
  const keyInput = document.getElementById('gemini-api-key');
  const key = keyInput.value.trim();
  if (!key) return;
  localStorage.setItem('gemini_api_key', key);
  keyInput.value = '';
  keyInput.placeholder = t('assistant.keySaved', 'API key saved');
}

function resizeHeatmapCanvas() {
  const canvas = document.getElementById('heatmap');
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const displayWidth = Math.max(280, Math.floor(rect.width));
  const ratio = window.innerWidth <= 640 ? 0.82 : 0.5;
  const displayHeight = Math.max(220, Math.floor(displayWidth * ratio));

  canvas.style.height = `${displayHeight}px`;
  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function densityColor(d) {
  if (d < 0.4) return 'rgb(0,255,136)';
  if (d < 0.7) return 'rgb(255,204,0)';
  return 'rgb(255,68,68)';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawHeatmap() {
  const canvas = document.getElementById('heatmap');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width / Math.max(1, window.devicePixelRatio || 1);
  const H = canvas.height / Math.max(1, window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#f2f5fa';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  ctx.fillStyle = 'rgba(76,120,76,0.35)';
  roundRect(ctx, cx - 60, cy - 120, 120, 240, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(31,41,55,0.28)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - 60, cy - 120, 120, 240, 8);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(31,41,55,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, W * 0.46, H * 0.44, 0, 0, Math.PI * 2);
  ctx.stroke();

  const zoneRadius = Math.max(24, Math.min(55, Math.round(Math.min(W, H) * 0.13)));
  const cornerRadius = Math.max(20, Math.min(40, Math.round(Math.min(W, H) * 0.1)));
  const zones = [
    { x: cx, y: cy - H * 0.38, r: zoneRadius, density: 0.95, label: 'N' },
    { x: cx, y: cy + H * 0.38, r: zoneRadius, density: 0.68, label: 'S' },
    { x: cx - W * 0.42, y: cy, r: zoneRadius - 4, density: 0.44, label: 'E' },
    { x: cx + W * 0.42, y: cy, r: zoneRadius - 4, density: 0.62, label: 'W' },
    { x: cx - W * 0.28, y: cy - H * 0.28, r: cornerRadius, density: 0.75, label: 'NE' },
    { x: cx + W * 0.28, y: cy - H * 0.28, r: cornerRadius, density: 0.82, label: 'NW' },
    { x: cx - W * 0.28, y: cy + H * 0.28, r: cornerRadius, density: 0.55, label: 'SE' },
    { x: cx + W * 0.28, y: cy + H * 0.28, r: cornerRadius, density: 0.38, label: 'SW' }
  ];

  zones.forEach((z) => {
    const grd = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
    const col = densityColor(z.density);
    grd.addColorStop(0, col.replace(')', ',0.65)').replace('rgb', 'rgba'));
    grd.addColorStop(1, col.replace(')', ',0)').replace('rgb', 'rgba'));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = window.innerWidth <= 640 ? 'bold 10px DM Sans' : 'bold 11px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText(`${z.label} ${Math.round(z.density * 100)}%`, z.x, z.y + 4);
  });

  const gates = [
    { x: cx, y: 16, label: 'Gate 1', busy: true },
    { x: cx + W * 0.48, y: cy, label: 'Gate 2' },
    { x: cx, y: H - 16, label: 'Gate 3' },
    { x: cx - W * 0.48, y: cy, label: 'Gate 4', clear: true }
  ];

  gates.forEach((g) => {
    ctx.beginPath();
    ctx.arc(g.x, g.y, window.innerWidth <= 640 ? 8 : 10, 0, Math.PI * 2);
    ctx.fillStyle = g.busy ? '#ff4444' : g.clear ? '#00ff88' : '#00c8ff';
    ctx.fill();
    ctx.fillStyle = '#1f2937';
    ctx.font = window.innerWidth <= 640 ? '8px DM Sans' : '9px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText(g.label, g.x, g.y + (g.y < 20 ? 20 : -12));
  });
}

function jitter(base, range) {
  return (base + (Math.random() - 0.5) * range).toFixed(1);
}

function planRoute() {
  const from = document.getElementById('from-loc').value || 'Gate 4 (North Entrance)';
  const to = document.getElementById('to-seat').value || 'your seat';
  const avoid = document.getElementById('avoid-crowds').checked;
  const result = document.getElementById('route-result');

  const routes = [
    'Take <b>Corridor C (East Wing)</b> — currently 38% density',
    'Pass <b>Restroom Block 2</b> on your right (2 min queue)',
    'Follow <b>green signage</b> to Section E → escalator to upper tier',
    'Your seat is <b>approx. 4 min walk</b> from Gate 4'
  ];
  if (avoid) {
    routes.unshift('Avoiding Gate 1 (14 min wait) — using <b>Gate 4</b> instead');
  }

  result.style.display = 'block';
  result.innerHTML = `<div style="margin-bottom:0.5rem;font-weight:600;color:var(--accent)">Route: ${from} → ${to}</div>`
    + routes.map((r, i) => `<div class="route-step"><div class="step-num">${i + 1}</div><div>${r}</div></div>`).join('')
    + '<div style="margin-top:0.6rem;font-size:0.78rem;color:var(--muted)">Estimated time: 4 min &nbsp;|&nbsp; Distance: 0.3 km &nbsp;|&nbsp; Low crowd route</div>';
}

function showSection(evt, s) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');
  if (s === 'assistant') document.getElementById('section-assistant').scrollIntoView({ behavior: 'smooth' });
  if (s === 'navigation') document.getElementById('section-navigation').scrollIntoView({ behavior: 'smooth' });
  if (s === 'dashboard') window.scrollTo({ top: 0, behavior: 'smooth' });
}

function quickAsk(q) {
  document.getElementById('chat-input').value = q;
  sendChat();
}

function quickAskByKey(key) {
  const defaults = {
    'assistant.quickPrompt.shortestQueue': 'Shortest food queue right now?',
    'assistant.quickPrompt.bestExit': 'Which gate has least crowd to exit?',
    'assistant.quickPrompt.firstAid': 'Where is the first aid station?',
    'assistant.quickPrompt.parking': 'Is there parking available? Which zone is closest?'
  };
  quickAsk(t(key, defaults[key] || ''));
}

async function sendChat() {
  const inp = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send-btn');
  const box = document.getElementById('chat-box');
  const msg = inp.value.trim();
  if (!msg) return;

  inp.value = '';
  btn.disabled = true;

  const venueContext = `You are StadiumAI, an intelligent assistant for a large cricket stadium hosting 68,420 attendees today.
Current live data:
- North Stand: 97% capacity (HIGH - avoid)
- South Stand: 72%, East Stand: 45% (LOW), West Stand: 68%
- Food Court A: 18 min queue (HIGH), Food Court B: 4 min queue (BEST OPTION)
- Restroom Block 1: 9 min, Restroom Block 2: 2 min (BEST OPTION)
- Gate 1: 14 min queue (congested), Gate 4 North: 1 min (BEST EXIT)
- Innings break in 8 minutes
- First Aid: Section D2 near Gate 3
- Parking Zone C: 40% available (best)
- Bar & Beverages: 7 min queue, Merchandise: 6 min queue
Always give specific, actionable advice. Be concise and professional. Prioritize safety and efficiency.`;

  const uBubble = document.createElement('div');
  uBubble.className = 'msg user';
  uBubble.textContent = msg;
  box.appendChild(uBubble);

  const typing = document.createElement('div');
  typing.className = 'msg bot typing';
  typing.textContent = t('assistant.typing', '...');
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;

  try {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      throw new Error(t('assistant.noKey', 'Gemini API key missing. Save key first.'));
    }

    const reply = await askGemini({
      apiKey,
      systemPrompt: venueContext,
      userPrompt: msg,
      languageCode: activeLang
    });

    typing.remove();
    const bBubble = document.createElement('div');
    bBubble.className = 'msg bot';
    bBubble.innerHTML = (reply || t('assistant.retry', 'Sorry, I could not get a response. Please try again.')).replace(/\n/g, '<br>');
    box.appendChild(bBubble);
  } catch (e) {
    typing.remove();
    const err = document.createElement('div');
    err.className = 'msg bot';
    err.textContent = e.message || t('assistant.unavailable', 'Service unavailable. Please check connectivity and try again.');
    box.appendChild(err);
  }

  box.scrollTop = box.scrollHeight;
  btn.disabled = false;
  inp.focus();
}

function init() {
  resizeHeatmapCanvas();
  drawHeatmap();

  setInterval(drawHeatmap, 5000);
  setInterval(() => {
    const waitEl = document.getElementById('stat-wait');
    const queriesEl = document.getElementById('stat-queries');
    if (waitEl) waitEl.textContent = `${jitter(4.2, 1.5)} min`;
    if (queriesEl) queriesEl.textContent = (1247 + Math.floor(Math.random() * 5)).toLocaleString();
  }, 8000);

  let heatmapResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(heatmapResizeTimer);
    heatmapResizeTimer = setTimeout(() => {
      resizeHeatmapCanvas();
      drawHeatmap();
    }, 120);
  });

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = activeLang;
    langSelect.addEventListener('change', (e) => loadLanguage(e.target.value));
  }

  loadLanguage(activeLang);

  window.planRoute = planRoute;
  window.showSection = showSection;
  window.sendChat = sendChat;
  window.quickAsk = quickAsk;
  window.quickAskByKey = quickAskByKey;
  window.saveGeminiKey = saveGeminiKey;
}

init();
