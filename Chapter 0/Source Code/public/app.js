// Front-End: Multimodal Input (พูด / พิมพ์ / ชี้) → Context Aggregator → /api/turn
const I18N = {
  th: {
    title: 'AI Café', subtitle: 'ฝึกสื่อสารในชีวิตประจำวัน: สั่งเครื่องดื่มกับบาริสต้า AI',
    keyTitle: 'ตั้งค่า Anthropic API key', keyHelp: 'เก็บในหน่วยความจำของเซิร์ฟเวอร์เครื่องนี้เท่านั้น ไม่บันทึกลงไฟล์ (ถาวรให้ใช้ไฟล์ .env) — ปิดเซิร์ฟเวอร์แล้วต้องกรอกใหม่',
    keySave: 'บันทึกและใช้ Claude', keyClear: 'ล้าง key', keyChecking: 'กำลังตรวจสอบ key…', keyOk: 'เชื่อมต่อ Claude แล้ว', keyOff: 'ล้าง key แล้ว กลับไปใช้ Offline',
    talkLang: 'ภาษาสนทนา', talkSame: 'ตามหน้าจอ', talkAuto: '🌐 อัตโนมัติ (ตามที่พูด)',
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
    keyTitle: 'Anthropic API key', keyHelp: 'Kept in this server\'s memory only, never written to disk (use a .env file to persist it). You will need to re-enter it after the server restarts.',
    keySave: 'Save & use Claude', keyClear: 'Clear key', keyChecking: 'Checking key…', keyOk: 'Connected to Claude', keyOff: 'Key cleared — back to Offline',
    talkLang: 'Talk in', talkSame: 'Same as UI', talkAuto: '🌐 Auto (match customer)',
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

// ภาษาสนทนากับบาริสต้า (ใช้ได้เต็มที่ในโหมด Claude; โหมด Offline รองรับเฉพาะไทย/อังกฤษ)
// ภาษายอดนิยมขึ้นก่อน ตามด้วยรหัส ISO 639-1 ทั้งหมด (ชื่อภาษาให้เบราว์เซอร์แปลงด้วย Intl.DisplayNames)
const TALK_TOP = ['th-TH', 'en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'it-IT', 'ru-RU', 'ar-SA', 'hi-IN', 'vi-VN', 'id-ID', 'ms-MY', 'tr-TR'];
const ISO639_1 = ('aa ab af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu').split(' ');
const langName = (code) => {
  try { return new Intl.DisplayNames([code], { type: 'language' }).of(code) || code; } catch { return code; }
};
const talkLocale = () => (S.talk === 'ui' || S.talk === 'auto' ? (S.lang === 'th' ? 'th-TH' : 'en-US') : S.talk);
function talkOptions() {
  const top = new Set(TALK_TOP.map((c) => c.split('-')[0]));
  const opt = (c, n) => `<option value="${c}">${esc(n)}</option>`;
  const rest = ISO639_1.filter((c) => !top.has(c)).map((c) => [c, langName(c)]).sort((x, y) => x[1].localeCompare(y[1]));
  return opt('ui', '') + opt('auto', '') + TALK_TOP.map((c) => opt(c, langName(c))).join('')
    + `<option disabled>──────────</option>` + rest.map(([c, n]) => opt(c, `${n} (${c})`)).join('');
}

let CFG = null;
const S = {
  lang: store.get('cafe.lang', 'th'),
  talk: store.get('cafe.talk', 'ui'),
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
// โหมด static (เช่น GitHub Pages): ไม่มีเซิร์ฟเวอร์ ให้รัน Offline engine ในเบราว์เซอร์แทน
let STATIC = null; // { processTurn, buildDebrief } เมื่ออยู่โหมด static
async function loadStatic() {
  const [menu, rule, deb] = await Promise.all([import('./src/menu.js'), import('./src/ruleEngine.js'), import('./src/debrief.js')]);
  STATIC = { processTurn: rule.processTurn, buildDebrief: deb.buildDebrief };
  return {
    engine: 'offline', can_set_key: false,
    menu: menu.MENU.map(({ keywords, ...m }) => m),
    temps: menu.TEMPS, sweetness: menu.SWEETNESS, sizes: menu.SIZES, milks: menu.MILKS, missions: menu.MISSIONS,
    opening: { th: rule.openingLine('th'), en: rule.openingLine('en') },
  };
}

async function init() {
  try {
    const r = await fetch('/api/config');
    if (!r.ok) throw new Error(r.statusText);
    CFG = await r.json();
  } catch {
    CFG = await loadStatic();
  }
  $('engineBadge').dataset.engine = CFG.engine;
  $('talkSel').innerHTML = talkOptions();
  $('talkSel').value = S.talk;
  $('talkSel').disabled = CFG.engine !== 'claude';
  $('keyBtn').hidden = !CFG.can_set_key;
  bindUi();
  applyLang();
  restart();
}

function bindUi() {
  document.querySelectorAll('#langSeg button').forEach((b) =>
    b.addEventListener('click', () => { S.lang = b.dataset.lang; store.set('cafe.lang', S.lang); applyLang(); restart(); }));
  $('talkSel').addEventListener('change', (e) => { S.talk = e.target.value; store.set('cafe.talk', S.talk); applyLang(); });
  $('keyBtn').addEventListener('click', () => { $('keyMsg').textContent = ''; $('keyInput').value = ''; $('keyDlg').showModal(); });
  $('keyCancel').addEventListener('click', () => $('keyDlg').close());
  $('keyForm').addEventListener('submit', (e) => { e.preventDefault(); setKey($('keyInput').value); });
  $('keyClear').addEventListener('click', () => setKey(null));
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

async function setKey(key) {
  $('keyMsg').textContent = t().keyChecking;
  const r = await fetch('/api/key', {
    method: key ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: key ? JSON.stringify({ key }) : undefined,
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) { $('keyMsg').textContent = out.error || `HTTP ${r.status}`; return; }
  CFG.engine = out.engine;
  $('talkSel').disabled = CFG.engine !== 'claude';
  applyLang();
  $('keyMsg').textContent = key ? t().keyOk : t().keyOff;
  $('keyInput').value = '';
}

function applyLang() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t()[el.dataset.i18n] ?? ''; });
  document.querySelectorAll('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === S.lang));
  $('textInput').placeholder = t().placeholder;
  $('engineBadge').textContent = CFG.engine === 'claude' ? `🤖 ${t().engineClaude}` : `⚙️ ${t().engineOffline}`;
  $('micBtn').title = SR ? '' : t().micUnsupported;
  if (recognizer) recognizer.lang = talkLocale();
  $('talkSel').options[0].textContent = t().talkSame;
  $('talkSel').options[1].textContent = t().talkAuto;
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
    conversation_language: S.talk === 'ui' ? null : S.talk,
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
    let r;
    if (STATIC) {
      r = STATIC.processTurn(payload);
    } else {
      const res = await fetch('/api/turn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      r = await res.json();
      if (!res.ok) throw new Error(r.error || res.statusText);
    }
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
  const debriefIn = { language: S.lang, turns: S.turns, order_state: S.order, mission_id: S.mission?.id || null };
  const d = STATIC ? STATIC.buildDebrief(debriefIn) : await fetch('/api/debrief', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debriefIn),
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
  recognizer.lang = talkLocale();
  try { recognizer.start(); } catch (err) { $('hint').textContent = t().micError + err.message; }
}

function speak(text, force = false) {
  if ((!S.tts && !force) || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[☕🔊]/g, ''));
  u.lang = talkLocale();
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = 1.05;
  speechSynthesis.speak(u);
}

init();
