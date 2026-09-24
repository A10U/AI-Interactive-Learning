// Front-End: Multimodal Input (พูด / พิมพ์ / ชี้) → Context Aggregator → /api/turn
const I18N = {
  th: {
    title: 'AI Café', subtitle: 'ฝึกสื่อสารในชีวิตประจำวัน: สั่งเครื่องดื่มกับบาริสต้า AI',
    mode: 'โหมด', modeFree: 'อิสระ', modeMission: 'ภารกิจ',
    noise: 'เสียงในร้าน', quiet: 'เงียบ', medium: 'ปานกลาง', loud: 'ดังมาก', tts: 'บาริสต้าพูดออกเสียง',
    missionTag: '🎯 ภารกิจของคุณ', send: 'ส่ง', placeholder: 'พิมพ์ หรือกด 🎤 เพื่อพูด…',
    menuBoard: 'ป้ายเมนู', menuHint: 'แตะเมนูเพื่อ "ชี้" (แตะ ร้อน/เย็น/ปั่น ได้) แล้วพูดหรือพิมพ์เพิ่ม หรือกดส่งเลย',
    ticket: 'ใบออเดอร์', total: 'ยอดรวม', coach: 'โค้ชประเมิน', coachEmpty: 'เริ่มสั่งเครื่องดื่มได้เลย โค้ชจะให้คำแนะนำทุกเทิร์น',
    debrief: 'สรุปผล', restart: 'เริ่มใหม่', payload: 'ดู JSON payload ที่ส่งเข้า AI', close: 'ปิด', playAgain: 'เล่นอีกครั้ง',
    slot: { item: 'เมนู', temperature: 'ร้อน/เย็น/ปั่น', sweetness: 'ความหวาน', size: 'ไซส์', milk: 'นม', quantity: 'จำนวน' },
    pointing: 'ชี้', speech: 'พูด', text: 'พิมพ์',
    states: { idle: 'รอรับออเดอร์', thinking: 'กำลังคิด…', asking: 'ถามรายละเอียด', looking: 'มองตามมือคุณ', confused: 'งงนิดหน่อย', making: 'กำลังชงให้!', serving: 'เสิร์ฟแล้ว ☕', listening: 'กำลังฟัง…' },
    politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', na: 'ไม่มีคำพูด',
    micUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการพูด ลองใช้ Chrome หรือ Edge', micError: 'ใช้ไมค์ไม่ได้: ',
    listening: 'กำลังฟัง… พูดได้เลย', heard: 'ได้ยินว่า: ', emptySend: 'พูด พิมพ์ หรือแตะเมนูก่อนนะ',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI',
    d: { title: 'สรุปผลการสั่งเครื่องดื่ม', overall: 'คะแนนรวม', goal: 'สำเร็จตามเป้าหมาย', efficiency: 'ประสิทธิภาพ', politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', strengths: 'จุดเด่น', improve: 'สิ่งที่ควรพัฒนา', yourOrder: 'ออเดอร์ของคุณ', mission: 'ภารกิจ', none: '—' },
  },
  en: {
    title: 'AI Café', subtitle: 'Everyday communication practice: order a drink from an AI barista',
    mode: 'Mode', modeFree: 'Free play', modeMission: 'Mission',
    noise: 'Café noise', quiet: 'Quiet', medium: 'Medium', loud: 'Loud', tts: 'Barista speaks aloud',
    missionTag: '🎯 Your mission', send: 'Send', placeholder: 'Type, or press 🎤 to speak…',
    menuBoard: 'Menu board', menuHint: 'Tap a drink to "point" (tap hot/iced/frappé too), then speak or type — or just send',
    ticket: 'Order ticket', total: 'Total', coach: 'Coach feedback', coachEmpty: 'Start ordering — the coach will give feedback every turn',
    debrief: 'Debrief', restart: 'Restart', payload: 'Show the JSON payload sent to the AI', close: 'Close', playAgain: 'Play again',
    slot: { item: 'Drink', temperature: 'Hot/iced/frappé', sweetness: 'Sweetness', size: 'Size', milk: 'Milk', quantity: 'Qty' },
    pointing: 'point', speech: 'speech', text: 'text',
    states: { idle: 'Ready to take your order', thinking: 'Thinking…', asking: 'Asking for details', looking: 'Looking where you point', confused: 'A bit confused', making: 'Making your drink!', serving: 'Served ☕', listening: 'Listening…' },
    politeness: 'Politeness', clarity: 'Clarity', na: 'no words',
    micUnsupported: 'Speech input is not supported in this browser — try Chrome or Edge', micError: 'Microphone error: ',
    listening: 'Listening… go ahead', heard: 'Heard: ', emptySend: 'Speak, type, or tap the menu first',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI',
    d: { title: 'Order debrief', overall: 'Overall', goal: 'Goal completion', efficiency: 'Efficiency', politeness: 'Politeness', clarity: 'Clarity', strengths: 'Strengths', improve: 'To improve', yourOrder: 'Your order', mission: 'Mission', none: '—' },
  },
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

let CFG = null;
const S = {
  lang: store.get('cafe.lang', 'th'),
  mode: 'free',
  noise: 'quiet',
  tts: true,
  session: null,
  order: null,
  history: [],
  turns: [],
  point: null,        // { id, temp }
  fromSpeech: false,  // ข้อความในช่องมาจากไมค์หรือไม่
  mission: null,
  busy: false,
};

const t = () => I18N[S.lang];

// ---------------------------------------------------------------- init
async function init() {
  CFG = await fetch('/api/config').then((r) => r.json());
  $('engineBadge').dataset.engine = CFG.engine;
  bindUi();
  applyLang();
  restart();
}

function bindUi() {
  document.querySelectorAll('#langSeg button').forEach((b) =>
    b.addEventListener('click', () => { S.lang = b.dataset.lang; store.set('cafe.lang', S.lang); applyLang(); restart(); }));
  $('modeSel').addEventListener('change', (e) => { S.mode = e.target.value; restart(); });
  $('noiseSel').addEventListener('change', (e) => { S.noise = e.target.value; });
  $('ttsChk').addEventListener('change', (e) => { S.tts = e.target.checked; if (!S.tts) speechSynthesis?.cancel(); });
  $('sendBtn').addEventListener('click', sendTurn);
  $('textInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) sendTurn(); });
  $('textInput').addEventListener('input', () => { S.fromSpeech = false; });
  $('clearPoint').addEventListener('click', () => setPoint(null));
  $('micBtn').addEventListener('click', toggleMic);
  $('restartBtn').addEventListener('click', restart);
  $('debriefBtn').addEventListener('click', showDebrief);
  $('dlgClose').addEventListener('click', () => $('debriefDlg').close());
  $('dlgRestart').addEventListener('click', () => { $('debriefDlg').close(); restart(); });
}

function applyLang() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t()[el.dataset.i18n] ?? ''; });
  document.querySelectorAll('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === S.lang));
  $('textInput').placeholder = t().placeholder;
  $('engineBadge').textContent = CFG.engine === 'claude' ? `🤖 ${t().engineClaude}` : `⚙️ ${t().engineOffline}`;
  $('micBtn').title = SR ? '' : t().micUnsupported;
  if (recognizer) recognizer.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  renderMenu();
}

function restart() {
  speechSynthesis?.cancel();
  S.session = 'usr_' + Math.random().toString(36).slice(2, 8);
  S.order = null;
  S.history = [];
  S.turns = [];
  setPoint(null);
  $('chat').innerHTML = '';
  $('textInput').value = '';
  $('coachBody').innerHTML = `<p class="muted">${esc(t().coachEmpty)}</p>`;
  S.mission = S.mode === 'mission' ? CFG.missions[Math.floor(Math.random() * CFG.missions.length)] : null;
  renderMission();
  renderTicket();
  setBarista('idle');
  const opening = CFG.opening[S.lang];
  addMsg('barista', opening);
  S.history.push({ role: 'barista', content: opening });
  updatePayloadView(buildPayload('', '', null));
}

// ---------------------------------------------------------------- rendering
function drinkName(id) {
  const m = CFG.menu.find((x) => x.id === id);
  return m ? m[S.lang] : id;
}

function renderMenu() {
  const el = $('menu');
  el.innerHTML = '';
  for (const m of CFG.menu) {
    const card = document.createElement('div');
    card.className = 'card' + (S.point?.id === m.id ? ' picked' : '');
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="emoji">${m.emoji}</div>
      <div class="name">${esc(m[S.lang])}</div>
      <div class="alt">${esc(m[S.lang === 'th' ? 'en' : 'th'])}</div>
      <div class="price">${m.price}฿</div>
      <div class="temps">${m.temps.map((k) =>
        `<button data-temp="${k}" class="${S.point?.id === m.id && S.point?.temp === k ? 'picked' : ''}">${esc(CFG.temps[k][S.lang])}</button>`).join('')}</div>`;
    card.addEventListener('click', (e) => {
      const temp = e.target.closest('button')?.dataset.temp || null;
      setPoint({ id: m.id, temp });
    });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPoint({ id: m.id, temp: null }); } });
    el.appendChild(card);
  }
}

function pointLabel(p) {
  if (!p) return '';
  const temp = p.temp ? CFG.temps[p.temp][S.lang] : '';
  return S.lang === 'th' ? drinkName(p.id) + temp : `${temp} ${drinkName(p.id)}`.trim();
}

function setPoint(p) {
  S.point = p;
  $('staged').hidden = !p;
  $('stagedText').textContent = p ? `👉 ${t().pointing}: ${pointLabel(p)}` : '';
  if (CFG) renderMenu();
  if (p) setBarista('looking');
}

function renderMission() {
  $('missionCard').hidden = !S.mission;
  if (!S.mission) return;
  const tg = S.mission.target;
  const o = [drinkName(tg.item), CFG.temps[tg.temperature][S.lang], CFG.sweetness[tg.sweetness][S.lang], CFG.sizes[tg.size][S.lang]];
  if (tg.milk) o.push(CFG.milks[tg.milk][S.lang]);
  o.push(S.lang === 'th' ? `${tg.quantity} แก้ว` : `× ${tg.quantity}`);
  $('missionTitle').textContent = S.mission[S.lang];
  $('missionDesc').textContent = o.join(' · ');
}

function renderTicket() {
  const o = S.order || {};
  const val = {
    item: o.item && drinkName(o.item),
    temperature: o.temperature && CFG.temps[o.temperature][S.lang],
    sweetness: o.sweetness && CFG.sweetness[o.sweetness][S.lang],
    size: o.size && CFG.sizes[o.size][S.lang],
    milk: o.milk ? CFG.milks[o.milk][S.lang] : (o.allergy ? '?' : null),
    quantity: o.item ? String(o.quantity || 1) : null,
  };
  const keys = ['item', 'temperature', 'sweetness', 'size', ...(o.allergy || o.milk ? ['milk'] : []), 'quantity'];
  $('slots').innerHTML = keys.map((k) =>
    `<li class="${val[k] && val[k] !== '?' ? 'filled' : 'empty'}"><span class="k">${esc(t().slot[k])}</span><span class="v">${esc(val[k] || '—')}</span></li>`).join('');
  $('total').textContent = `${S.lastTotal || 0} ฿`;
  document.querySelector('.ticket').classList.toggle('done', !!o.is_complete);
}

function renderCoach(c) {
  const bar = (label, v) => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${v ?? 0}%"></div></div><span>${v ?? '–'}</span></div>`;
  $('coachBody').innerHTML = `
    <span class="rating ${esc(c.rating)}">${esc(c.label)}</span>
    <ul>${(c.notes || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    ${c.tip ? `<div class="tip">💡 ${esc(c.tip)}</div>` : ''}
    ${c.politeness == null ? `<div class="bar"><span>${esc(t().politeness)}</span><span class="muted">${esc(t().na)}</span><span></span></div>` : bar(t().politeness, c.politeness)}
    ${bar(t().clarity, c.clarity)}`;
}

function setBarista(state) {
  $('barista').dataset.state = state;
  $('stateLabel').textContent = t().states[state] || '';
}

function addMsg(role, text, meta = []) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = esc(text)
    + (role === 'barista' ? `<button class="speak" title="🔊" aria-label="speak">🔊</button>` : '')
    + (meta.length ? `<div class="meta">${meta.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>` : '');
  div.querySelector('.speak')?.addEventListener('click', () => speak(text, true));
  $('chat').appendChild(div);
  $('chat').scrollTop = $('chat').scrollHeight;
  if (role === 'barista') speak(text);
  return div;
}

// ---------------------------------------------------------------- context aggregator
function buildPayload(speech, text, point) {
  return {
    session_id: S.session,
    scenario: 'cafe_counter',
    language: S.lang,
    environment_factors: { noise_level: S.noise, queue_status: 'normal' },
    current_turn: {
      user_speech: speech,
      user_text: text,
      user_action: point
        ? { type: 'point', target_id: point.temp ? `${point.temp}_${point.id}` : point.id, target_label: pointLabel(point) }
        : null,
    },
    dialogue_history: S.history.slice(-12),
    order_state: S.order,
  };
}

function updatePayloadView(p) {
  $('payloadView').textContent = JSON.stringify(p, null, 2);
}

async function sendTurn() {
  if (S.busy) return;
  const raw = $('textInput').value.trim();
  if (!raw && !S.point) { $('hint').textContent = t().emptySend; return; }
  if (recognizing) recognizer.stop();

  const speech = S.fromSpeech ? raw : '';
  const text = S.fromSpeech ? '' : raw;
  const point = S.point;
  const payload = buildPayload(speech, text, point);
  updatePayloadView(payload);

  const meta = [];
  if (speech) meta.push(`🎤 ${t().speech}`);
  if (text) meta.push(`⌨️ ${t().text}`);
  if (point) meta.push(`👉 ${pointLabel(point)}`);
  addMsg('user', raw || `(${t().pointing}: ${pointLabel(point)})`, meta);
  const userLine = [raw, point ? `[${t().pointing}: ${pointLabel(point)}]` : ''].filter(Boolean).join(' ');

  $('textInput').value = '';
  S.fromSpeech = false;
  setPoint(null);
  $('hint').textContent = '';
  S.busy = true;
  $('sendBtn').disabled = true;
  setBarista('thinking');
  const typing = document.createElement('div');
  typing.className = 'msg barista typing';
  typing.textContent = '…';
  $('chat').appendChild(typing);

  try {
    const res = await fetch('/api/turn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const r = await res.json();
    if (!res.ok) throw new Error(r.error || res.statusText);
    await new Promise((ok) => setTimeout(ok, 350)); // จังหวะให้ดูเป็นธรรมชาติ
    typing.remove();
    S.history.push({ role: 'user', content: userLine }, { role: 'barista', content: r.barista_reply });
    S.order = r.order_state;
    S.lastTotal = r.total_price;
    S.turns.push({ channels: { speech: !!speech, text: !!text, point: !!point }, coach: r.coach });
    addMsg('barista', r.barista_reply);
    setBarista(r.action_state);
    renderTicket();
    renderCoach(r.coach);
    if (r.engine && r.engine.includes('fallback')) $('hint').textContent = '⚠️ ' + r.engine;
    if (r.order_state.is_complete) {
      setTimeout(() => setBarista('serving'), 2200);
      setTimeout(showDebrief, 3400);
    }
  } catch (err) {
    typing.remove();
    $('hint').textContent = '⚠️ ' + err.message;
    setBarista('confused');
  } finally {
    S.busy = false;
    $('sendBtn').disabled = false;
  }
}

// ---------------------------------------------------------------- debrief
async function showDebrief() {
  const d = await fetch('/api/debrief', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: S.lang, turns: S.turns, order_state: S.order, mission_id: S.mission?.id || null }),
  }).then((r) => r.json());
  const L = t().d;
  const bar = (label, v, note) => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span>${v}</span></div>${note ? `<div class="note">${esc(note)}</div>` : ''}`;
  const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${L.none}</p>`);
  $('debriefBody').innerHTML = `
    <h3>${esc(L.title)}</h3>
    <div class="score-big"><span class="num">${d.overall}</span><span class="stars">${'★'.repeat(d.stars)}${'☆'.repeat(3 - d.stars)}</span></div>
    <div><strong>${esc(L.yourOrder)}:</strong> ${esc(d.order_summary)}${d.mission_summary ? `<br><strong>${esc(L.mission)}:</strong> ${esc(d.mission_summary)}` : ''}</div>
    ${bar(L.goal, d.scores.goal, d.notes.goal)}
    ${bar(L.efficiency, d.scores.efficiency, d.notes.efficiency)}
    ${bar(L.politeness, d.scores.politeness)}
    ${bar(L.clarity, d.scores.clarity, d.notes.channels)}
    <h4>✅ ${esc(L.strengths)}</h4>${list(d.strengths)}
    <h4>🎯 ${esc(L.improve)}</h4>${list(d.improvements)}`;
  if (!$('debriefDlg').open) $('debriefDlg').showModal();
}

// ---------------------------------------------------------------- voice (Web Speech API)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let recognizing = false;
if (SR) {
  recognizer = new SR();
  recognizer.interimResults = true;
  recognizer.continuous = false;
  recognizer.onstart = () => { recognizing = true; $('micBtn').classList.add('rec'); $('hint').textContent = t().listening; setBarista('listening'); };
  recognizer.onend = () => {
    recognizing = false; $('micBtn').classList.remove('rec');
    if ($('barista').dataset.state === 'listening') setBarista('idle');
  };
  recognizer.onerror = (e) => { $('hint').textContent = t().micError + e.error; };
  recognizer.onresult = (e) => {
    const text = Array.from(e.results).map((r) => r[0].transcript).join('');
    $('textInput').value = text;
    S.fromSpeech = true;
    $('hint').textContent = t().heard + text;
    if (e.results[e.results.length - 1].isFinal) setTimeout(sendTurn, 500);
  };
}

function toggleMic() {
  if (!SR) { $('hint').textContent = t().micUnsupported; return; }
  if (recognizing) { recognizer.stop(); return; }
  speechSynthesis?.cancel();
  recognizer.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  try { recognizer.start(); } catch (err) { $('hint').textContent = t().micError + err.message; }
}

function speak(text, force = false) {
  if ((!S.tts && !force) || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[☕🔊]/g, ''));
  u.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = 1.05;
  speechSynthesis.speak(u);
}

init();
