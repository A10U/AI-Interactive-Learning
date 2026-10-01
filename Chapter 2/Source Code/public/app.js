// Front-End (Chapter 2): Multimodal Input (พูด / พิมพ์ / ชี้ / ติ๊กตัวเลือก / การ์ด AAC) → Context Aggregator → /api/turn
// + โหมดสลับบทบาท: ผู้เรียนเป็นพนักงาน, AI เป็นลูกค้า → /api/customer/*
const I18N = {
  th: {
    title: 'Specialty Ordering — บทที่ 2', subtitle: 'ฝึกสั่ง/ขาย: เบเกอรี · อาหารนานาชาติ · น้ำผลไม้ & มัทฉะ · ค็อกเทล & ม็อกเทล',
    mode: 'โหมด', modeFree: 'อิสระ', modeMission: 'ภารกิจ', modeStaff: '🔄 เป็นพนักงาน (สลับบทบาท)',
    noise: 'เสียงในร้าน', quiet: 'เงียบ', medium: 'ปานกลาง', loud: 'ดังมาก', tts: 'อ่านออกเสียง',
    missionTag: '🎯 ภารกิจของคุณ', staffTag: '🔄 โหมดสลับบทบาท: คุณคือพนักงาน', staffTitle: (s) => `รับออเดอร์ในฐานะ${s}`,
    staffDesc: 'ทักทาย → ถามรายละเอียดให้ครบ → ดูแลเรื่องแพ้อาหาร/ตรวจบัตร → ทวนออเดอร์ → บอกราคา (ดูราคาจากป้ายเมนู)',
    youAllergic: 'คุณแพ้: ', youAge: (a) => `🪪 อายุของคุณ: ${a} ปี`, youDrive: '🚗 คุณต้องขับรถกลับบ้าน', focus: 'จุดเน้นของสถานการณ์: ',
    send: 'ส่ง', placeholder: 'พิมพ์ หรือกด 🎤 เพื่อพูด…', placeholderStaff: 'พูดหรือพิมพ์ในฐานะพนักงาน…', clear: 'ล้าง',
    menuBoard: 'ป้ายเมนู',
    menuHint: 'แตะเมนูเพื่อ "ชี้" แล้วเลือกตัวเลือกย่อยด้านล่าง หรือพูด/พิมพ์รายละเอียด',
    menuHintStaff: 'แตะเมนูเพื่อใส่ชื่อเมนูลงช่องพิมพ์ ใช้ราคาบนป้ายคิดยอดเงิน',
    customize: 'ตัวเลือกย่อย (Modifiers)', customEmpty: 'แตะเมนูบนป้ายเพื่อดูตัวเลือกย่อย',
    customFor: 'ตัวเลือกสำหรับ', modTypes: { exclude: 'ไม่ใส่', request: 'คำขอพิเศษ', addon: 'เพิ่มเติม' },
    aacTitle: '🗂️ การ์ดสื่อสาร (AAC)', aacHint: 'แตะการ์ดเพื่อสื่อสารโดยไม่ต้องพูด แล้วกดส่ง', aacLabel: (x) => `ฉันแพ้${x}`, aacId: 'แสดงบัตรประชาชน',
    ticket: 'ใบออเดอร์', ticketStaff: '📝 ใบจดออเดอร์ของคุณ', total: 'ยอดรวม', totalStaff: 'ยอดรวม (คุณคำนวณเอง)', coach: 'โค้ชประเมิน',
    coachEmpty: 'เริ่มสั่งได้เลย โค้ชจะให้คำแนะนำทุกเทิร์น', coachEmptyStaff: 'ทักทายลูกค้าและรับออเดอร์ได้เลย โค้ชจะประเมินฝั่งพนักงาน',
    phase: { ordering: '📝 กำลังสั่ง', confirming: '🔁 รอยืนยันออเดอร์', complete: '✅ ยืนยันแล้ว', done: '✅ ขายสำเร็จ' },
    prep: (m) => `⏱️ ประมาณ ${m} นาที`, unknown: '?',
    idVerified: (a) => `🪪 ยืนยันอายุแล้ว (${a} ปี)`, idRefused: '🚫 อายุไม่ถึง 20 ปี', idSeen: (a) => `🪪 บัตรระบุอายุ ${a} ปี`,
    alcohol: { always: '🔞 มีแอลกอฮอล์', optional: '🍸/🚫 เลือกได้' },
    debrief: 'สรุปผล', restart: 'เริ่มใหม่', payload: 'ดู JSON payload ที่ส่งเข้า AI', close: 'ปิด', playAgain: 'เล่นอีกครั้ง',
    item: 'เมนู', qty: 'จำนวน', allergy: 'แพ้', you: 'คุณ',
    pointing: 'ชี้', speech: 'พูด', text: 'พิมพ์', select: 'เลือก',
    states: { idle: 'รอรับออเดอร์', thinking: 'กำลังคิด…', asking: 'ถามรายละเอียด', looking: 'มองตามมือคุณ', confused: 'งงนิดหน่อย', warning: 'ขอเตือนนะ!', confirming: 'ทวนออเดอร์', making: 'กำลังเตรียมให้!', serving: 'เสิร์ฟแล้ว 🎉', listening: 'กำลังฟัง…' },
    statesStaff: { idle: 'ลูกค้ารอสั่ง', thinking: 'ลูกค้ากำลังคิด…', asking: 'ลูกค้าตอบ', looking: 'ลูกค้ารอฟัง', confused: 'ลูกค้างง', making: 'จ่ายเงินแล้ว 💵', serving: 'ลูกค้าพอใจ 😊', listening: 'กำลังฟังคุณ…' },
    phrases: ['สวัสดีครับ ยินดีต้อนรับครับ รับอะไรดีครับ?', 'รับอะไรเพิ่มไหมครับ?', 'มีอาการแพ้อาหารไหมครับ?', 'ขออนุญาตดูบัตรประชาชนหน่อยครับ', 'ขอทวนออเดอร์นะครับ ', 'ทั้งหมด … บาทครับ'],
    politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', na: 'ไม่มีคำพูด',
    micUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการพูด ลองใช้ Chrome หรือ Edge', micError: 'ใช้ไมค์ไม่ได้: ',
    listening: 'กำลังฟัง… พูดได้เลย', heard: 'ได้ยินว่า: ', emptySend: 'พูด พิมพ์ แตะเมนู หรือเลือกตัวเลือกก่อนนะ',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI', engineStaff: '⚙️ ลูกค้า AI (Offline)',
    assistBtn: 'ตัวช่วย', assistTitle: '🤖 ผู้ช่วย AI', assistNow: '🧭 ตอนนี้', assistWords: '📖 คำศัพท์ในประโยคล่าสุด',
    assistSay: '💬 ลองพูดแบบนี้ — แตะเพื่อใส่ในช่องพิมพ์ แล้วกดส่ง (หรือพูดตามเอง)', assistStar: '⭐ = แนะนำ / ตรงกับภารกิจ',
    assistModel: '🎯 ดูประโยคเต็ม (เฉลย)', assistUse: 'ใช้ประโยคนี้', assistPrice: '🧮 วิธีคิดราคา', assistSlow: '🐢 ฟังอีกครั้งแบบช้าๆ',
    assistPolite: 'คำลงท้ายของฉัน', assistClose: 'ปิดตัวช่วย', assistLoading: 'กำลังคิดวิธีช่วย…',
    assistNudge: 'ดูเหมือนตรงนี้จะยากนิดนึง ลองกด 💡 ตัวช่วย ได้เลย', assistAuto: '🤖 ผู้ช่วยมาช่วยแล้ว ลองแตะประโยคด้านล่างดูนะ',
    assistUsed: (n) => `💡 ใช้ตัวช่วย ${n} ครั้ง — ครั้งหน้าลองพูดเองก่อน แล้วค่อยเปิดตัวช่วยเมื่อติดนะ`,
    d: { title: 'สรุปผลการสั่ง', titleStaff: 'สรุปผลการขาย (คุณเป็นพนักงาน)', overall: 'คะแนนรวม', goal: 'สำเร็จตามเป้าหมาย', goalStaff: 'ออเดอร์ถูกต้อง', efficiency: 'ประสิทธิภาพ', politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', price: 'คิดราคา', safety: 'ความปลอดภัย/รับผิดชอบ', strengths: 'จุดเด่น', improve: 'สิ่งที่ควรพัฒนา', yourOrder: 'ออเดอร์ของคุณ', customerOrder: 'ออเดอร์จริงของลูกค้า', mission: 'ภารกิจ', checks: 'ตรวจตามภารกิจ', none: '—' },
  },
  en: {
    title: 'Specialty Ordering — Chapter 2', subtitle: 'Order & serve: bakery · international food · juice & matcha · cocktails & mocktails',
    mode: 'Mode', modeFree: 'Free play', modeMission: 'Mission', modeStaff: '🔄 Be the staff (role swap)',
    noise: 'Noise', quiet: 'Quiet', medium: 'Medium', loud: 'Loud', tts: 'Read aloud',
    missionTag: '🎯 Your mission', staffTag: '🔄 Role swap: you are the staff', staffTitle: (s) => `Take the order as the ${s.toLowerCase()}`,
    staffDesc: 'Greet → ask for every detail → handle allergies / check ID → read the order back → state the price (see the menu board)',
    youAllergic: 'You are allergic to: ', youAge: (a) => `🪪 Your age: ${a}`, youDrive: "🚗 You're driving home", focus: 'Scenario focus: ',
    send: 'Send', placeholder: 'Type, or press 🎤 to speak…', placeholderStaff: 'Speak or type as the staff member…', clear: 'Clear',
    menuBoard: 'Menu board',
    menuHint: 'Tap an item to "point", then tick modifiers below or speak/type the details',
    menuHintStaff: 'Tap an item to insert its name; use the prices to work out the total',
    customize: 'Modifiers', customEmpty: 'Tap an item on the menu board to see its options',
    customFor: 'Options for', modTypes: { exclude: 'Leave out', request: 'Special requests', addon: 'Extras' },
    aacTitle: '🗂️ Communication cards (AAC)', aacHint: 'Tap a card to communicate without speaking, then send', aacLabel: (x) => `I'm allergic to ${x}`, aacId: 'Show my ID',
    ticket: 'Order ticket', ticketStaff: '📝 Your order notes', total: 'Total', totalStaff: 'Total (you calculate it)', coach: 'Coach feedback',
    coachEmpty: 'Start ordering — the coach will give feedback every turn', coachEmptyStaff: 'Greet the customer and take the order — the coach will assess you as staff',
    phase: { ordering: '📝 Ordering', confirming: '🔁 Waiting for confirmation', complete: '✅ Confirmed', done: '✅ Sale complete' },
    prep: (m) => `⏱️ about ${m} min`, unknown: '?',
    idVerified: (a) => `🪪 ID checked (${a})`, idRefused: '🚫 Under 20', idSeen: (a) => `🪪 ID shows age ${a}`,
    alcohol: { always: '🔞 Alcoholic', optional: '🍸/🚫 Either' },
    debrief: 'Debrief', restart: 'Restart', payload: 'Show the JSON payload sent to the AI', close: 'Close', playAgain: 'Play again',
    item: 'Item', qty: 'Qty', allergy: 'Allergy', you: 'You',
    pointing: 'point', speech: 'speech', text: 'text', select: 'select',
    states: { idle: 'Ready to take your order', thinking: 'Thinking…', asking: 'Asking for details', looking: 'Looking where you point', confused: 'A bit confused', warning: 'Heads up!', confirming: 'Reading it back', making: 'Preparing your order!', serving: 'Served 🎉', listening: 'Listening…' },
    statesStaff: { idle: 'Customer waiting', thinking: 'Customer thinking…', asking: 'Customer answering', looking: 'Customer listening', confused: 'Customer confused', making: 'Paid 💵', serving: 'Happy customer 😊', listening: 'Listening to you…' },
    phrases: ['Hi, welcome! What can I get for you?', 'Anything else?', 'Do you have any allergies?', 'May I see your ID, please?', 'Let me read that back: ', "That's … baht, please."],
    politeness: 'Politeness', clarity: 'Clarity', na: 'no words',
    micUnsupported: 'Speech input is not supported in this browser — try Chrome or Edge', micError: 'Microphone error: ',
    listening: 'Listening… go ahead', heard: 'Heard: ', emptySend: 'Speak, type, tap the menu or tick an option first',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI', engineStaff: '⚙️ AI customer (offline)',
    assistBtn: 'Help', assistTitle: '🤖 AI helper', assistNow: '🧭 Right now', assistWords: '📖 Words in the last line',
    assistSay: '💬 Try saying — tap to put it in the box, then send (or say it yourself)', assistStar: '⭐ = recommended / matches your mission',
    assistModel: '🎯 Show the full sentence (answer)', assistUse: 'Use this', assistPrice: '🧮 How the price adds up', assistSlow: '🐢 Hear it again slowly',
    assistPolite: 'My polite ending', assistClose: 'Close helper', assistLoading: 'Working out how to help…',
    assistNudge: 'This part looks tricky — try the 💡 Help button', assistAuto: '🤖 Your helper is here — try tapping a sentence below',
    assistUsed: (n) => `💡 Used the helper ${n} time(s) — next time try on your own first, then open it when you're stuck`,
    d: { title: 'Order debrief', titleStaff: 'Sales debrief (you were the staff)', overall: 'Overall', goal: 'Goal completion', goalStaff: 'Order accuracy', efficiency: 'Efficiency', politeness: 'Politeness', clarity: 'Clarity', price: 'Pricing', safety: 'Safety / responsibility', strengths: 'Strengths', improve: 'To improve', yourOrder: 'Your order', customerOrder: "Customer's actual order", mission: 'Mission', checks: 'Mission checklist', none: '—' },
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
  lang: store.get('ch2.lang', 'th'),
  scId: store.get('ch2.scenario', 'bakery'),
  mode: 'free',
  noise: 'quiet',
  tts: true,
  session: null,
  order: null,
  history: [],
  turns: [],
  point: null,                                                        // { id, opt: { group, value } | null }
  sel: { options: {}, modifiers: null, allergies: new Set(), showId: false }, // สิ่งที่ติ๊กไว้ รอส่งในเทิร์นถัดไป
  fromSpeech: false,
  mission: null,
  lastTotal: 0,
  prep: null,
  cust: null,          // โหมดพนักงาน: สถานะลูกค้า (ออเดอร์ในใจลูกค้าเก็บไว้ที่นี่ — ไม่แสดงบนจอ)
  notes: null,         // โหมดพนักงาน: สิ่งที่ลูกค้าบอกแล้ว
  busy: false,
  assistOpen: false,  // ตัวช่วย: เปิดแผงอยู่ไหม
  assists: 0,         // จำนวนครั้งที่ใช้ตัวช่วย (แสดงในหน้าสรุปผล)
  struggle: 0,        // จำนวนเทิร์นติดกันที่ผู้เรียนติด → เสนอตัวช่วยอัตโนมัติ
  polite: store.get('ch2.polite', 'ครับ'),
};

const t = () => I18N[S.lang];
const staff = () => S.mode === 'staff';
const sc = () => CFG.scenarios.find((x) => x.id === S.scId) || CFG.scenarios[0];
const menuItem = (id) => sc().menu.find((m) => m.id === id);
const valName = (g, v) => CFG.groups[g]?.values[v]?.[S.lang] ?? v;
const valExtra = (m, g, v) => m?.extras?.[g]?.[v] ?? CFG.groups[g]?.values[v]?.extra ?? 0;
const modName = (m) => sc().modifiers[m]?.[S.lang] ?? m;
const algName = (a) => CFG.allergens[a]?.[S.lang] ?? a;

// ---------------------------------------------------------------- init
// โหลด config จากเซิร์ฟเวอร์ ถ้าไม่มีเซิร์ฟเวอร์ (เช่น GitHub Pages) ให้จำลอง /api/* ในเบราว์เซอร์ด้วย Offline engine
async function loadConfig() {
  try {
    const r = await fetch('/api/config');
    if (r.ok) return await r.json();
  } catch { /* ไม่มีเซิร์ฟเวอร์ */ }
  (await import('./staticApi.js')).installStaticApi();
  return fetch('/api/config').then((r) => r.json());
}

async function init() {
  CFG = await loadConfig();
  if (!CFG.scenarios.some((x) => x.id === S.scId)) S.scId = CFG.scenarios[0].id;
  bindUi();
  applyLang();
  restart();
}

function bindUi() {
  document.querySelectorAll('#langSeg button').forEach((b) =>
    b.addEventListener('click', () => { S.lang = b.dataset.lang; store.set('ch2.lang', S.lang); applyLang(); restart(); }));
  $('modeSel').addEventListener('change', (e) => { S.mode = e.target.value; applyLang(); restart(); });
  $('noiseSel').addEventListener('change', (e) => { S.noise = e.target.value; });
  $('ttsChk').addEventListener('change', (e) => { S.tts = e.target.checked; if (!S.tts) window.speechSynthesis?.cancel(); });
  $('sendBtn').addEventListener('click', sendTurn);
  $('textInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) sendTurn(); });
  $('textInput').addEventListener('input', () => { S.fromSpeech = false; });
  $('clearStaged').addEventListener('click', () => { clearStaged(); renderAll(); });
  $('micBtn').addEventListener('click', toggleMic);
  $('assistBtn').addEventListener('click', () => (S.assistOpen ? closeAssist() : openAssist()));
  $('restartBtn').addEventListener('click', restart);
  $('debriefBtn').addEventListener('click', showDebrief);
  $('dlgClose').addEventListener('click', () => $('debriefDlg').close());
  $('dlgRestart').addEventListener('click', () => { $('debriefDlg').close(); restart(); });
}

function applyLang() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t()[el.dataset.i18n] ?? ''; });
  document.querySelectorAll('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === S.lang));
  $('textInput').placeholder = staff() ? t().placeholderStaff : t().placeholder;
  $('engineBadge').textContent = staff() ? t().engineStaff : CFG.engine === 'claude' ? `🤖 ${t().engineClaude}` : `⚙️ ${t().engineOffline}`;
  $('micBtn').title = SR ? '' : t().micUnsupported;
  if (recognizer) recognizer.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  renderTabs();
}

function renderTabs() {
  $('scTabs').innerHTML = CFG.scenarios.map((x) =>
    `<button role="tab" data-sc="${x.id}" class="${x.id === S.scId ? 'on' : ''}" aria-selected="${x.id === S.scId}">
      <span>${x.icon}</span><span>${esc(x[S.lang])}</span><span class="code">${x.code}</span></button>`).join('');
  $('scTabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    S.scId = b.dataset.sc; store.set('ch2.scenario', S.scId); renderTabs(); restart();
  }));
}

async function restart() {
  window.speechSynthesis?.cancel();
  S.session = 'usr_' + Math.random().toString(36).slice(2, 8);
  S.order = null;
  S.history = [];
  S.turns = [];
  S.lastTotal = 0;
  S.prep = null;
  S.cust = null;
  S.notes = null;
  S.assists = 0;
  S.struggle = 0;
  closeAssist();
  $('assistBtn').classList.remove('pulse');
  clearStaged();
  $('chat').innerHTML = '';
  $('textInput').value = '';
  $('hint').textContent = '';
  $('coachBody').innerHTML = `<p class="muted">${esc(staff() ? t().coachEmptyStaff : t().coachEmpty)}</p>`;
  S.mission = S.mode === 'mission' ? sc().missions[Math.floor(Math.random() * sc().missions.length)] : null;
  $('decor').textContent = sc().decor;
  $('focusLine').innerHTML = `${esc(t().focus)}<strong>${esc(sc().focus[S.lang])}</strong>`;
  $('menuHint').textContent = staff() ? t().menuHintStaff : t().menuHint;
  $('ticketTitle').textContent = staff() ? t().ticketStaff : t().ticket;
  $('customBox').hidden = staff();
  $('aacBox').hidden = staff();
  $('aacBox').open = sc().allergyPanel || sc().ageCheck;
  renderPhrases();
  renderMission();
  setActor('idle');

  if (staff()) {
    const r = await fetch('/api/customer/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: S.scId, language: S.lang }),
    }).then((x) => x.json());
    S.cust = r.customer_state;
    S.notes = r.notes_view;
    $('actorFace').textContent = r.customer_emoji || '🧑';
    addMsg('actor', r.customer_reply);
    S.history.push({ role: 'customer', content: r.customer_reply });
  } else {
    $('actorFace').textContent = sc().staff.emoji;
    const opening = sc().opening[S.lang];
    addMsg('actor', opening);
    S.history.push({ role: 'actor', content: opening });
  }
  renderAll();
  updatePayloadView(staff() ? staffPayload('', '') : buildPayload('', '', null, null));
}

function clearStaged() {
  S.point = null;
  S.sel.options = {};
  S.sel.modifiers = null;
  S.sel.allergies = new Set();
  S.sel.showId = false;
}

// ---------------------------------------------------------------- rendering
function renderAll() {
  renderMenu();
  renderCustom();
  renderAac();
  renderStaged();
  renderTicket();
}

function focusItem() {
  return menuItem(S.point?.id) || menuItem(S.order?.item) || null;
}

function renderMenu() {
  const el = $('menu');
  el.innerHTML = '';
  for (const m of sc().menu) {
    const card = document.createElement('div');
    card.className = 'card' + (S.point?.id === m.id ? ' picked' : '');
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    const quick = m.groups.includes('temperature') && !staff()
      ? `<div class="temps">${m.values.temperature.map((v) =>
        `<button data-temp="${v}" class="${S.point?.id === m.id && S.point?.opt?.value === v ? 'picked' : ''}">${esc(valName('temperature', v))}</button>`).join('')}</div>`
      : '';
    // โหมดพนักงาน: แสดงราคาตัวเลือกเสริมเพื่อให้คิดเงินได้
    const priceList = staff()
      ? `<div class="extras">${m.groups.flatMap((g) => m.values[g].filter((v) => valExtra(m, g, v)).map((v) => `${esc(valName(g, v))} +${valExtra(m, g, v)}`)).concat(
        m.modifiers.filter((x) => sc().modifiers[x]?.extra).map((x) => `${esc(modName(x))} +${sc().modifiers[x].extra}`)).join('<br>')}</div>`
      : '';
    card.innerHTML = `
      <div class="emoji">${m.emoji}</div>
      <div class="name">${esc(m[S.lang])}</div>
      <div class="alt">${esc(m[S.lang === 'th' ? 'en' : 'th'])}</div>
      <div class="price">${m.price}฿</div>
      <div class="algs" title="${esc(m.allergens.map(algName).join(', '))}">${m.allergens.map((a) => CFG.allergens[a].icon).join('')}</div>
      ${m.alcohol ? `<div class="alc">${esc(t().alcohol[m.alcohol])}</div>` : ''}
      ${quick}${priceList}`;
    card.addEventListener('click', (e) => {
      if (staff()) { insertText(m[S.lang]); return; }
      const temp = e.target.closest('button')?.dataset.temp || null;
      setPoint({ id: m.id, opt: temp ? { group: 'temperature', value: temp } : null });
    });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (staff()) insertText(m[S.lang]); else setPoint({ id: m.id, opt: null }); } });
    el.appendChild(card);
  }
}

function insertText(s) {
  const input = $('textInput');
  input.value = (input.value ? `${input.value.trimEnd()} ` : '') + s + ' ';
  S.fromSpeech = false;
  input.focus();
}

function renderPhrases() {
  $('phrases').hidden = !staff();
  $('phrases').innerHTML = t().phrases.map((p) => `<button>${esc(p)}</button>`).join('');
  $('phrases').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => insertText(b.textContent)));
}

function setPoint(p) {
  if (p?.id !== S.point?.id) { S.sel.options = {}; S.sel.modifiers = null; } // ตัวเลือกย่อยผูกกับเมนูที่ชี้
  S.point = p;
  if (p) setActor('looking');
  renderAll();
}

// ตัวเลือกย่อย: Chip (เลือก 1) + Checkbox (เลือกหลายอย่าง) ของเมนูที่กำลังชี้ / ที่สั่งอยู่
function renderCustom() {
  const el = $('custom');
  if (staff()) { el.innerHTML = ''; return; }
  const it = focusItem();
  if (!it) { el.innerHTML = `<p class="muted">${esc(t().customEmpty)}</p>`; return; }
  const o = S.order?.item === it.id ? S.order : null;
  const rows = it.groups.map((g) => `
    <div class="opt-row"><div class="lbl">${esc(CFG.groups[g][S.lang])}${CFG.groups[g].required ? ' *' : ''}</div>
      <div class="opt-chips">${it.values[g].map((v) => {
        const d = CFG.groups[g].values[v];
        const extra = valExtra(it, g, v);
        const cls = [o?.options?.[g] === v ? 'current' : '', S.sel.options[g] === v ? 'picked' : ''].join(' ');
        return `<button data-g="${g}" data-v="${v}" class="${cls}">${esc(d[S.lang])}${extra ? ` +${extra}` : ''}</button>`;
      }).join('')}</div></div>`).join('');
  const checked = (m) => (S.sel.modifiers ? S.sel.modifiers.has(m) : !!o?.modifiers?.includes(m));
  const forced = (m) => !!o && o.allergies.length && m.startsWith('no_') && o.modifiers.includes(m) && (o.safety_notes || []).includes(m.slice(3));
  const byType = { exclude: [], request: [], addon: [] };
  it.modifiers.forEach((m) => byType[sc().modifiers[m].type]?.push(m));
  const mods = Object.entries(byType).filter(([, ms]) => ms.length).map(([type, ms]) => `
    <div class="opt-row"><div class="lbl">${esc(t().modTypes[type])}</div><div class="mods">
      ${ms.map((m) => {
        const d = sc().modifiers[m];
        return `<label class="${forced(m) ? 'forced' : ''}"><input type="checkbox" data-m="${m}" ${checked(m) ? 'checked' : ''}/>
          ${d.emoji ? d.emoji + ' ' : ''}${esc(d[S.lang])}${d.extra ? ` <span class="extra">+${d.extra}</span>` : ''}</label>`;
      }).join('')}</div></div>`).join('');
  el.innerHTML = `<div class="custom-head">${it.emoji} ${esc(t().customFor)}: ${esc(it[S.lang])}</div>${rows}${mods}`;

  el.querySelectorAll('.opt-chips button').forEach((b) => b.addEventListener('click', () => {
    const { g, v } = b.dataset;
    if (S.sel.options[g] === v) delete S.sel.options[g]; else S.sel.options[g] = v;
    stageFocus(it);
    renderAll();
  }));
  el.querySelectorAll('input[type=checkbox]').forEach((c) => c.addEventListener('change', () => {
    if (!S.sel.modifiers) S.sel.modifiers = new Set(o?.modifiers || []);
    if (c.checked) S.sel.modifiers.add(c.dataset.m); else S.sel.modifiers.delete(c.dataset.m);
    stageFocus(it);
    renderAll();
  }));
}

// เลือกตัวเลือกของเมนูที่ยังไม่ได้สั่ง = ชี้เมนูนั้นไปพร้อมกัน
function stageFocus(it) {
  if (S.order?.item !== it.id && S.point?.id !== it.id) S.point = { id: it.id, opt: null };
}

// การ์ด AAC: แจ้งอาการแพ้ + (บาร์) แสดงบัตรประชาชน
function renderAac() {
  if (staff()) { $('aac').innerHTML = ''; return; }
  const declared = new Set(S.order?.allergies || []);
  const idCard = sc().ageCheck
    ? `<button data-id="1" class="id ${S.sel.showId ? 'picked' : ''} ${S.order?.id_status ? 'declared' : ''}"><span class="ic">🪪</span><span>${esc(t().aacId)}</span></button>`
    : '';
  $('aac').innerHTML = idCard + Object.entries(CFG.allergens).map(([a, d]) =>
    `<button data-a="${a}" class="${declared.has(a) ? 'declared' : S.sel.allergies.has(a) ? 'picked' : ''}" ${declared.has(a) ? 'disabled' : ''}>
      <span class="ic">${d.icon}</span><span>${esc(t().aacLabel(d[S.lang]))}</span></button>`).join('');
  $('aac').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.id) S.sel.showId = !S.sel.showId;
    else {
      const a = b.dataset.a;
      if (S.sel.allergies.has(a)) S.sel.allergies.delete(a); else S.sel.allergies.add(a);
    }
    renderAll();
  }));
}

function pointLabel(p) {
  if (!p) return '';
  const name = menuItem(p.id)?.[S.lang] ?? p.id;
  if (!p.opt) return name;
  const v = valName(p.opt.group, p.opt.value);
  return S.lang === 'th' ? name + v : `${v} ${name}`;
}

function selectionPayload() {
  const hasOpt = Object.keys(S.sel.options).length > 0;
  if (!hasOpt && !S.sel.modifiers && !S.sel.allergies.size && !S.sel.showId) return null;
  return {
    options: { ...S.sel.options },
    modifiers: S.sel.modifiers ? [...S.sel.modifiers] : null,
    allergies: [...S.sel.allergies],
    show_id: S.sel.showId,
  };
}

function stagedLabels() {
  const out = [];
  if (S.point) out.push({ text: `👉 ${pointLabel(S.point)}` });
  for (const [g, v] of Object.entries(S.sel.options)) out.push({ text: `☑️ ${valName(g, v)}` });
  if (S.sel.modifiers) {
    const before = new Set(S.order?.item === focusItem()?.id ? S.order.modifiers : []);
    [...S.sel.modifiers].filter((m) => !before.has(m)).forEach((m) => out.push({ text: `☑️ ${modName(m)}` }));
    [...before].filter((m) => !S.sel.modifiers.has(m)).forEach((m) => out.push({ text: `⬜ ${modName(m)}` }));
  }
  S.sel.allergies.forEach((a) => out.push({ text: `🩺 ${t().aacLabel(algName(a))}`, alg: true }));
  if (S.sel.showId) out.push({ text: `🪪 ${t().aacId}` });
  return out;
}

function renderStaged() {
  const labels = stagedLabels();
  $('staged').hidden = labels.length === 0;
  $('stagedChips').innerHTML = labels.map((l) => `<span class="chip ${l.alg ? 'alg' : ''}">${esc(l.text)}</span>`).join('');
}

function renderMission() {
  const show = !!S.mission || staff();
  $('missionCard').hidden = !show;
  if (!show) return;
  if (staff()) {
    document.querySelector('.mission-tag').textContent = t().staffTag;
    $('missionTitle').textContent = t().staffTitle(sc().staff[S.lang]);
    $('missionDesc').textContent = t().staffDesc;
    $('missionProfile').hidden = true;
    return;
  }
  document.querySelector('.mission-tag').textContent = t().missionTag;
  $('missionTitle').textContent = S.mission[S.lang];
  $('missionDesc').textContent = S.mission.brief[S.lang];
  const p = S.mission.profile || {};
  const lines = [];
  if (p.allergies?.length) lines.push('🩺 ' + t().youAllergic + p.allergies.map((a) => `${CFG.allergens[a].icon} ${algName(a)}`).join(', '));
  if (p.age != null) lines.push(t().youAge(p.age));
  if (p.driving) lines.push(t().youDrive);
  $('missionProfile').hidden = !lines.length;
  $('missionProfile').textContent = lines.join(' · ');
}

function renderTicket() {
  if (staff()) return renderStaffNotes();
  const o = S.order || { options: {}, modifiers: [], allergies: [], quantity: 1, phase: 'ordering' };
  const it = menuItem(o.item);
  const rows = [[t().item, it ? `${it.emoji} ${it[S.lang]}` : null, true]];
  if (it) {
    for (const g of it.groups) {
      const v = o.options[g];
      if (!CFG.groups[g].required && !v) continue;
      rows.push([CFG.groups[g][S.lang], v ? valName(g, v) : null, true]);
    }
    rows.push([t().qty, String(o.quantity || 1), true]);
  }
  $('slots').innerHTML = rows.map(([k, v, ok]) =>
    `<li class="${v && ok ? 'filled' : 'empty'}"><span class="k">${esc(k)}</span><span class="v">${esc(v || '—')}</span></li>`).join('');
  $('ticketTags').innerHTML = [
    ...(o.id_status === 'verified' ? [`<span class="tag ok">${esc(t().idVerified(o.id_age))}</span>`] : []),
    ...(o.id_status === 'refused' ? [`<span class="tag alg">${esc(t().idRefused)}</span>`] : []),
    ...o.allergies.map((a) => `<span class="tag alg">${CFG.allergens[a].icon} ${esc(t().allergy)} ${esc(algName(a))}</span>`),
    ...o.modifiers.map((m) => `<span class="tag">${esc(modName(m))}</span>`),
  ].join('');
  $('phase').className = `phase ${o.phase}`;
  $('phase').textContent = t().phase[o.phase] + (o.phase === 'complete' && S.prep ? ` · ${t().prep(S.prep)}` : '');
  $('total').previousElementSibling.textContent = t().total;
  $('total').textContent = `${S.lastTotal || 0} ฿`;
  document.querySelector('.ticket').classList.toggle('done', o.phase === 'complete');
}

// โหมดพนักงาน: ใบจดสิ่งที่ลูกค้าบอกแล้ว ("?" = ยังไม่รู้ ต้องถาม)
function renderStaffNotes() {
  const n = S.notes || { rows: [], extras: [], allergies: [], phase: 'ordering' };
  $('slots').innerHTML = n.rows.map((r) =>
    `<li class="${r.value ? 'filled' : 'empty'}"><span class="k">${esc(r.label)}</span><span class="v">${esc(r.value || t().unknown)}</span></li>`).join('');
  $('ticketTags').innerHTML = [
    ...(n.id_age != null ? [`<span class="tag ${n.id_age >= 20 ? 'ok' : 'alg'}">${esc(t().idSeen(n.id_age))}</span>`] : []),
    ...n.allergies.map((a) => `<span class="tag alg">${CFG.allergens[a].icon} ${esc(t().allergy)} ${esc(algName(a))}</span>`),
    ...n.extras.map((x) => `<span class="tag">${esc(x)}</span>`),
  ].join('');
  const ph = n.phase === 'done' ? 'done' : n.readback_ok ? 'confirming' : 'ordering';
  $('phase').className = `phase ${ph === 'done' ? 'complete' : ph}`;
  $('phase').textContent = t().phase[ph];
  $('total').previousElementSibling.textContent = t().totalStaff;
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

function setActor(state) {
  $('actor').dataset.state = state;
  $('stateLabel').textContent = (staff() ? t().statesStaff[state] : null) || t().states[state] || '';
}

function addMsg(role, text, meta = []) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = esc(text)
    + (role === 'actor' ? '<button class="speak" title="🔊" aria-label="speak">🔊</button>' : '')
    + (meta.length ? `<div class="meta">${meta.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>` : '');
  div.querySelector('.speak')?.addEventListener('click', () => speak(text, true));
  $('chat').appendChild(div);
  $('chat').scrollTop = $('chat').scrollHeight;
  if (role === 'actor') speak(text);
  return div;
}

// ---------------------------------------------------------------- context aggregator (ฝั่งหน้าเว็บ)
function buildPayload(speech, text, point, selection) {
  return {
    session_id: S.session,
    scenario: S.scId,
    language: S.lang,
    environment_factors: { noise_level: S.noise, queue_status: 'normal' },
    learner_profile: S.mission?.profile || null, // โค้ชและระบบตรวจบัตรใช้ — พนักงานไม่เห็น
    current_turn: {
      user_speech: speech,
      user_text: text,
      user_action: point
        ? { type: 'point', target_id: point.opt ? `${point.opt.value}_${point.id}` : point.id, target_label: pointLabel(point) }
        : null,
      user_selection: selection,
    },
    dialogue_history: S.history.slice(-12),
    order_state: S.order,
  };
}

function staffPayload(speech, text) {
  return {
    session_id: S.session, scenario: S.scId, language: S.lang, mode: 'staff',
    current_turn: { user_speech: speech, user_text: text },
    dialogue_history: S.history.slice(-12),
    customer_state: S.cust,
  };
}

// ซ่อนออเดอร์ในใจลูกค้าในหน้าจอ JSON (ไม่ให้เฉลย)
function updatePayloadView(p) {
  const shown = p.customer_state ? { ...p, customer_state: { ...p.customer_state, target: '🔒 hidden', profile: '🔒 hidden', safety_mods: '🔒' } } : p;
  $('payloadView').textContent = JSON.stringify(shown, null, 2);
}

async function sendTurn() {
  if (S.busy) return;
  const raw = $('textInput').value.trim();
  const selection = staff() ? null : selectionPayload();
  const point = staff() ? null : S.point;
  if (!raw && !point && !selection) { $('hint').textContent = t().emptySend; return; }
  if (recognizing) recognizer.stop();

  const speech = S.fromSpeech ? raw : '';
  const text = S.fromSpeech ? '' : raw;
  const payload = staff() ? staffPayload(speech, text) : buildPayload(speech, text, point, selection);
  updatePayloadView(payload);

  const staged = stagedLabels().map((l) => l.text);
  const meta = [];
  if (speech) meta.push(`🎤 ${t().speech}`);
  if (text) meta.push(`⌨️ ${t().text}`);
  if (!staff()) meta.push(...staged);
  addMsg('user', raw || staged.join(' · '), meta);
  const userLine = [raw, ...(staff() ? [] : staged.map((s) => `[${s}]`))].filter(Boolean).join(' ');

  $('textInput').value = '';
  S.fromSpeech = false;
  clearStaged();
  renderAll();
  $('hint').textContent = '';
  S.busy = true;
  $('sendBtn').disabled = true;
  setActor('thinking');
  const typing = document.createElement('div');
  typing.className = 'msg actor typing';
  typing.textContent = '…';
  $('chat').appendChild(typing);

  try {
    const res = await fetch(staff() ? '/api/customer/turn' : '/api/turn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const r = await res.json();
    if (!res.ok) throw new Error(r.error || res.statusText);
    await new Promise((ok) => setTimeout(ok, 350)); // จังหวะให้ดูเป็นธรรมชาติ
    typing.remove();
    if (staff()) {
      S.history.push({ role: 'staff', content: userLine }, { role: 'customer', content: r.customer_reply });
      S.cust = r.customer_state;
      S.notes = r.notes_view;
      S.lastTotal = r.total_price;
      S.turns.push({ channels: { speech: !!speech, text: !!text }, coach: r.coach });
      addMsg('actor', r.customer_reply);
    } else {
      S.history.push({ role: 'user', content: userLine }, { role: 'actor', content: r.actor_reply });
      S.order = r.order_state;
      S.lastTotal = r.total_price;
      S.prep = r.prep_minutes;
      S.turns.push({ channels: { speech: !!speech, text: !!text, point: !!point, select: !!selection }, coach: r.coach });
      addMsg('actor', r.actor_reply);
    }
    setActor(r.action_state);
    renderAll();
    renderCoach(r.coach);
    if (r.engine && r.engine.includes('fallback')) $('hint').textContent = '⚠️ ' + r.engine;
    const finished = staff() ? r.customer_state.phase === 'done' : r.order_state.is_complete;
    trackStruggle(r, finished);
    if (finished) {
      setTimeout(() => setActor('serving'), 2200);
      setTimeout(showDebrief, 3400);
    }
  } catch (err) {
    typing.remove();
    $('hint').textContent = '⚠️ ' + err.message;
    setActor('confused');
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
    ? { mode: 'staff', scenario: S.scId, language: S.lang, polite: S.polite, customer_state: S.cust, dialogue_history: S.history }
    : { scenario: S.scId, language: S.lang, polite: S.polite, order_state: S.order, dialogue_history: S.history, mission_id: S.mission?.id || null, learner_profile: S.mission?.profile || null };
  try {
    const a = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
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
    S.polite = b.dataset.polite; store.set('ch2.polite', S.polite); loadAssist();
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
    ? { mode: 'staff', language: S.lang, scenario: S.scId, turns: S.turns, customer_state: S.cust }
    : { language: S.lang, scenario: S.scId, turns: S.turns, order_state: S.order, mission_id: S.mission?.id || null };
  const d = await fetch('/api/debrief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
  const L = t().d;
  const bar = (label, v, note) => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span>${v}</span></div>${note ? `<div class="note">${esc(note)}</div>` : ''}`;
  const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${L.none}</p>`);
  const head = `<h3>${esc(staff() ? L.titleStaff : L.title)} · ${sc().icon} ${esc(sc()[S.lang])}</h3>
    <div class="score-big"><span class="num">${d.overall}</span><span class="stars">${'★'.repeat(d.stars)}${'☆'.repeat(3 - d.stars)}</span></div>`;
  const tail = `${d.scores.safety != null ? bar(L.safety, d.scores.safety, d.notes.safety) : ''}
    <h4>✅ ${esc(L.strengths)}</h4>${list(d.strengths)}
    <h4>🎯 ${esc(L.improve)}</h4>${list(d.improvements)}`;
  $('debriefBody').innerHTML = staff()
    ? `${head}
      <div><strong>${esc(L.customerOrder)}:</strong> ${esc(d.order_summary)}</div>
      ${bar(L.goalStaff, d.scores.goal, d.notes.goal)}
      ${bar(L.efficiency, d.scores.efficiency, d.notes.efficiency)}
      ${bar(L.price, d.scores.price, d.notes.price)}
      ${bar(L.politeness, d.scores.politeness)}
      ${tail}`
    : `${head}
      <div><strong>${esc(L.yourOrder)}:</strong> ${esc(d.order_summary)}${d.mission_brief ? `<br><strong>${esc(L.mission)}:</strong> ${esc(d.mission_brief)}` : ''}</div>
      ${d.checks?.length ? `<h4>${esc(L.checks)}</h4><ul class="checks">${d.checks.map((c) => `<li class="${c.ok ? 'ok' : 'no'}">${esc(c.label)}</li>`).join('')}</ul>` : ''}
      ${bar(L.goal, d.scores.goal, d.notes.goal)}
      ${bar(L.efficiency, d.scores.efficiency, d.notes.efficiency)}
      ${bar(L.politeness, d.scores.politeness)}
      ${bar(L.clarity, d.scores.clarity, d.notes.channels)}
      ${tail}`;
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
  recognizer.onstart = () => { recognizing = true; $('micBtn').classList.add('rec'); $('hint').textContent = t().listening; setActor('listening'); };
  recognizer.onend = () => {
    recognizing = false; $('micBtn').classList.remove('rec');
    if ($('actor').dataset.state === 'listening') setActor('idle');
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
  window.speechSynthesis?.cancel();
  recognizer.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  try { recognizer.start(); } catch (err) { $('hint').textContent = t().micError + err.message; }
}

function speak(text, force = false, rate = 1.05) {
  if ((!S.tts && !force) || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, '').replace(/\(.*?\)/g, ''));
  u.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = rate;
  speechSynthesis.speak(u);
}

init();
