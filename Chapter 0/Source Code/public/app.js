// Front-End: Multimodal Input (พูด / พิมพ์ / ชี้) → Context Aggregator → /api/turn
// + โหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน): /api/customer/start, /api/customer/turn
// + ตัวช่วย (💡 Assist Bot): /api/assist
// ไม่มีเซิร์ฟเวอร์ (GitHub Pages) → staticApi.js จำลอง /api/* ในเบราว์เซอร์ด้วย Offline engine
const I18N = {
  th: {
    title: 'AI Café', subtitle: 'ฝึกสื่อสารในชีวิตประจำวัน: สั่งเครื่องดื่มกับบาริสต้า AI',
    keyTitle: 'ตั้งค่า Anthropic API key', keyHelp: 'เก็บในหน่วยความจำของเซิร์ฟเวอร์เครื่องนี้เท่านั้น ไม่บันทึกลงไฟล์ (ถาวรให้ใช้ไฟล์ .env) — ปิดเซิร์ฟเวอร์แล้วต้องกรอกใหม่',
    keySave: 'บันทึกและใช้ Claude', keyClear: 'ล้าง key', keyChecking: 'กำลังตรวจสอบ key…', keyOk: 'เชื่อมต่อ Claude แล้ว', keyOff: 'ล้าง key แล้ว กลับไปใช้ Offline',
    talkLang: 'ภาษาสนทนา', talkSame: 'ตามหน้าจอ', talkAuto: '🌐 อัตโนมัติ (ตามที่พูด)',
    mode: 'โหมด', modeFree: 'อิสระ', modeMission: 'ภารกิจ', modeStaff: '🔄 เป็นพนักงาน (สลับบทบาท)',
    noise: 'เสียงในร้าน', quiet: 'เงียบ', medium: 'ปานกลาง', loud: 'ดังมาก', tts: 'บาริสต้าพูดออกเสียง',
    missionTag: '🎯 ภารกิจของคุณ', send: 'ส่ง', placeholder: 'พิมพ์ หรือกด 🎤 เพื่อพูด…',
    staffTag: '🔄 โหมดสลับบทบาท: คุณคือบาริสต้า', staffTitle: 'รับออเดอร์จากลูกค้า AI',
    staffDesc: 'ทักทาย → ถามรายละเอียดให้ครบ (ร้อน/เย็น ความหวาน ไซส์ จำนวน) → ดูแลเรื่องแพ้นมวัว → ทวนออเดอร์ → บอกราคา (ดูราคาจากป้ายเมนู)',
    placeholderStaff: 'พูดหรือพิมพ์ในฐานะบาริสต้า…',
    menuBoard: 'ป้ายเมนู', menuHint: 'แตะเมนูเพื่อ "ชี้" (แตะ ร้อน/เย็น/ปั่น ได้) แล้วพูดหรือพิมพ์เพิ่ม หรือกดส่งเลย',
    menuHintStaff: 'แตะเมนูเพื่อใส่ชื่อเมนูลงช่องพิมพ์ ใช้ราคาบนป้ายคิดยอดเงิน',
    extrasLegend: (s, o, y) => `ราคาเพิ่ม: ไซส์ใหญ่ +${s} · นมโอ๊ต +${o} · นมถั่วเหลือง +${y} บาท`,
    ticket: 'ใบออเดอร์', ticketStaff: '📝 ใบจดออเดอร์ของคุณ', total: 'ยอดรวม', totalStaff: 'ยอดรวม (คุณคำนวณเอง)', unknown: '?',
    allergyTag: '🥛 ลูกค้าแพ้นมวัว', readbackOk: '✓ ทวนแล้ว',
    coach: 'โค้ชประเมิน', coachEmpty: 'เริ่มสั่งเครื่องดื่มได้เลย โค้ชจะให้คำแนะนำทุกเทิร์น',
    coachEmptyStaff: 'ทักทายลูกค้าและรับออเดอร์ได้เลย โค้ชจะประเมินฝั่งพนักงาน',
    debrief: 'สรุปผล', restart: 'เริ่มใหม่', payload: 'ดู JSON payload ที่ส่งเข้า AI', close: 'ปิด', playAgain: 'เล่นอีกครั้ง',
    slot: { item: 'เมนู', temperature: 'ร้อน/เย็น/ปั่น', sweetness: 'ความหวาน', size: 'ไซส์', milk: 'นม', quantity: 'จำนวน' },
    pointing: 'ชี้', speech: 'พูด', text: 'พิมพ์',
    states: { idle: 'รอรับออเดอร์', thinking: 'กำลังคิด…', asking: 'ถามรายละเอียด', looking: 'มองตามมือคุณ', confused: 'งงนิดหน่อย', making: 'กำลังชงให้!', serving: 'เสิร์ฟแล้ว ☕', listening: 'กำลังฟัง…' },
    statesStaff: { idle: 'ลูกค้ารอสั่ง', thinking: 'ลูกค้ากำลังคิด…', asking: 'ลูกค้าตอบ', looking: 'ลูกค้ารอฟัง', confused: 'ลูกค้างง', making: 'จ่ายเงินแล้ว 💵', serving: 'ลูกค้าพอใจ 😊', listening: 'กำลังฟังคุณ…' },
    phrases: ['สวัสดีครับ ยินดีต้อนรับครับ รับอะไรดีครับ?', 'รับร้อน เย็น หรือปั่นดีครับ?', 'ความหวานรับระดับไหนดีครับ?', 'รับไซส์ปกติหรือไซส์ใหญ่ดีครับ?', 'รับกี่แก้วดีครับ?', 'มีอาการแพ้อะไรไหมครับ?', 'รับอะไรเพิ่มไหมครับ?', 'ขอทวนออเดอร์นะครับ ', 'ทั้งหมด … บาทครับ'],
    politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', na: 'ไม่มีคำพูด',
    micUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการพูด ลองใช้ Chrome หรือ Edge', micError: 'ใช้ไมค์ไม่ได้: ',
    listening: 'กำลังฟัง… พูดได้เลย', heard: 'ได้ยินว่า: ', emptySend: 'พูด พิมพ์ หรือแตะเมนูก่อนนะ',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI', engineStaff: '⚙️ ลูกค้า AI (Offline)',
    assistBtn: 'ตัวช่วย', assistTitle: '🤖 ผู้ช่วย AI', assistNow: '🧭 ตอนนี้', assistWords: '📖 คำศัพท์ในประโยคล่าสุด',
    assistSay: '💬 ลองพูดแบบนี้ — แตะเพื่อใส่ในช่องพิมพ์ แล้วกดส่ง (หรือพูดตามเอง)', assistStar: '⭐ = แนะนำ / ตรงกับภารกิจ',
    assistModel: '🎯 ดูประโยคเต็ม (เฉลย)', assistUse: 'ใช้ประโยคนี้', assistPrice: '🧮 วิธีคิดราคา', assistSlow: '🐢 ฟังอีกครั้งแบบช้าๆ',
    assistPolite: 'คำลงท้ายของฉัน', assistClose: 'ปิดตัวช่วย', assistLoading: 'กำลังคิดวิธีช่วย…',
    assistNudge: 'ดูเหมือนตรงนี้จะยากนิดนึง ลองกด 💡 ตัวช่วย ได้เลย', assistAuto: '🤖 ผู้ช่วยมาช่วยแล้ว ลองแตะประโยคด้านล่างดูนะ',
    assistUsed: (n) => `💡 ใช้ตัวช่วย ${n} ครั้ง — ครั้งหน้าลองพูดเองก่อน แล้วค่อยเปิดตัวช่วยเมื่อติดนะ`,
    d: { title: 'สรุปผลการสั่งเครื่องดื่ม', titleStaff: 'สรุปผลการขาย (คุณเป็นบาริสต้า)', overall: 'คะแนนรวม', goal: 'สำเร็จตามเป้าหมาย', goalStaff: 'ออเดอร์ถูกต้อง', efficiency: 'ประสิทธิภาพ', politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', price: 'คิดราคา', safety: 'ความปลอดภัย (แพ้นม)', strengths: 'จุดเด่น', improve: 'สิ่งที่ควรพัฒนา', yourOrder: 'ออเดอร์ของคุณ', customerOrder: 'ออเดอร์จริงของลูกค้า', mission: 'ภารกิจ', none: '—' },
  },
  en: {
    title: 'AI Café', subtitle: 'Everyday communication practice: order a drink from an AI barista',
    keyTitle: 'Anthropic API key', keyHelp: 'Kept in this server\'s memory only, never written to disk (use a .env file to persist it). You will need to re-enter it after the server restarts.',
    keySave: 'Save & use Claude', keyClear: 'Clear key', keyChecking: 'Checking key…', keyOk: 'Connected to Claude', keyOff: 'Key cleared — back to Offline',
    talkLang: 'Talk in', talkSame: 'Same as UI', talkAuto: '🌐 Auto (match customer)',
    mode: 'Mode', modeFree: 'Free play', modeMission: 'Mission', modeStaff: '🔄 Be the barista (role swap)',
    noise: 'Café noise', quiet: 'Quiet', medium: 'Medium', loud: 'Loud', tts: 'Barista speaks aloud',
    missionTag: '🎯 Your mission', send: 'Send', placeholder: 'Type, or press 🎤 to speak…',
    staffTag: '🔄 Role swap: you are the barista', staffTitle: 'Take the order from an AI customer',
    staffDesc: 'Greet → ask for every detail (hot/iced, sweetness, size, quantity) → handle a dairy allergy → read the order back → state the price (see the menu board)',
    placeholderStaff: 'Speak or type as the barista…',
    menuBoard: 'Menu board', menuHint: 'Tap a drink to "point" (tap hot/iced/frappé too), then speak or type — or just send',
    menuHintStaff: 'Tap a drink to insert its name; use the prices to work out the total',
    extrasLegend: (s, o, y) => `Extras: large +${s} · oat milk +${o} · soy milk +${y} baht`,
    ticket: 'Order ticket', ticketStaff: '📝 Your order notes', total: 'Total', totalStaff: 'Total (you calculate it)', unknown: '?',
    allergyTag: '🥛 Customer is allergic to dairy', readbackOk: '✓ Read back',
    coach: 'Coach feedback', coachEmpty: 'Start ordering — the coach will give feedback every turn',
    coachEmptyStaff: 'Greet the customer and take the order — the coach will assess you as staff',
    debrief: 'Debrief', restart: 'Restart', payload: 'Show the JSON payload sent to the AI', close: 'Close', playAgain: 'Play again',
    slot: { item: 'Drink', temperature: 'Hot/iced/frappé', sweetness: 'Sweetness', size: 'Size', milk: 'Milk', quantity: 'Qty' },
    pointing: 'point', speech: 'speech', text: 'text',
    states: { idle: 'Ready to take your order', thinking: 'Thinking…', asking: 'Asking for details', looking: 'Looking where you point', confused: 'A bit confused', making: 'Making your drink!', serving: 'Served ☕', listening: 'Listening…' },
    statesStaff: { idle: 'Customer waiting', thinking: 'Customer thinking…', asking: 'Customer answering', looking: 'Customer listening', confused: 'Customer confused', making: 'Paid 💵', serving: 'Happy customer 😊', listening: 'Listening to you…' },
    phrases: ['Hi, welcome! What can I get for you?', 'Would you like it hot, iced or frappé?', 'How sweet would you like it?', 'Regular or large size?', 'How many would you like?', 'Do you have any allergies?', 'Anything else?', 'Let me read that back: ', "That's … baht, please."],
    politeness: 'Politeness', clarity: 'Clarity', na: 'no words',
    micUnsupported: 'Speech input is not supported in this browser — try Chrome or Edge', micError: 'Microphone error: ',
    listening: 'Listening… go ahead', heard: 'Heard: ', emptySend: 'Speak, type, or tap the menu first',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI', engineStaff: '⚙️ AI customer (offline)',
    assistBtn: 'Help', assistTitle: '🤖 AI helper', assistNow: '🧭 Right now', assistWords: '📖 Words in the last line',
    assistSay: '💬 Try saying — tap to put it in the box, then send (or say it yourself)', assistStar: '⭐ = recommended / matches your mission',
    assistModel: '🎯 Show the full sentence (answer)', assistUse: 'Use this', assistPrice: '🧮 How the price adds up', assistSlow: '🐢 Hear it again slowly',
    assistPolite: 'My polite ending', assistClose: 'Close helper', assistLoading: 'Working out how to help…',
    assistNudge: 'This part looks tricky — try the 💡 Help button', assistAuto: '🤖 Your helper is here — try tapping a sentence below',
    assistUsed: (n) => `💡 Used the helper ${n} time(s) — next time try on your own first, then open it when you're stuck`,
    d: { title: 'Order debrief', titleStaff: 'Sales debrief (you were the barista)', overall: 'Overall', goal: 'Goal completion', goalStaff: 'Order accuracy', efficiency: 'Efficiency', politeness: 'Politeness', clarity: 'Clarity', price: 'Pricing', safety: 'Safety (allergy)', strengths: 'Strengths', improve: 'To improve', yourOrder: 'Your order', customerOrder: "Customer's actual order", mission: 'Mission', none: '—' },
  },
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
const postJson = (path, body) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(async (r) => { const out = await r.json(); if (!r.ok) throw new Error(out.error || r.statusText); return out; });

// ภาษาสนทนากับบาริสต้า (ใช้ได้เต็มที่ในโหมด Claude; โหมด Offline รองรับเฉพาะไทย/อังกฤษ)
// ภาษายอดนิยมขึ้นก่อน ตามด้วยรหัส ISO 639-1 ทั้งหมด (ชื่อภาษาให้เบราว์เซอร์แปลงด้วย Intl.DisplayNames)
const TALK_TOP = ['th-TH', 'en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'it-IT', 'ru-RU', 'ar-SA', 'hi-IN', 'vi-VN', 'id-ID', 'ms-MY', 'tr-TR'];
const ISO639_1 = ('aa ab af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu').split(' ');
const langName = (code) => {
  try { return new Intl.DisplayNames([code], { type: 'language' }).of(code) || code; } catch { return code; }
};
// โหมดพนักงานใช้ engine Offline (ไทย/อังกฤษเท่านั้น) จึงใช้ภาษาตามหน้าจอเสมอ
const talkLocale = () => (staff() || S.talk === 'ui' || S.talk === 'auto' ? (S.lang === 'th' ? 'th-TH' : 'en-US') : S.talk);
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
  cust: null,         // โหมดพนักงาน: สถานะลูกค้า AI (มีออเดอร์ในใจ — ไม่แสดงบนจอ)
  notes: null,        // โหมดพนักงาน: สิ่งที่ลูกค้าบอกแล้ว (ใบจดออเดอร์)
  assistOpen: false,  // ตัวช่วย: เปิดแผงอยู่ไหม
  assists: 0,         // จำนวนครั้งที่ใช้ตัวช่วย (แสดงในหน้าสรุปผล ไม่หักคะแนน)
  struggle: 0,        // จำนวนเทิร์นติดกันที่ผู้เรียนติด
  polite: store.get('cafe.polite', 'ครับ'),
};

const t = () => I18N[S.lang];
const staff = () => S.mode === 'staff';

// ---------------------------------------------------------------- init
async function init() {
  try {
    const r = await fetch('/api/config');
    if (!r.ok) throw new Error(r.statusText);
    CFG = await r.json();
  } catch {
    // โหมด static (เช่น GitHub Pages): ไม่มีเซิร์ฟเวอร์ → จำลอง /api/* ในเบราว์เซอร์ด้วย Offline engine
    (await import('./staticApi.js')).installStaticApi();
    CFG = await fetch('/api/config').then((r) => r.json());
  }
  $('engineBadge').dataset.engine = CFG.engine;
  $('talkSel').innerHTML = talkOptions();
  $('talkSel').value = S.talk;
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
  $('modeSel').addEventListener('change', (e) => { S.mode = e.target.value; applyLang(); restart(); });
  $('noiseSel').addEventListener('change', (e) => { S.noise = e.target.value; });
  $('ttsChk').addEventListener('change', (e) => { S.tts = e.target.checked; if (!S.tts) speechSynthesis?.cancel(); });
  $('sendBtn').addEventListener('click', sendTurn);
  $('textInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) sendTurn(); });
  $('textInput').addEventListener('input', () => { S.fromSpeech = false; });
  $('clearPoint').addEventListener('click', () => setPoint(null));
  $('micBtn').addEventListener('click', toggleMic);
  $('assistBtn').addEventListener('click', () => (S.assistOpen ? closeAssist() : openAssist()));
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
  applyLang();
  $('keyMsg').textContent = key ? t().keyOk : t().keyOff;
  $('keyInput').value = '';
}

function applyLang() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t()[el.dataset.i18n] ?? ''; });
  document.querySelectorAll('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === S.lang));
  $('textInput').placeholder = staff() ? t().placeholderStaff : t().placeholder;
  $('engineBadge').textContent = staff() ? t().engineStaff : CFG.engine === 'claude' ? `🤖 ${t().engineClaude}` : `⚙️ ${t().engineOffline}`;
  $('talkSel').disabled = CFG.engine !== 'claude' || staff();
  $('micBtn').title = SR ? '' : t().micUnsupported;
  $('assistBtn').title = t().assistBtn;
  if (recognizer) recognizer.lang = talkLocale();
  $('talkSel').options[0].textContent = t().talkSame;
  $('talkSel').options[1].textContent = t().talkAuto;
  $('menuHint').textContent = staff() ? t().menuHintStaff : t().menuHint;
  $('ticketTitle').textContent = staff() ? t().ticketStaff : t().ticket;
  $('extrasLegend').hidden = !staff();
  $('extrasLegend').textContent = t().extrasLegend(CFG.sizes.large.extra, CFG.milks.oat.extra, CFG.milks.soy.extra);
  renderPhrases();
  renderMenu();
}

async function restart() {
  speechSynthesis?.cancel();
  S.session = 'usr_' + Math.random().toString(36).slice(2, 8);
  S.order = null;
  S.history = [];
  S.turns = [];
  S.lastTotal = 0;
  S.cust = null;
  S.notes = null;
  S.assists = 0;
  S.struggle = 0;
  closeAssist();
  $('assistBtn').classList.remove('pulse');
  setPoint(null);
  $('chat').innerHTML = '';
  $('textInput').value = '';
  $('hint').textContent = '';
  $('coachBody').innerHTML = `<p class="muted">${esc(staff() ? t().coachEmptyStaff : t().coachEmpty)}</p>`;
  S.mission = S.mode === 'mission' ? CFG.missions[Math.floor(Math.random() * CFG.missions.length)] : null;
  renderMission();
  setBarista('idle');
  if (staff()) {
    // ลูกค้า AI เปิดบทสนทนาก่อน (บอกเมนู + อาจบอกตัวเลือก/อาการแพ้บางส่วน)
    try {
      const r = await postJson('/api/customer/start', { language: S.lang });
      S.cust = r.customer_state;
      S.notes = r.notes_view;
      $('baristaFace').textContent = r.customer_emoji || '🧑';
      addMsg('barista', r.customer_reply);
      S.history.push({ role: 'customer', content: r.customer_reply });
    } catch (err) {
      $('hint').textContent = '⚠️ ' + err.message;
    }
  } else {
    $('baristaFace').textContent = '🧑‍🍳';
    const opening = CFG.opening[S.lang];
    addMsg('barista', opening);
    S.history.push({ role: 'barista', content: opening });
  }
  renderTicket();
  updatePayloadView(staff() ? staffPayload('', '') : buildPayload('', '', null));
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
    // โหมดพนักงาน: แสดงราคาเพิ่มของ เย็น/ปั่น เพื่อให้คิดเงินได้ (แตะการ์ด = ใส่ชื่อเมนูในช่องพิมพ์)
    const temps = staff()
      ? `<div class="extras">${m.temps.map((k) => `${esc(CFG.temps[k][S.lang])}${CFG.temps[k].extra ? ` +${CFG.temps[k].extra}` : ''}`).join(' · ')}</div>`
      : `<div class="temps">${m.temps.map((k) =>
        `<button data-temp="${k}" class="${S.point?.id === m.id && S.point?.temp === k ? 'picked' : ''}">${esc(CFG.temps[k][S.lang])}</button>`).join('')}</div>`;
    card.innerHTML = `
      <div class="emoji">${m.emoji}</div>
      <div class="name">${esc(m[S.lang])}</div>
      <div class="alt">${esc(m[S.lang === 'th' ? 'en' : 'th'])}</div>
      <div class="price">${m.price}฿</div>
      ${temps}`;
    card.addEventListener('click', (e) => {
      if (staff()) { insertText(m[S.lang]); return; }
      const temp = e.target.closest('button')?.dataset.temp || null;
      setPoint({ id: m.id, temp });
    });
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (staff()) insertText(m[S.lang]); else setPoint({ id: m.id, temp: null });
    });
    el.appendChild(card);
  }
}

function insertText(s) {
  const input = $('textInput');
  input.value = (input.value ? `${input.value.trimEnd()} ` : '') + s + ' ';
  S.fromSpeech = false;
  input.focus();
}

// โหมดพนักงาน: ประโยคสำเร็จรูป
function renderPhrases() {
  $('phrases').hidden = !staff();
  const pol = (p) => (S.lang === 'th' && S.polite === 'ค่ะ' ? p.replace(/ครับ\?/g, 'คะ?').replace(/ครับ/g, 'ค่ะ') : p);
  $('phrases').innerHTML = staff() ? t().phrases.map((p) => `<button>${esc(pol(p))}</button>`).join('') : '';
  $('phrases').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => insertText(b.textContent)));
}

function pointLabel(p) {
  if (!p) return '';
  const temp = p.temp ? CFG.temps[p.temp][S.lang] : '';
  return S.lang === 'th' ? drinkName(p.id) + temp : `${temp} ${drinkName(p.id)}`.trim();
}

function setPoint(p) {
  S.point = staff() ? null : p;
  $('staged').hidden = !S.point;
  $('stagedText').textContent = S.point ? `👉 ${t().pointing}: ${pointLabel(S.point)}` : '';
  if (CFG) renderMenu();
  if (S.point) setBarista('looking');
}

function renderMission() {
  const show = !!S.mission || staff();
  $('missionCard').hidden = !show;
  if (!show) return;
  if (staff()) {
    $('missionTag').textContent = t().staffTag;
    $('missionTitle').textContent = t().staffTitle;
    $('missionDesc').textContent = t().staffDesc;
    return;
  }
  const tg = S.mission.target;
  const o = [drinkName(tg.item), CFG.temps[tg.temperature][S.lang], CFG.sweetness[tg.sweetness][S.lang], CFG.sizes[tg.size][S.lang]];
  if (tg.milk) o.push(CFG.milks[tg.milk][S.lang]);
  o.push(S.lang === 'th' ? `${tg.quantity} แก้ว` : `× ${tg.quantity}`);
  $('missionTag').textContent = t().missionTag;
  $('missionTitle').textContent = S.mission[S.lang];
  $('missionDesc').textContent = o.join(' · ');
}

function renderTicket() {
  if (staff()) return renderStaffNotes();
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
  $('ticketTags').innerHTML = '';
  $('totalLabel').textContent = t().total;
  $('total').textContent = `${S.lastTotal || 0} ฿`;
  document.querySelector('.ticket').classList.toggle('done', !!o.is_complete);
}

// โหมดพนักงาน: ใบจดสิ่งที่ลูกค้าบอกแล้ว ("?" = ยังไม่รู้ ต้องถาม)
function renderStaffNotes() {
  const n = S.notes || { rows: [], allergy: false, phase: 'ordering' };
  $('slots').innerHTML = n.rows.map((r) =>
    `<li class="${r.value ? 'filled' : 'empty'}"><span class="k">${esc(r.label)}</span><span class="v">${esc(r.value || t().unknown)}</span></li>`).join('');
  $('ticketTags').innerHTML = [
    ...(n.allergy ? [`<span class="tag alg">${esc(t().allergyTag)}</span>`] : []),
    ...(n.readback_ok ? [`<span class="tag ok">${esc(t().readbackOk)}</span>`] : []),
  ].join('');
  $('totalLabel').textContent = t().totalStaff;
  $('total').textContent = S.lastTotal ? `${S.lastTotal} ฿` : '? ฿';
  document.querySelector('.ticket').classList.toggle('done', n.phase === 'done');
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
  $('stateLabel').textContent = (staff() ? t().statesStaff[state] : null) || t().states[state] || '';
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

function staffPayload(speech, text) {
  return {
    session_id: S.session, scenario: 'cafe_counter', language: S.lang, mode: 'staff',
    current_turn: { user_speech: speech, user_text: text },
    dialogue_history: S.history.slice(-12),
    customer_state: S.cust,
  };
}

// ซ่อนออเดอร์ในใจลูกค้าในหน้าจอ JSON (ไม่ให้เฉลย)
function updatePayloadView(p) {
  const shown = p.customer_state ? { ...p, customer_state: { ...p.customer_state, target: '🔒 hidden', profile: '🔒 hidden' } } : p;
  $('payloadView').textContent = JSON.stringify(shown, null, 2);
}

async function sendTurn() {
  if (S.busy) return;
  const raw = $('textInput').value.trim();
  const point = staff() ? null : S.point;
  if (!raw && !point) { $('hint').textContent = t().emptySend; return; }
  if (staff() && !S.cust) return;
  if (recognizing) recognizer.stop();

  const speech = S.fromSpeech ? raw : '';
  const text = S.fromSpeech ? '' : raw;
  const payload = staff() ? staffPayload(speech, text) : buildPayload(speech, text, point);
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
    const r = await postJson(staff() ? '/api/customer/turn' : '/api/turn', payload);
    await new Promise((ok) => setTimeout(ok, 350)); // จังหวะให้ดูเป็นธรรมชาติ
    typing.remove();
    if (staff()) {
      S.history.push({ role: 'staff', content: userLine }, { role: 'customer', content: r.customer_reply });
      S.cust = r.customer_state;
      S.notes = r.notes_view;
      S.lastTotal = r.total_price;
      S.turns.push({ channels: { speech: !!speech, text: !!text }, coach: r.coach });
      addMsg('barista', r.customer_reply);
    } else {
      S.history.push({ role: 'user', content: userLine }, { role: 'barista', content: r.barista_reply });
      S.order = r.order_state;
      S.lastTotal = r.total_price;
      S.turns.push({ channels: { speech: !!speech, text: !!text, point: !!point }, coach: r.coach });
      addMsg('barista', r.barista_reply);
    }
    setBarista(r.action_state);
    renderTicket();
    renderCoach(r.coach);
    if (r.engine && r.engine.includes('fallback')) $('hint').textContent = '⚠️ ' + r.engine;
    const finished = staff() ? r.customer_state.phase === 'done' : r.order_state.is_complete;
    trackStruggle(r, finished);
    if (finished) {
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

// ---------------------------------------------------------------- ตัวช่วย (Assist Bot)
// เปิดเองด้วยปุ่ม 💡 หรือเปิดให้อัตโนมัติเมื่อผู้เรียนติดหลายเทิร์นติดกัน
function openAssist(auto = false) {
  S.assists += 1;
  S.assistOpen = true;
  $('assistBtn').classList.remove('pulse');
  $('assistBtn').classList.add('on');
  $('assistBox').hidden = false;
  $('assistBox').innerHTML = `<p class="muted">${esc(t().assistLoading)}</p>`;
  loadAssist(auto);
}

function closeAssist() {
  S.assistOpen = false;
  $('assistBtn').classList.remove('on');
  $('assistBox').hidden = true;
  $('assistBox').innerHTML = '';
}

async function loadAssist(auto = false) {
  const body = staff()
    ? { mode: 'staff', language: S.lang, polite: S.polite, customer_state: S.cust, dialogue_history: S.history }
    : { language: S.lang, polite: S.polite, order_state: S.order, dialogue_history: S.history, mission_id: S.mission?.id || null };
  try {
    const a = await postJson('/api/assist', body);
    if (S.assistOpen) renderAssist(a, auto);
  } catch (err) {
    $('assistBox').innerHTML = `<p class="muted">⚠️ ${esc(err.message)}</p>`;
  }
}

function renderAssist(a, auto) {
  const L = t();
  const politeSeg = S.lang === 'th'
    ? `<span class="polite-seg" title="${esc(L.assistPolite)}">${['ครับ', 'ค่ะ'].map((p) => `<button data-polite="${p}" class="${S.polite === p ? 'on' : ''}">${p}</button>`).join('')}</span>`
    : '';
  const words = a.glossary?.length
    ? `<h4>${esc(L.assistWords)}</h4><ul class="gloss">${a.glossary.map((g) =>
      `<li><strong>${esc(g.term)}</strong> <span class="other">${esc(g.other)}</span>${g.meaning ? ` — ${esc(g.meaning)}` : ''}</li>`).join('')}</ul>`
    : '';
  const chips = a.suggestions?.length
    ? `<h4>${esc(L.assistSay)}</h4><div class="say">${a.suggestions.map((x, i) =>
      `<span class="say-chip ${x.star ? 'star' : ''}"><button class="use" data-i="${i}">${x.star ? '⭐ ' : ''}${x.label ? `<em>${esc(x.label)}:</em> ` : ''}${esc(x.text)}</button><button class="hear" data-i="${i}" aria-label="🔊">🔊</button></span>`).join('')}</div>
      ${a.suggestions.some((x) => x.star) ? `<p class="muted small">${esc(L.assistStar)}</p>` : ''}`
    : '';
  const price = a.price?.length ? `<h4>${esc(L.assistPrice)}</h4><div class="price-calc">${a.price.map((l) => `<div>${esc(l)}</div>`).join('')}</div>` : '';
  const model = a.model
    ? `<details class="model"><summary>${esc(L.assistModel)}</summary><div><span>${esc(a.model)}</span> <button class="use-model">${esc(L.assistUse)}</button></div></details>`
    : '';
  $('assistBox').innerHTML = `
    <div class="assist-head"><strong>${esc(L.assistTitle)}</strong>${politeSeg}<button class="x" aria-label="${esc(L.assistClose)}" title="${esc(L.assistClose)}">✕</button></div>
    ${auto ? `<p class="auto">${esc(L.assistAuto)}</p>` : ''}
    <p class="now"><span>${esc(L.assistNow)}:</span> ${esc(a.situation)}</p>
    ${(a.warnings || []).map((w) => `<p class="warn">${esc(w)}</p>`).join('')}
    ${words}${chips}${price}${model}
    ${a.last_line ? `<button class="slow">${esc(L.assistSlow)}</button>` : ''}`;

  const box = $('assistBox');
  const fill = (text) => { $('textInput').value = text; S.fromSpeech = false; $('textInput').focus(); };
  box.querySelector('.x').addEventListener('click', closeAssist);
  box.querySelectorAll('.use').forEach((b) => b.addEventListener('click', () => fill(a.suggestions[b.dataset.i].text)));
  box.querySelectorAll('.hear').forEach((b) => b.addEventListener('click', () => speak(a.suggestions[b.dataset.i].text, true, 0.85)));
  box.querySelector('.use-model')?.addEventListener('click', () => fill(a.model));
  box.querySelector('.slow')?.addEventListener('click', () => speak(a.last_line, true, 0.7));
  box.querySelectorAll('[data-polite]').forEach((b) => b.addEventListener('click', () => {
    S.polite = b.dataset.polite; store.set('cafe.polite', S.polite); renderPhrases(); loadAssist();
  }));
}

// ผู้เรียนติด (โค้ชให้ "ต้องปรับปรุง" หรือ AI งง) 2 เทิร์นติด → ปุ่มกะพริบ, 3 เทิร์นติด → เปิดตัวช่วยให้เลย
function trackStruggle(r, finished) {
  const stuck = r.coach?.rating === 'improve' || r.action_state === 'confused';
  S.struggle = stuck && !finished ? S.struggle + 1 : 0;
  if (S.assistOpen) { if (!finished) loadAssist(); return; }
  if (S.struggle >= 3) { S.struggle = 0; openAssist(true); } else if (S.struggle >= 2) {
    $('assistBtn').classList.add('pulse');
    $('hint').textContent = t().assistNudge;
  }
}

// ---------------------------------------------------------------- debrief
async function showDebrief() {
  const body = staff()
    ? { mode: 'staff', language: S.lang, turns: S.turns, customer_state: S.cust }
    : { language: S.lang, turns: S.turns, order_state: S.order, mission_id: S.mission?.id || null };
  if (staff() && !S.cust) return;
  let d;
  try { d = await postJson('/api/debrief', body); } catch (err) { $('hint').textContent = '⚠️ ' + err.message; return; }
  const L = t().d;
  const bar = (label, v, note) => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span>${v}</span></div>${note ? `<div class="note">${esc(note)}</div>` : ''}`;
  const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${L.none}</p>`);
  const head = `<h3>${esc(staff() ? L.titleStaff : L.title)}</h3>
    <div class="score-big"><span class="num">${d.overall}</span><span class="stars">${'★'.repeat(d.stars)}${'☆'.repeat(3 - d.stars)}</span></div>`;
  const tail = `<h4>✅ ${esc(L.strengths)}</h4>${list(d.strengths)}
    <h4>🎯 ${esc(L.improve)}</h4>${list(d.improvements)}`;
  $('debriefBody').innerHTML = staff()
    ? `${head}
      <div><strong>${esc(L.customerOrder)}:</strong> ${esc(d.order_summary)}</div>
      ${bar(L.goalStaff, d.scores.goal, d.notes.goal)}
      ${bar(L.efficiency, d.scores.efficiency, d.notes.efficiency)}
      ${bar(L.price, d.scores.price, d.notes.price)}
      ${bar(L.politeness, d.scores.politeness)}
      ${d.scores.safety != null ? bar(L.safety, d.scores.safety, d.notes.safety) : ''}
      ${tail}`
    : `${head}
      <div><strong>${esc(L.yourOrder)}:</strong> ${esc(d.order_summary)}${d.mission_summary ? `<br><strong>${esc(L.mission)}:</strong> ${esc(d.mission_summary)}` : ''}</div>
      ${bar(L.goal, d.scores.goal, d.notes.goal)}
      ${bar(L.efficiency, d.scores.efficiency, d.notes.efficiency)}
      ${bar(L.politeness, d.scores.politeness)}
      ${bar(L.clarity, d.scores.clarity, d.notes.channels)}
      ${tail}`;
  // ใช้ตัวช่วยกี่ครั้ง (บอกไว้เฉยๆ ไม่หักคะแนน)
  if (S.assists) $('debriefBody').insertAdjacentHTML('beforeend', `<p class="assist-used">${esc(t().assistUsed(S.assists))}</p>`);
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

// rate < 1 = พูดช้า (ปุ่ม 🐢 ฟังอีกครั้งแบบช้าๆ / 🔊 ในตัวช่วย)
function speak(text, force = false, rate = 1.05) {
  if ((!S.tts && !force) || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, '').replace(/\(.*?\)/g, ''));
  u.lang = talkLocale();
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = rate;
  speechSynthesis.speak(u);
}

init();
