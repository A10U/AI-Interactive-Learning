// Assist Bot (💡 ตัวช่วย): ช่วยผู้เรียนเมื่อคุยกับ AI แล้วติด — ทำงานแบบ Offline เสมอ (เร็ว ไม่ต้องใช้ API)
//   1) 🧭 บอกว่าตอนนี้อีกฝ่ายถามอะไร / ควรทำอะไรต่อ
//   2) 📖 อธิบายคำศัพท์ในประโยคล่าสุด (เช่น ปั่น/frappé, หวานน้อย, นมโอ๊ต) พร้อมคำแปล ไทย↔อังกฤษ
//   3) 💬 ประโยคตัวอย่างให้แตะใช้ได้ทันที (⭐ = ตรงกับภารกิจ / แนะนำ)
//   4) 🎯 ประโยคเต็มแบบเฉลย (ซ่อนไว้ ผู้เรียนกดดูเอง)  5) 🧮 วิธีคิดราคา (โหมดพนักงาน)
// ใช้ได้ทั้งโหมดลูกค้า (ผู้เรียนสั่ง) และโหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน)
// ESM ล้วน ไม่มี node: import — ใช้ได้ทั้งบนเซิร์ฟเวอร์ (/api/assist) และในเบราว์เซอร์ (โหมด Offline บน GitHub Pages)
import {
  MENU, MISSIONS, TEMPS, SWEETNESS, SIZES, MILKS, menuById, enName, emptyOrder, missingSlots, unitPrice, describeOrder,
} from './menu.js';
import { openingLine } from './ruleEngine.js';
import { requiredGroups, valName, groupLabel } from './customerEngine.js';

// คำอธิบายศัพท์ (group.value)
const GLOSS = {
  'temperature.hot': { th: 'เครื่องดื่มร้อน เสิร์ฟในแก้วกาแฟร้อน', en: 'served hot' },
  'temperature.iced': { th: 'ใส่น้ำแข็ง (+5 บาท)', en: 'served over ice (+5 baht)' },
  'temperature.frappe': { th: '"ปั่น / Frappé" = ปั่นกับน้ำแข็งจนเป็นเกล็ด (+10 บาท)', en: 'blended with ice until slushy (+10 baht)' },
  'sweetness.none': { th: 'ไม่ใส่น้ำตาลเลย (หวาน 0%)', en: 'no sugar at all (0%)' },
  'sweetness.less': { th: 'หวานประมาณครึ่งหนึ่งของปกติ (25–50%)', en: 'about half the usual sugar' },
  'sweetness.normal': { th: 'ความหวานมาตรฐานของร้าน (100%)', en: "the shop's standard sweetness" },
  'sweetness.extra': { th: 'หวานกว่าปกติ', en: 'sweeter than usual' },
  'size.regular': { th: `แก้ว ${SIZES.regular.oz} ออนซ์ (ราคาปกติ)`, en: `${SIZES.regular.oz} oz cup (no extra charge)` },
  'size.large': { th: `แก้ว ${SIZES.large.oz} ออนซ์ (+${SIZES.large.extra} บาท)`, en: `${SIZES.large.oz} oz cup (+${SIZES.large.extra} baht)` },
  'milk.dairy': { th: 'นมวัวปกติของร้าน', en: "the shop's regular cow's milk" },
  'milk.oat': { th: `นมจากข้าวโอ๊ต ไม่มีนมวัว เหมาะกับคนแพ้นม (+${MILKS.oat.extra} บาท)`, en: `made from oats, no dairy — good for allergies (+${MILKS.oat.extra} baht)` },
  'milk.soy': { th: `นมจากถั่วเหลือง ไม่มีนมวัว (+${MILKS.soy.extra} บาท)`, en: `made from soybeans, no dairy (+${MILKS.soy.extra} baht)` },
  'menu.espresso': { th: 'กาแฟเข้มข้นช็อตเล็ก ไม่ใส่นม มีแบบร้อนเท่านั้น', en: 'a small, strong shot of coffee — hot only' },
  'menu.americano': { th: 'เอสเปรสโซ่ผสมน้ำ รสเข้ม ไม่มีนม', en: 'espresso with water — strong, no milk' },
  'menu.latte': { th: 'เอสเปรสโซ่ + นมเยอะ รสนุ่ม', en: 'espresso with lots of milk — smooth' },
  'menu.cappuccino': { th: 'เอสเปรสโซ่ + นม + ฟองนมหนา', en: 'espresso, milk and thick milk foam' },
  'menu.mocha': { th: 'เอสเปรสโซ่ + ช็อกโกแลต + นม', en: 'espresso with chocolate and milk' },
  'menu.thai_tea': { th: 'ชาไทยใส่นม สีส้ม (ชาเย็น)', en: 'orange Thai tea with milk' },
  'menu.green_tea': { th: 'ชาเขียวมัทฉะใส่นม', en: 'matcha green tea with milk' },
  'menu.cocoa': { th: 'เครื่องดื่มช็อกโกแลต ไม่มีกาแฟ', en: 'chocolate drink, no coffee' },
};
const VALUES = { temperature: TEMPS, sweetness: SWEETNESS, size: SIZES, milk: MILKS };

// คำลงท้ายของผู้เรียน: ครับ (ผม) หรือ ค่ะ (ดิฉัน)
function pol(text, polite) {
  if (polite !== 'ค่ะ') return text;
  return text.replace(/นะครับ/g, 'นะคะ').replace(/ครับ\?/g, 'คะ?').replace(/ครับ/g, 'ค่ะ').replace(/ผม/g, 'ดิฉัน');
}
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const article = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const drink = (id, lang) => (lang === 'en' ? enName(menuById(id)) : menuById(id).th);

const T = {
  th: {
    item: 'บาริสต้าถามว่าจะสั่งเครื่องดื่มอะไร — บอกชื่อเมนู หรือแตะที่ป้ายเมนูก็ได้',
    slot: (label) => `บาริสต้าถามเรื่อง "${label}" — ตอบสั้นๆ ได้เลย เลือกประโยคด้านล่าง`,
    done: 'สั่งสำเร็จแล้ว! 🎉 กดปุ่ม "สรุปผล" เพื่อดูคะแนน',
    allergyWarn: '⚠️ ภารกิจนี้คุณแพ้นมวัว — อย่าลืมบอกบาริสต้า และขอเปลี่ยนเป็นนมทางเลือก',
    mismatch: (xs) => `⚠️ ยังไม่ตรงกับภารกิจ: ${xs} — บอกบาริสต้าเพื่อแก้ได้เลย`,
    missionOk: '✅ ที่สั่งไปตรงกับภารกิจแล้ว',
    sayItem: (n, q) => `ขอ${n}${q > 1 ? ` ${q} แก้ว` : ''}ครับ`,
    sayAllergyItem: (n, m, q) => `ผมแพ้นมวัวครับ ขอ${n} เปลี่ยนเป็น${m}${q > 1 ? ` ${q} แก้ว` : ''}ครับ`,
    sayAllergy: (m) => `ผมแพ้นมวัวครับ ขอเปลี่ยนเป็น${m}ครับ`,
    sayValue: (v) => `${v}ครับ`,
    sayChange: (v) => `ขอเปลี่ยนเป็น${v}ครับ`,
    sayQty: (q) => `เอา ${q} แก้วครับ`,
    sayMenu: 'มีเมนูอะไรแนะนำบ้างครับ?',
    sayThanks: 'ขอบคุณครับ',
    sayFull: (d) => `ขอ${d}ครับ`,
    sayFullAllergy: (d) => `ผมแพ้นมวัวครับ ขอ${d}ครับ`,
    // ผู้เรียนเป็นพนักงาน
    sGreet: 'เริ่มจากทักทายลูกค้า แล้วถามว่ารับอะไรดี',
    sAllergy: 'ลูกค้าบอกว่าแพ้นมวัว — ยืนยันว่าจะไม่ใช้นมวัว และเสนอนมโอ๊ต/นมถั่วเหลือง',
    sAsk: (xs) => `ยังไม่รู้: ${xs} — ถามลูกค้า (ถามหลายเรื่องในประโยคเดียวได้คะแนนดี)`,
    sAskAllergy: 'ถามเรื่องอาการแพ้ก่อนทวน เพื่อความปลอดภัย',
    sMore: 'ถามว่าลูกค้าต้องการอะไรเพิ่มไหม (ลูกค้าอาจมีคำขอพิเศษ)',
    sReadback: 'ได้ข้อมูลครบแล้ว — ทวนออเดอร์ให้ลูกค้าฟัง',
    sPrice: 'ทวนถูกแล้ว — บอกยอดเงินรวม (ดูวิธีคิดด้านล่าง)',
    sDone: 'ขายสำเร็จ! 🎉 กดปุ่ม "สรุปผล" เพื่อดูคะแนน',
    tGreet: 'สวัสดีครับ ยินดีต้อนรับครับ รับอะไรดีครับ?',
    tAllergy: 'ได้ครับ ทางร้านจะไม่ใช้นมวัว รับเป็นนมโอ๊ตหรือนมถั่วเหลืองดีครับ?',
    tAsk: {
      temperature: (temps) => `รับ${temps.map((k) => TEMPS[k].th).join(' ')}ดีครับ?`.replace(/ (\S+)ดีครับ\?$/, ' หรือ$1ดีครับ?'),
      sweetness: () => 'ความหวานรับระดับไหนดีครับ?',
      size: () => 'รับไซส์ปกติหรือไซส์ใหญ่ดีครับ?',
      milk: () => 'รับนมโอ๊ตหรือนมถั่วเหลืองดีครับ?',
    },
    tQty: 'รับกี่แก้วดีครับ?',
    tAskAllergy: 'มีอาการแพ้อะไรไหมครับ?',
    tMore: 'รับอะไรเพิ่มไหมครับ?',
    tAll: 'ถามรวดเดียว',
    tReadback: (d) => `ขอทวนออเดอร์นะครับ ${d} ถูกต้องไหมครับ?`,
    tPrice: (p) => `ทั้งหมด ${p} บาทครับ`,
    base: 'ราคาเมนู',
  },
  en: {
    item: 'The barista is asking what you would like — say the drink name, or tap the menu board',
    slot: (label) => `The barista is asking about "${label}" — a short answer is fine, pick one below`,
    done: 'Order complete! 🎉 Press "Debrief" to see your score',
    allergyWarn: "⚠️ In this mission you're allergic to dairy — tell the barista and ask for a non-dairy milk",
    mismatch: (xs) => `⚠️ Not what your mission needs: ${xs} — tell the barista to change it`,
    missionOk: '✅ What you ordered matches your mission',
    sayItem: (n, q) => (q > 1 ? `Could I have ${q === 2 ? 'two' : q} ${n}s, please?` : `Could I have ${article(n)} ${n}, please?`),
    sayAllergyItem: (n, m, q) => `I'm allergic to dairy. Could I have ${q > 1 ? `${q === 2 ? 'two' : q} ${n}s` : `${article(n)} ${n}`} with ${m}, please?`,
    sayAllergy: (m) => `I'm allergic to dairy. Could I have ${m} instead?`,
    sayValue: (v) => `${cap(v)}, please.`,
    sayChange: (v) => `Could I change it to ${v}, please?`,
    sayQty: (q) => `${cap(q === 2 ? 'two' : String(q))} cups, please.`,
    sayMenu: 'What do you recommend?',
    sayThanks: 'Thank you!',
    sayFull: (d) => `Could I have ${d}, please?`,
    sayFullAllergy: (d) => `I'm allergic to dairy. Could I have ${d}, please?`,
    sGreet: 'Start by greeting the customer and asking what they would like',
    sAllergy: "The customer is allergic to dairy — confirm you won't use dairy and offer oat or soy milk",
    sAsk: (xs) => `Still unknown: ${xs} — ask the customer (asking several at once scores well)`,
    sAskAllergy: 'Ask about allergies before the read-back — safety first',
    sMore: 'Ask if they would like anything else (they may have a special request)',
    sReadback: 'You have everything — read the order back to the customer',
    sPrice: 'Read-back confirmed — now state the total (see how it adds up below)',
    sDone: 'Sale complete! 🎉 Press "Debrief" to see your score',
    tGreet: 'Hi, welcome! What can I get for you?',
    tAllergy: "Of course — we won't use dairy. Would you like oat milk or soy milk?",
    tAsk: {
      temperature: (temps) => `Would you like it ${temps.map((k) => TEMPS[k].en).join(', ').replace(/, ([^,]+)$/, ' or $1')}?`,
      sweetness: () => 'How sweet would you like it?',
      size: () => 'Regular or large size?',
      milk: () => 'Oat milk or soy milk?',
    },
    tQty: 'How many would you like?',
    tAskAllergy: 'Do you have any allergies?',
    tMore: 'Anything else?',
    tAll: 'Ask all at once',
    tReadback: (d) => `Let me read that back: ${d}. Is that correct?`,
    tPrice: (p) => `That's ${p} baht, please.`,
    base: 'Menu price',
  },
};

// ---------------------------------------------------------------- 📖 คำศัพท์ในประโยคล่าสุด
function glossary(text, lang, focusGroup = null) {
  const low = String(text || '').toLowerCase();
  const other = lang === 'en' ? 'th' : 'en';
  const out = [];
  const seen = new Set();
  const add = (key, term, alt) => {
    if (seen.has(key) || out.length >= 6) return;
    seen.add(key);
    out.push({ term, other: alt, meaning: GLOSS[key]?.[lang] || '' });
  };
  // กลุ่มที่กำลังถาม: อธิบายทุกตัวเลือก
  if (focusGroup && VALUES[focusGroup]) {
    for (const [v, d] of Object.entries(VALUES[focusGroup])) add(`${focusGroup}.${v}`, d[lang], d[other]);
  }
  for (const [g, vals] of Object.entries(VALUES)) {
    for (const [v, d] of Object.entries(vals)) {
      const names = [d.th, d.en.toLowerCase()];
      if (g === 'temperature') names.push(...(v === 'frappe' ? ['frappe', 'frappé', 'ปั่น'] : []));
      if (names.some((n) => n.length > 2 && low.includes(n.toLowerCase()))) add(`${g}.${v}`, d[lang], d[other]);
    }
  }
  for (const it of MENU) {
    if (low.includes(it.th.toLowerCase()) || low.includes(it.en.toLowerCase())) add(`menu.${it.id}`, `${it.emoji} ${it[lang]}`, it[other]);
  }
  return out;
}

// ---------------------------------------------------------------- โหมดลูกค้า (ผู้เรียนสั่ง)
function fullOrderSentence(target, lang) {
  const S = T[lang];
  const o = { ...emptyOrder(), ...target };
  const d = describeOrder(o, lang);
  return o.milk && o.milk !== 'dairy' ? S.sayFullAllergy(d) : S.sayFull(d);
}

function assistCustomer(payload, lang) {
  const S = T[lang];
  const order = { ...emptyOrder(), ...(payload.order_state || {}) };
  const mission = MISSIONS.find((m) => m.id === payload.mission_id) || null;
  const target = mission?.target || null;
  const history = payload.dialogue_history || [];
  const lastLine = [...history].reverse().find((h) => h.role === 'barista')?.content || openingLine(lang);
  const userTurns = history.filter((h) => h.role === 'user').length;
  // สล็อตที่บาริสต้ากำลังถาม — ใช้กติกาเดียวกับ ruleEngine
  const slot = order.is_complete ? 'done' : userTurns || order.item ? missingSlots(order)[0] || 'done' : 'item';
  const needOat = target?.milk && target.milk !== 'dairy';

  const warnings = [];
  const suggestions = [];
  const push = (text, star = false) => { if (!suggestions.some((s) => s.text === text)) suggestions.push({ text: pol(text, payload.polite), star }); };
  const sameItem = target && order.item === target.item;

  if (needOat && slot !== 'done' && !order.allergy) warnings.push(S.allergyWarn);

  // ผิดจากภารกิจ → เสนอประโยคแก้ไขทันที (ก่อนตอบคำถามถัดไป)
  if (target && slot !== 'done' && order.item) {
    const wrong = [];
    if (!sameItem) wrong.push({ text: drink(target.item, lang), say: fullOrderSentence(target, lang) });
    else {
      for (const g of ['temperature', 'sweetness', 'size', 'milk']) {
        const want = target[g];
        if (want && order[g] && order[g] !== want) wrong.push({ text: valName(g, want, lang), say: S.sayChange(valName(g, want, lang)) });
      }
      if (needOat && !order.milk && slot !== 'milk') wrong.push({ text: valName('milk', target.milk, lang), say: S.sayAllergy(valName('milk', target.milk, lang)) });
      if ((target.quantity || 1) !== (order.quantity || 1)) wrong.push({ text: `${target.quantity} ${lang === 'en' ? 'cups' : 'แก้ว'}`, say: S.sayQty(target.quantity) });
    }
    if (wrong.length) warnings.push(S.mismatch(wrong.map((w) => w.text).join(', ')));
    wrong.forEach((w) => push(w.say, true));
    if (!wrong.length && Object.keys(target).some((k) => order[k])) warnings.push(S.missionOk);
  }

  let situation;
  let focusGroup = null;
  if (slot === 'done') {
    situation = S.done;
    push(S.sayThanks);
  } else if (slot === 'item') {
    situation = S.item;
    if (target) {
      const n = drink(target.item, lang);
      push(needOat ? S.sayAllergyItem(n, valName('milk', target.milk, lang), target.quantity) : S.sayItem(n, target.quantity), true);
    }
    MENU.slice(0, 4).forEach((it) => push(S.sayItem(drink(it.id, lang), 1)));
    push(S.sayMenu);
  } else {
    focusGroup = slot;
    situation = S.slot(`${groupLabel(slot, lang)}${lang === 'th' ? ` (${groupLabel(slot, 'en')})` : ''}`);
    const it = menuById(order.item);
    const values = slot === 'temperature' ? it.temps : slot === 'milk' ? ['oat', 'soy'] : Object.keys(VALUES[slot]);
    const want = sameItem ? target[slot] : null;
    for (const v of values) push(S.sayValue(valName(slot, v, lang)), want === v);
  }

  // 🎯 ประโยคเต็ม: ออเดอร์ตามภารกิจทั้งหมดในประโยคเดียว
  let model = null;
  if (target && slot !== 'done') model = pol(fullOrderSentence(target, lang), payload.polite);
  else if (slot !== 'item' && slot !== 'done' && suggestions.length) model = suggestions.find((s) => s.star)?.text || null;

  return {
    mode: 'customer', slot, situation, warnings, suggestions,
    glossary: glossary(lastLine, lang, focusGroup), model, price: [], last_line: lastLine,
  };
}

// ---------------------------------------------------------------- โหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน)
function assistStaff(payload, lang) {
  const S = T[lang];
  const st = payload.customer_state;
  const t = st.target;
  const it = menuById(t.item);
  const history = payload.dialogue_history || [];
  const lastLine = [...history].reverse().find((h) => h.role === 'customer')?.content || '';
  const suggestions = [];
  const warnings = [];
  const push = (text, star = false, label) => { if (!suggestions.some((s) => s.text === pol(text, payload.polite))) suggestions.push({ text: pol(text, payload.polite), star, ...(label ? { label } : {}) }); };
  const notAsked = requiredGroups(st, true).filter((g) => !st.revealed.options[g]);
  const extrasPending = st.profile.pref_milk && !st.revealed.options.milk && !st.more_asked;
  let situation;
  let price = [];

  if (st.phase === 'done') {
    situation = S.sDone;
  } else if (!st.greeted && st.turns === 0) {
    situation = S.sGreet;
    push(S.tGreet, true);
  }
  if (st.phase !== 'done') {
    if (st.revealed.allergy && !st.allergy_ack) {
      situation = situation || S.sAllergy;
      push(S.tAllergy, true);
    }
    if (notAsked.length || !st.revealed.quantity) {
      const labels = [...notAsked.map((g) => groupLabel(g, lang)), ...(st.revealed.quantity ? [] : [lang === 'en' ? 'quantity' : 'จำนวน'])];
      situation = situation || S.sAsk(labels.join(', '));
      const qs = notAsked.map((g) => S.tAsk[g](it.temps));
      if (!st.revealed.quantity) qs.push(S.tQty);
      if (qs.length > 1) push(qs.join(' '), true, S.tAll);
      qs.forEach((q) => push(q, qs.length === 1));
    } else if (!st.readback_ok) {
      if (!st.allergy_asked && !st.revealed.allergy) { situation = situation || S.sAskAllergy; push(S.tAskAllergy, true); }
      if (extrasPending) { situation = situation || S.sMore; push(S.tMore, true); }
      situation = situation || S.sReadback;
      // ทวนเฉพาะสิ่งที่ลูกค้าบอกแล้ว (นมทางเลือก: เมื่อรู้แล้วเท่านั้น)
      const known = { ...t, milk: st.revealed.options.milk ? t.milk : null };
      push(S.tReadback(describeOrder(known, lang)), true);
    } else {
      situation = situation || S.sPrice;
      push(S.tPrice(unitPrice(t) * (t.quantity || 1)), true);
      price = priceBreakdown(t, lang);
    }
    if (!st.revealed.allergy && !st.allergy_asked && (notAsked.length || !st.revealed.quantity)) push(S.tAskAllergy);
  }

  return {
    mode: 'staff', situation, warnings, suggestions, glossary: glossary(lastLine, lang),
    model: suggestions.find((s) => s.star)?.text || null, price, last_line: lastLine,
  };
}

// ขั้นตอนคิดเงิน: ราคาเมนู + เย็น/ปั่น + ไซส์ + นมทางเลือก × จำนวน
export function priceBreakdown(t, lang) {
  const S = T[lang];
  const it = menuById(t.item);
  const lines = [`${S.base} ${it[lang]} ${it.price}`];
  for (const g of ['temperature', 'size', 'milk']) {
    const x = VALUES[g][t[g]]?.extra;
    if (x) lines.push(`+ ${valName(g, t[g], lang)} ${x}`);
  }
  const unit = unitPrice(t);
  const q = t.quantity || 1;
  lines.push(q > 1 ? `= ${unit} × ${q} = ${unit * q}` : `= ${unit}`);
  return lines;
}

export function buildAssist(payload) {
  const lang = payload.language === 'en' ? 'en' : 'th';
  return payload.mode === 'staff' && payload.customer_state ? assistStaff(payload, lang) : assistCustomer(payload, lang);
}
