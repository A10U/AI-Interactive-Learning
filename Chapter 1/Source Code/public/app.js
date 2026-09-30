// Front-End (Chapter 1): Multimodal Input (พูด / พิมพ์ / ชี้ / ติ๊กตัวเลือก / การ์ดแจ้งอาการแพ้) → Context Aggregator → /api/turn
const I18N = {
  th: {
    title: 'AI Food Ordering — บทที่ 1', subtitle: 'ฝึกสื่อสารในชีวิตประจำวัน: การสั่งอาหารทั่วไป',
    mode: 'โหมด', modeFree: 'อิสระ', modeMission: 'ภารกิจ',
    noise: 'เสียงในร้าน', quiet: 'เงียบ', medium: 'ปานกลาง', loud: 'ดังมาก', tts: 'พนักงานพูดออกเสียง',
    missionTag: '🎯 ภารกิจของคุณ', youAllergic: '🩺 คุณแพ้: ', focus: 'จุดเน้นของสถานการณ์: ',
    send: 'ส่ง', placeholder: 'พิมพ์ หรือกด 🎤 เพื่อพูด…', clear: 'ล้าง',
    menuBoard: 'ป้ายเมนู',
    menuHintCafe: 'แตะเมนูเพื่อ "ชี้" (แตะ ร้อน/เย็น/ปั่น ได้) แล้วพูดหรือพิมพ์เพิ่ม หรือกดส่งเลย',
    menuHintFood: 'แตะเมนูเพื่อ "ชี้" แล้วเลือกตัวเลือกย่อยด้านล่าง หรือพูด/พิมพ์รายละเอียด',
    customize: 'ตัวเลือกย่อย (Modifiers)', customEmpty: 'แตะเมนูบนป้ายเพื่อดูตัวเลือกย่อย',
    customFor: 'ตัวเลือกสำหรับ', modTypes: { exclude: 'ไม่ใส่', request: 'คำขอพิเศษ', addon: 'เพิ่มเติม / เบเกอรี' },
    aacTitle: '🩺 การ์ดแจ้งอาการแพ้ (AAC)', aacHint: 'แตะการ์ดเพื่อแจ้งพนักงานโดยไม่ต้องพูด แล้วกดส่ง', aacLabel: (x) => `ฉันแพ้${x}`,
    ticket: 'ใบออเดอร์', total: 'ยอดรวม', coach: 'โค้ชประเมิน', coachEmpty: 'เริ่มสั่งได้เลย โค้ชจะให้คำแนะนำทุกเทิร์น',
    phase: { ordering: '📝 กำลังสั่ง', confirming: '🔁 รอยืนยันออเดอร์', complete: '✅ ยืนยันแล้ว' },
    prep: (m) => `⏱️ ประมาณ ${m} นาที`,
    debrief: 'สรุปผล', restart: 'เริ่มใหม่', payload: 'ดู JSON payload ที่ส่งเข้า AI', close: 'ปิด', playAgain: 'เล่นอีกครั้ง',
    item: 'เมนู', qty: 'จำนวน', allergy: 'แพ้',
    pointing: 'ชี้', speech: 'พูด', text: 'พิมพ์', select: 'เลือก',
    states: { idle: 'รอรับออเดอร์', thinking: 'กำลังคิด…', asking: 'ถามรายละเอียด', looking: 'มองตามมือคุณ', confused: 'งงนิดหน่อย', warning: 'ระวังอาการแพ้!', confirming: 'ทวนออเดอร์', making: 'กำลังเตรียมให้!', serving: 'เสิร์ฟแล้ว 🍽️', listening: 'กำลังฟัง…' },
    politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', na: 'ไม่มีคำพูด',
    micUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการพูด ลองใช้ Chrome หรือ Edge', micError: 'ใช้ไมค์ไม่ได้: ',
    listening: 'กำลังฟัง… พูดได้เลย', heard: 'ได้ยินว่า: ', emptySend: 'พูด พิมพ์ แตะเมนู หรือเลือกตัวเลือกก่อนนะ',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI',
    d: { title: 'สรุปผลการสั่งอาหาร', overall: 'คะแนนรวม', goal: 'สำเร็จตามเป้าหมาย', efficiency: 'ประสิทธิภาพ', politeness: 'ความสุภาพ', clarity: 'ความชัดเจน', safety: 'ความปลอดภัย', strengths: 'จุดเด่น', improve: 'สิ่งที่ควรพัฒนา', yourOrder: 'ออเดอร์ของคุณ', mission: 'ภารกิจ', checks: 'ตรวจตามภารกิจ', none: '—' },
  },
  en: {
    title: 'AI Food Ordering — Chapter 1', subtitle: 'Everyday communication practice: general food ordering',
    mode: 'Mode', modeFree: 'Free play', modeMission: 'Mission',
    noise: 'Noise', quiet: 'Quiet', medium: 'Medium', loud: 'Loud', tts: 'Staff speaks aloud',
    missionTag: '🎯 Your mission', youAllergic: '🩺 You are allergic to: ', focus: 'Scenario focus: ',
    send: 'Send', placeholder: 'Type, or press 🎤 to speak…', clear: 'Clear',
    menuBoard: 'Menu board',
    menuHintCafe: 'Tap a drink to "point" (tap hot/iced/frappé too), then speak or type — or just send',
    menuHintFood: 'Tap a dish to "point", then tick modifiers below or speak/type the details',
    customize: 'Modifiers', customEmpty: 'Tap an item on the menu board to see its options',
    customFor: 'Options for', modTypes: { exclude: 'Leave out', request: 'Special requests', addon: 'Extras / bakery' },
    aacTitle: '🩺 Allergy cards (AAC)', aacHint: 'Tap a card to tell the staff without speaking, then send', aacLabel: (x) => `I'm allergic to ${x}`,
    ticket: 'Order ticket', total: 'Total', coach: 'Coach feedback', coachEmpty: 'Start ordering — the coach will give feedback every turn',
    phase: { ordering: '📝 Ordering', confirming: '🔁 Waiting for confirmation', complete: '✅ Confirmed' },
    prep: (m) => `⏱️ about ${m} min`,
    debrief: 'Debrief', restart: 'Restart', payload: 'Show the JSON payload sent to the AI', close: 'Close', playAgain: 'Play again',
    item: 'Item', qty: 'Qty', allergy: 'Allergy',
    pointing: 'point', speech: 'speech', text: 'text', select: 'select',
    states: { idle: 'Ready to take your order', thinking: 'Thinking…', asking: 'Asking for details', looking: 'Looking where you point', confused: 'A bit confused', warning: 'Allergy alert!', confirming: 'Reading it back', making: 'Preparing your order!', serving: 'Served 🍽️', listening: 'Listening…' },
    politeness: 'Politeness', clarity: 'Clarity', na: 'no words',
    micUnsupported: 'Speech input is not supported in this browser — try Chrome or Edge', micError: 'Microphone error: ',
    listening: 'Listening… go ahead', heard: 'Heard: ', emptySend: 'Speak, type, tap the menu or tick an option first',
    engineOffline: 'Offline engine', engineClaude: 'Claude AI',
    d: { title: 'Order debrief', overall: 'Overall', goal: 'Goal completion', efficiency: 'Efficiency', politeness: 'Politeness', clarity: 'Clarity', safety: 'Safety', strengths: 'Strengths', improve: 'To improve', yourOrder: 'Your order', mission: 'Mission', checks: 'Mission checklist', none: '—' },
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
  lang: store.get('food.lang', 'th'),
  scId: store.get('food.scenario', 'cafe'),
  mode: 'free',
  noise: 'quiet',
  tts: true,
  session: null,
  order: null,
  history: [],
  turns: [],
  point: null,                                         // { id, opt: { group, value } | null }
  sel: { options: {}, modifiers: null, allergies: new Set() }, // สิ่งที่ติ๊กไว้ รอส่งในเทิร์นถัดไป
  fromSpeech: false,
  mission: null,
  lastTotal: 0,
  prep: null,
  busy: false,
};

const t = () => I18N[S.lang];
const sc = () => CFG.scenarios.find((x) => x.id === S.scId) || CFG.scenarios[0];
const menuItem = (id) => sc().menu.find((m) => m.id === id);
const valName = (g, v) => CFG.groups[g]?.values[v]?.[S.lang] ?? v;
const modName = (m) => sc().modifiers[m]?.[S.lang] ?? m;
const algName = (a) => CFG.allergens[a]?.[S.lang] ?? a;

// ---------------------------------------------------------------- init
async function init() {
  CFG = await fetch('/api/config').then((r) => r.json());
  if (!CFG.scenarios.some((x) => x.id === S.scId)) S.scId = CFG.scenarios[0].id;
  bindUi();
  applyLang();
  restart();
}

function bindUi() {
  document.querySelectorAll('#langSeg button').forEach((b) =>
    b.addEventListener('click', () => { S.lang = b.dataset.lang; store.set('food.lang', S.lang); applyLang(); restart(); }));
  $('modeSel').addEventListener('change', (e) => { S.mode = e.target.value; restart(); });
  $('noiseSel').addEventListener('change', (e) => { S.noise = e.target.value; });
  $('ttsChk').addEventListener('change', (e) => { S.tts = e.target.checked; if (!S.tts) window.speechSynthesis?.cancel(); });
  $('sendBtn').addEventListener('click', sendTurn);
  $('textInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) sendTurn(); });
  $('textInput').addEventListener('input', () => { S.fromSpeech = false; });
  $('clearStaged').addEventListener('click', () => { clearStaged(); renderAll(); });
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
  renderTabs();
}

function renderTabs() {
  $('scTabs').innerHTML = CFG.scenarios.map((x) =>
    `<button role="tab" data-sc="${x.id}" class="${x.id === S.scId ? 'on' : ''}" aria-selected="${x.id === S.scId}">
      <span>${x.icon}</span><span>${esc(x[S.lang])}</span><span class="code">${x.code}</span></button>`).join('');
  $('scTabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    S.scId = b.dataset.sc; store.set('food.scenario', S.scId); renderTabs(); restart();
  }));
}

function restart() {
  window.speechSynthesis?.cancel();
  S.session = 'usr_' + Math.random().toString(36).slice(2, 8);
  S.order = null;
  S.history = [];
  S.turns = [];
  S.lastTotal = 0;
  S.prep = null;
  S.sel.allergies = new Set();
  clearStaged();
  $('chat').innerHTML = '';
  $('textInput').value = '';
  $('hint').textContent = '';
  $('coachBody').innerHTML = `<p class="muted">${esc(t().coachEmpty)}</p>`;
  S.mission = S.mode === 'mission' ? sc().missions[Math.floor(Math.random() * sc().missions.length)] : null;
  $('actorFace').textContent = sc().staff.emoji;
  $('decor').textContent = sc().decor;
  $('focusLine').innerHTML = `${esc(t().focus)}<strong>${esc(sc().focus[S.lang])}</strong>`;
  $('menuHint').textContent = sc().id === 'cafe' ? t().menuHintCafe : t().menuHintFood;
  $('aacBox').open = sc().allergyPanel;
  renderMission();
  setActor('idle');
  const opening = sc().opening[S.lang];
  addMsg('actor', opening);
  S.history.push({ role: 'actor', content: opening });
  renderAll();
  updatePayloadView(buildPayload('', '', null, null));
}

function clearStaged() {
  S.point = null;
  S.sel.options = {};
  S.sel.modifiers = null;
  S.sel.allergies = new Set();
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
    const quick = m.groups.includes('temperature')
      ? `<div class="temps">${m.values.temperature.map((v) =>
        `<button data-temp="${v}" class="${S.point?.id === m.id && S.point?.opt?.value === v ? 'picked' : ''}">${esc(valName('temperature', v))}</button>`).join('')}</div>`
      : '';
    card.innerHTML = `
      <div class="emoji">${m.emoji}</div>
      <div class="name">${esc(m[S.lang])}</div>
      <div class="alt">${esc(m[S.lang === 'th' ? 'en' : 'th'])}</div>
      <div class="price">${m.price}฿</div>
      <div class="algs" title="${esc(m.allergens.map(algName).join(', '))}">${m.allergens.map((a) => CFG.allergens[a].icon).join('')}</div>
      ${quick}`;
    card.addEventListener('click', (e) => {
      const temp = e.target.closest('button')?.dataset.temp || null;
      setPoint({ id: m.id, opt: temp ? { group: 'temperature', value: temp } : null });
    });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPoint({ id: m.id, opt: null }); } });
    el.appendChild(card);
  }
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
  const it = focusItem();
  if (!it) { el.innerHTML = `<p class="muted">${esc(t().customEmpty)}</p>`; return; }
  const o = S.order?.item === it.id ? S.order : null;
  const rows = it.groups.map((g) => `
    <div class="opt-row"><div class="lbl">${esc(CFG.groups[g][S.lang])}${CFG.groups[g].required ? ' *' : ''}</div>
      <div class="opt-chips">${it.values[g].map((v) => {
        const d = CFG.groups[g].values[v];
        const cls = [o?.options?.[g] === v ? 'current' : '', S.sel.options[g] === v ? 'picked' : ''].join(' ');
        return `<button data-g="${g}" data-v="${v}" class="${cls}">${esc(d[S.lang])}${d.extra ? ` +${d.extra}` : ''}</button>`;
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

function renderAac() {
  const declared = new Set(S.order?.allergies || []);
  $('aac').innerHTML = Object.entries(CFG.allergens).map(([a, d]) =>
    `<button data-a="${a}" class="${declared.has(a) ? 'declared' : S.sel.allergies.has(a) ? 'picked' : ''}" ${declared.has(a) ? 'disabled' : ''}>
      <span class="ic">${d.icon}</span><span>${esc(t().aacLabel(d[S.lang]))}</span></button>`).join('');
  $('aac').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.a;
    if (S.sel.allergies.has(a)) S.sel.allergies.delete(a); else S.sel.allergies.add(a);
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
  if (!hasOpt && !S.sel.modifiers && !S.sel.allergies.size) return null;
  return {
    options: { ...S.sel.options },
    modifiers: S.sel.modifiers ? [...S.sel.modifiers] : null,
    allergies: [...S.sel.allergies],
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
  return out;
}

function renderStaged() {
  const labels = stagedLabels();
  $('staged').hidden = labels.length === 0;
  $('stagedChips').innerHTML = labels.map((l) => `<span class="chip ${l.alg ? 'alg' : ''}">${esc(l.text)}</span>`).join('');
}

function renderMission() {
  $('missionCard').hidden = !S.mission;
  if (!S.mission) return;
  $('missionTitle').textContent = S.mission[S.lang];
  $('missionDesc').textContent = S.mission.brief[S.lang];
  const algs = S.mission.profile?.allergies || [];
  $('missionProfile').hidden = !algs.length;
  $('missionProfile').textContent = t().youAllergic + algs.map((a) => `${CFG.allergens[a].icon} ${algName(a)}`).join(', ');
}

function renderTicket() {
  const o = S.order || { options: {}, modifiers: [], allergies: [], quantity: 1, phase: 'ordering' };
  const it = menuItem(o.item);
  const rows = [[t().item, it ? `${it.emoji} ${it[S.lang]}` : null, true]];
  if (it) {
    for (const g of it.groups) {
      const v = o.options[g];
      const partial = v && CFG.groups[g].values[v]?.partial;
      if (!CFG.groups[g].required && !v) continue;
      rows.push([CFG.groups[g][S.lang], v ? valName(g, v) + (partial ? ' ?' : '') : null, !partial]);
    }
    rows.push([t().qty, String(o.quantity || 1), true]);
  }
  $('slots').innerHTML = rows.map(([k, v, ok]) =>
    `<li class="${v && ok ? 'filled' : 'empty'}"><span class="k">${esc(k)}</span><span class="v">${esc(v || '—')}</span></li>`).join('');
  $('ticketTags').innerHTML = [
    ...o.allergies.map((a) => `<span class="tag alg">${CFG.allergens[a].icon} ${esc(t().allergy)} ${esc(algName(a))}</span>`),
    ...o.modifiers.map((m) => `<span class="tag">${esc(modName(m))}</span>`),
  ].join('');
  $('phase').className = `phase ${o.phase}`;
  $('phase').textContent = t().phase[o.phase] + (o.phase === 'complete' && S.prep ? ` · ${t().prep(S.prep)}` : '');
  $('total').textContent = `${S.lastTotal || 0} ฿`;
  document.querySelector('.ticket').classList.toggle('done', o.phase === 'complete');
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
  $('stateLabel').textContent = t().states[state] || '';
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
    learner_profile: S.mission?.profile || null, // โค้ชใช้ประเมิน — พนักงานไม่เห็น
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

function updatePayloadView(p) {
  $('payloadView').textContent = JSON.stringify(p, null, 2);
}

async function sendTurn() {
  if (S.busy) return;
  const raw = $('textInput').value.trim();
  const selection = selectionPayload();
  const point = S.point;
  if (!raw && !point && !selection) { $('hint').textContent = t().emptySend; return; }
  if (recognizing) recognizer.stop();

  const speech = S.fromSpeech ? raw : '';
  const text = S.fromSpeech ? '' : raw;
  const payload = buildPayload(speech, text, point, selection);
  updatePayloadView(payload);

  const staged = stagedLabels().map((l) => l.text);
  const meta = [];
  if (speech) meta.push(`🎤 ${t().speech}`);
  if (text) meta.push(`⌨️ ${t().text}`);
  meta.push(...staged);
  addMsg('user', raw || staged.join(' · '), meta);
  const userLine = [raw, ...staged.map((s) => `[${s}]`)].filter(Boolean).join(' ');

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
    const res = await fetch('/api/turn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const r = await res.json();
    if (!res.ok) throw new Error(r.error || res.statusText);
    await new Promise((ok) => setTimeout(ok, 350)); // จังหวะให้ดูเป็นธรรมชาติ
    typing.remove();
    S.history.push({ role: 'user', content: userLine }, { role: 'actor', content: r.actor_reply });
    S.order = r.order_state;
    S.lastTotal = r.total_price;
    S.prep = r.prep_minutes;
    S.turns.push({ channels: { speech: !!speech, text: !!text, point: !!point, select: !!selection }, coach: r.coach });
    addMsg('actor', r.actor_reply);
    setActor(r.action_state);
    renderAll();
    renderCoach(r.coach);
    if (r.engine && r.engine.includes('fallback')) $('hint').textContent = '⚠️ ' + r.engine;
    if (r.order_state.is_complete) {
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

// ---------------------------------------------------------------- debrief
async function showDebrief() {
  const d = await fetch('/api/debrief', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: S.lang, scenario: S.scId, turns: S.turns, order_state: S.order, mission_id: S.mission?.id || null }),
  }).then((r) => r.json());
  const L = t().d;
  const bar = (label, v, note) => `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span>${v}</span></div>${note ? `<div class="note">${esc(note)}</div>` : ''}`;
  const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${L.none}</p>`);
  $('debriefBody').innerHTML = `
    <h3>${esc(L.title)} · ${sc().icon} ${esc(sc()[S.lang])}</h3>
    <div class="score-big"><span class="num">${d.overall}</span><span class="stars">${'★'.repeat(d.stars)}${'☆'.repeat(3 - d.stars)}</span></div>
    <div><strong>${esc(L.yourOrder)}:</strong> ${esc(d.order_summary)}${d.mission_brief ? `<br><strong>${esc(L.mission)}:</strong> ${esc(d.mission_brief)}` : ''}</div>
    ${d.checks?.length ? `<h4>${esc(L.checks)}</h4><ul class="checks">${d.checks.map((c) => `<li class="${c.ok ? 'ok' : 'no'}">${esc(c.label)}</li>`).join('')}</ul>` : ''}
    ${bar(L.goal, d.scores.goal, d.notes.goal)}
    ${bar(L.efficiency, d.scores.efficiency, d.notes.efficiency)}
    ${bar(L.politeness, d.scores.politeness)}
    ${bar(L.clarity, d.scores.clarity, d.notes.channels)}
    ${d.scores.safety != null ? bar(L.safety, d.scores.safety, d.notes.safety) : ''}
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

function speak(text, force = false) {
  if ((!S.tts && !force) || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[☕🔊🍽️]/gu, ''));
  u.lang = S.lang === 'th' ? 'th-TH' : 'en-US';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = 1.05;
  speechSynthesis.speak(u);
}

init();
