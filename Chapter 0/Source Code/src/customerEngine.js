// โหมดสลับบทบาท (Role Swap): AI เป็น "ลูกค้า" — ผู้เรียนเป็น "พนักงาน/บาริสต้า"
// ลูกค้ามีออเดอร์ในใจ (target) ที่บอกไม่หมดตั้งแต่แรก ผู้เรียนต้อง: ทักทาย → ถามรายละเอียดให้ครบ →
// ดูแลเรื่องแพ้นมวัว (เปลี่ยนเป็นนมโอ๊ต/ถั่วเหลือง) → ทวนออเดอร์ให้ถูก → บอกราคาให้ถูก
// ไฟล์นี้เป็น ESM ล้วน ไม่มี node: import — ใช้ได้ทั้งบนเซิร์ฟเวอร์และในเบราว์เซอร์ (โหมด Offline บน GitHub Pages)
import {
  MENU, MISSIONS, TEMPS, SWEETNESS, SIZES, MILKS, NO_MILK_ITEMS, menuById, enName, emptyOrder, totalPrice, describeOrder,
} from './menu.js';
import { parseUtterance } from './nlu.js';

const pick = (xs, rng) => xs[Math.floor(rng() * xs.length)];
const has = (t, words) => words.some((w) => t.includes(w));
const VALUES = { temperature: TEMPS, sweetness: SWEETNESS, size: SIZES, milk: MILKS };
const GROUP_LABEL = {
  temperature: { th: 'ร้อน/เย็น/ปั่น', en: 'hot/iced/frappé' },
  sweetness: { th: 'ความหวาน', en: 'sweetness' },
  size: { th: 'ไซส์', en: 'size' },
  milk: { th: 'นม', en: 'milk' },
};
export const valName = (g, v, lang) => VALUES[g]?.[v]?.[lang] || '';
export const groupLabel = (g, lang) => GROUP_LABEL[g][lang];
export const hasMilk = (itemId) => !NO_MILK_ITEMS.includes(itemId);
const article = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

const L = {
  th: {
    open: (item, opt, q) => `สวัสดีครับ ขอ${item}${opt ? ` ${opt}` : ''}${q > 1 ? ` ${q} แก้ว` : ''}ครับ`,
    openAllergy: ' อ้อ ผมแพ้นมวัวนะครับ',
    greetBack: 'สวัสดีครับ',
    value: (v) => `${v}ครับ`,
    again: (v) => `เมื่อกี้บอกไปแล้วครับ ${v}`,
    notApplicable: 'เอ๊ะ เมนูนี้ต้องเลือกเรื่องนั้นด้วยเหรอครับ?',
    item: (item) => `ขอ${item}ครับ`,
    qty: (q) => `${q} แก้วครับ`,
    more: (x) => `ขอเปลี่ยนเป็น${x}ด้วยครับ`,
    noMore: 'ไม่มีแล้วครับ แค่นี้ครับ',
    allergy: 'ผมแพ้นมวัวครับ',
    noAllergy: 'ไม่แพ้อะไรครับ',
    allergyThanks: 'ขอบคุณครับ ช่วยระวังเรื่องนมวัวให้ด้วยนะครับ',
    wrong: (xs) => `ไม่ใช่ครับ ${xs}ครับ`,
    missing: (xs) => `แล้วก็${xs}ด้วยนะครับ`,
    forgotAllergy: (m) => `อย่าลืมนะครับ ผมแพ้นมวัว ขอเป็น${m}ครับ`,
    correct: 'ถูกต้องครับ',
    askPrice: 'ทั้งหมดเท่าไหร่ครับ?',
    pay: (p) => `นี่ครับ ${p} บาท ขอบคุณครับ 😊`,
    readbackFirst: 'ได้ครับ แต่ช่วยทวนออเดอร์ให้ฟังก่อนได้ไหมครับ กลัวสั่งผิด',
    priceWrong: (p) => `เอ๊ะ ${p} บาทเหรอครับ? รบกวนเช็คราคาอีกทีได้ไหมครับ`,
    priceHint: (p) => `ผมลองดูจากป้ายเมนูแล้ว น่าจะเป็น ${p} บาทนะครับ`,
    confused: 'ขอโทษครับ? ไม่ค่อยเข้าใจครับ',
    waiting: 'ครับ',
    done: 'ขอบคุณครับ 😊',
    list: (xs) => xs.join(' '),
  },
  en: {
    open: (item, opt, q) => `Hi! Could I get ${q > 1 ? `${q === 2 ? 'two' : q} ${item}s` : `${article(item)} ${item}`}${opt ? `, ${opt}` : ''}, please?`,
    openAllergy: " Oh, and I'm allergic to dairy.",
    greetBack: 'Hello!',
    value: (v) => `${v[0].toUpperCase()}${v.slice(1)}, please.`,
    again: (v) => `I already said — ${v}.`,
    notApplicable: 'Hmm, is that something I need to choose for this one?',
    item: (item) => `I'd like ${article(item)} ${item}, please.`,
    qty: (q) => (q === 1 ? 'Just one, please.' : `${q}, please.`),
    more: (x) => `Could I have it with ${x}, please?`,
    noMore: "No, that's everything.",
    allergy: "I'm allergic to dairy.",
    noAllergy: 'No allergies.',
    allergyThanks: 'Thank you — please be careful with the milk.',
    wrong: (xs) => `No, sorry — ${xs}.`,
    missing: (xs) => `And ${xs}, please.`,
    forgotAllergy: (m) => `Please don't forget — I'm allergic to dairy, so ${m}.`,
    correct: "That's right.",
    askPrice: 'How much is that?',
    pay: (p) => `Here's ${p} baht. Thank you! 😊`,
    readbackFirst: 'Sure — but could you read my order back first? I want to be sure.',
    priceWrong: (p) => `${p} baht? Could you double-check that, please?`,
    priceHint: (p) => `I checked the menu board — I think it should be ${p} baht.`,
    confused: "Sorry? I didn't quite get that.",
    waiting: 'Okay.',
    done: 'Thanks! 😊',
    list: (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`),
  },
};

// ---------------------------------------------------------------- สร้างลูกค้า
// กลุ่มตัวเลือกที่พนักงาน "ต้องถาม" สำหรับเมนูนี้ (นม: ต้องถามเมื่อรู้ว่าลูกค้าแพ้นมวัว)
export function requiredGroups(st, knownOnly = false) {
  const t = st.target;
  const it = menuById(t.item);
  const gs = [];
  if (it.temps.length > 1) gs.push('temperature');
  gs.push('sweetness', 'size');
  if (st.profile.allergy && (!knownOnly || st.revealed.allergy)) gs.push('milk');
  return gs;
}

export function generateCustomer(rng = Math.random) {
  const target = emptyOrder();
  const profile = { allergy: false, pref_milk: false };
  if (rng() < 0.5) {
    const m = pick(MISSIONS, rng);
    Object.assign(target, m.target);
    if (m.target.milk && m.target.milk !== 'dairy') profile.allergy = true;
  } else {
    const it = pick(MENU, rng);
    target.item = it.id;
    target.temperature = pick(it.temps, rng);
    target.sweetness = pick(Object.keys(SWEETNESS), rng);
    target.size = pick(Object.keys(SIZES), rng);
    target.quantity = rng() < 0.25 ? 2 : 1;
    // ลูกค้าบางคนแพ้นมวัว (ต้องเปลี่ยนนม) หรือแค่ชอบนมทางเลือก (บอกเมื่อพนักงานถามว่า "รับอะไรเพิ่มไหม")
    if (hasMilk(it.id)) {
      const r = rng();
      if (r < 0.3) profile.allergy = true;
      else if (r < 0.5) profile.pref_milk = true;
      if (profile.allergy || profile.pref_milk) target.milk = pick(['oat', 'soy'], rng);
    }
  }
  if (!hasMilk(target.item)) { target.milk = null; profile.allergy = false; }
  target.allergy = profile.allergy;
  target.is_complete = false;
  return {
    target, profile,
    revealed: { item: false, quantity: target.quantity === 1, options: {}, allergy: false },
    greeted: false, allergy_asked: false, allergy_ack: false, more_asked: false,
    readback_ok: false, readback_errors: 0, price_errors: 0, repeats: 0, phase: 'ordering', turns: 0,
  };
}

const itemText = (t, lang) => (lang === 'en' ? enName(menuById(t.item)) : menuById(t.item).th);

// ประโยคเปิดของลูกค้า: บอกเมนู (+ อาจบอกตัวเลือก 1 อย่าง / อาการแพ้)
export function openCustomer(st, lang, rng = Math.random) {
  const S = L[lang];
  const t = st.target;
  st.revealed.item = true;
  if (t.quantity > 1) st.revealed.quantity = true;
  const free = requiredGroups(st).filter((g) => g !== 'milk');
  let item = itemText(t, lang);
  let opt = '';
  if (rng() < 0.4) {
    const g = pick(free, rng);
    st.revealed.options[g] = true;
    if (g === 'temperature') item = lang === 'en' ? `${TEMPS[t.temperature].en} ${item}` : item + TEMPS[t.temperature].th;
    else opt = valName(g, t[g], lang);
  }
  let line = S.open(item, opt, t.quantity);
  if (st.profile.allergy && rng() < 0.6) { st.revealed.allergy = true; line += S.openAllergy; }
  return line;
}

// ---------------------------------------------------------------- เข้าใจสิ่งที่ "พนักงาน" (ผู้เรียน) พูด
const QUESTION = /(ไหม|มั้ย|หรือ|ไหน|อะไร|ยังไง|เท่าไหร่|กี่|ดี\s*(ครับ|คะ|ค่ะ)|\?|which|would you|what|how|do you|anything|any )/;
// คำที่บอกว่ากำลังถามเรื่องนั้น (ตรวจหลังตัดชื่อเมนูออกแล้ว กัน "ชาเย็น"/"ชาเขียวนม"/"hot chocolate" ชน)
const ASK = {
  temperature: ['ร้อน', 'เย็น', 'ปั่น', 'อุณหภูมิ', 'hot', 'iced', 'ice', 'cold', 'frapp', 'blended', 'warm'],
  sweetness: ['หวาน', 'น้ำตาล', 'sweet', 'sugar'],
  size: ['ไซส์', 'ขนาด', 'แก้วใหญ่', 'size', 'large', 'regular', 'small', 'big'],
  milk: ['นมอะไร', 'นมแบบไหน', 'นมชนิด', 'นมโอ๊ต', 'นมถั่วเหลือง', 'นมวัว', 'โอ๊ต', 'ถั่วเหลือง', 'oat', 'soy', 'dairy', 'which milk', 'what milk', 'kind of milk', 'type of milk', 'any milk'],
};
const ITEM_KWS = MENU.flatMap((m) => m.keywords).sort((a, b) => b.length - a.length);
const cue = (t, w) => (/[a-z]/.test(w) ? new RegExp(`(^|[^a-z])${w}`).test(t) : t.includes(w));

function readStaff(st, text) {
  const t = st.target;
  const p = parseUtterance(text, null);
  const low = p.text;
  let rest = low;
  for (const kw of ITEM_KWS) rest = rest.split(kw).join(' ');
  const isQuestion = QUESTION.test(low.replace(/สวัสดี/g, ''));
  const askQty = has(low, ['กี่แก้ว', 'กี่ที่', 'how many']);
  const applicable = ['temperature', 'sweetness', 'size', ...(hasMilk(t.item) ? ['milk'] : [])];
  const cueGroups = Object.keys(ASK).filter((g) => p.mentions[g].length || ASK[g].some((w) => cue(rest, w)));
  const askedGroups = isQuestion
    ? cueGroups.filter((g) => applicable.includes(g) && !(g === 'temperature' && menuById(t.item).temps.length === 1))
    : [];
  // ถามเรื่องที่เมนูนี้ไม่มีให้เลือก เช่น ถามนมกับอเมริกาโน่ หรือถามร้อน/เย็นกับเอสเปรสโซ่
  const irrelevant = isQuestion && cueGroups.some((g) => !askedGroups.includes(g));
  const price = (() => {
    const m = low.match(/(\d[\d,]*)\s*(บาท|baht|฿|thb)/) || low.match(/(?:ทั้งหมด|total|รวม|that'?s|comes to)\D{0,12}(\d[\d,]*)/);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  })();
  // คำถามให้เลือก เช่น "ร้อนหรือเย็นครับ" = พูดถึง 2 ค่าในกลุ่มเดียวกัน → ไม่ใช่การทวนออเดอร์
  const rbCue = has(low, ['ทวน', 'ถูกต้องไหม', 'ถูกต้องมั้ย', 'ถูกไหม', 'ใช่ไหม', 'นะครับ', 'นะคะ', 'read that back', 'read back', 'is that correct', 'is that right', 'correct?', 'right?']);
  const choiceQuestion = isQuestion && !rbCue && Object.values(p.mentions).some((xs) => xs.length >= 2);
  const optCount = Object.values(p.mentions).filter((xs) => xs.length).length;
  // คำถามที่เอ่ยชื่อเมนู เช่น "ลาเต้รับหวานระดับไหนครับ?" ไม่ใช่การทวน — การทวนต้องเป็นประโยคบอกเล่า หรือมีคำชวนยืนยัน
  const readback = !!p.item && !choiceQuestion && (rbCue || !isQuestion) && (optCount >= 1 || price != null || !!p.quantity);
  const allergyHandled = st.profile.allergy && (p.mentions.milk.some((m) => m !== 'dairy')
    || has(low, ['ไม่ใส่นมวัว', 'ไม่ใช้นมวัว', 'งดนมวัว', 'ไม่ใส่นม', 'ระวัง', 'no dairy', 'dairy-free', 'dairy free', 'non-dairy', "won't use dairy", 'without dairy', 'careful']));
  const askMore = has(low, ['อะไรเพิ่ม', 'เพิ่มเติม', 'อะไรอีก', 'อย่างอื่น', 'anything else', 'something else', 'anything more']);
  // ถามซ้ำเพื่อยืนยันค่าที่รู้อยู่แล้ว (เช่น "ลาเต้เย็นรับหวานแค่ไหนครับ") ไม่นับเป็นการถามซ้ำ
  const confirmOnly = (g) => st.revealed.options[g] && p.mentions[g].length === 1 && p.mentions[g][0] === (t[g] || (g === 'milk' ? 'dairy' : null));
  const asked = askedGroups.filter((g) => !confirmOnly(g));
  return {
    p, low, isQuestion, askQty, irrelevant, price, readback, allergyHandled, askMore,
    askedGroups: asked,
    greet: p.greeting || has(low, ['ยินดีต้อนรับ', 'welcome', 'good afternoon', 'good evening']),
    askItem: !askMore && !asked.length && has(low, ['รับอะไร', 'อะไรดี', 'สั่งอะไร', 'what would you like', 'what can i get', 'what can i do for you', "what'll it be"]),
    askAllergy: has(low, ['แพ้', 'allerg']) && isQuestion,
  };
}

// ส่วนประกอบของออเดอร์ที่ต้องทวน: เมนู + ตัวเลือก (+ นมทางเลือก)
function components(st) {
  const t = st.target;
  return ['item', ...requiredGroups(st).filter((g) => g !== 'milk'), ...(t.milk && t.milk !== 'dairy' ? ['milk'] : [])];
}

function partText(st, key, lang) {
  const t = st.target;
  if (key === 'item') return itemText(t, lang);
  if (key === 'qty') return lang === 'en' ? `${t.quantity} cups` : `${t.quantity} แก้ว`;
  return valName(key, t[key] || 'dairy', lang);
}

// ---------------------------------------------------------------- เทิร์นของลูกค้า
export function customerTurn(payload) {
  const lang = payload.language === 'en' ? 'en' : 'th';
  const S = L[lang];
  const st = JSON.parse(JSON.stringify(payload.customer_state));
  const t = st.target;
  const turn = payload.current_turn || {};
  const text = [turn.user_speech, turn.user_text].filter((x) => x && x.trim()).join(' ');
  const r = readStaff(st, text);
  const out = [];
  const ev = { newInfo: [], repeats: [], irrelevant: r.irrelevant, readback: null, price: null, allergyHandled: false, greeted: false };
  st.turns += 1;

  if (st.phase === 'done') return result(st, S.done, 'serving', r, ev, lang);

  if (r.greet && !st.greeted) { st.greeted = true; ev.greeted = true; if (!r.readback && !r.askedGroups.length) out.push(S.greetBack); }
  if (r.askItem) out.push(S.item(itemText(t, lang)));

  // ตอบคำถามทีละเรื่อง
  for (const g of r.askedGroups) {
    if (r.readback) break;
    const v = valName(g, t[g] || (g === 'milk' ? 'dairy' : null), lang);
    if (st.revealed.options[g]) { out.push(S.again(v)); ev.repeats.push(g); st.repeats += 1; } else { st.revealed.options[g] = true; ev.newInfo.push(g); out.push(S.value(v)); }
  }
  if (r.irrelevant && !r.askedGroups.length && !r.readback) out.push(S.notApplicable);
  if (r.askQty) {
    if (!st.revealed.quantity) ev.newInfo.push('quantity');
    st.revealed.quantity = true;
    out.push(S.qty(t.quantity));
  }
  if (r.askMore) {
    st.more_asked = true;
    if (st.profile.pref_milk && !st.revealed.options.milk) {
      st.revealed.options.milk = true;
      ev.newInfo.push('milk');
      out.push(S.more(valName('milk', t.milk, lang)));
    } else out.push(S.noMore);
  }
  if (r.askAllergy) {
    st.allergy_asked = true;
    if (st.profile.allergy) {
      if (!st.revealed.allergy) ev.newInfo.push('allergy');
      st.revealed.allergy = true;
      out.push(S.allergy);
    } else out.push(S.noAllergy);
  }
  if (r.allergyHandled && st.revealed.allergy && !st.allergy_ack) { st.allergy_ack = true; ev.allergyHandled = true; out.push(S.allergyThanks); }

  // ทวนออเดอร์
  if (r.readback) {
    const comps = components(st);
    const m = r.p.mentions;
    const wrong = [];
    if (r.p.item !== t.item) wrong.push('item');
    for (const g of ['temperature', 'sweetness', 'size', 'milk']) {
      if (g === 'milk' && !hasMilk(t.item)) continue;
      const want = t[g] || (g === 'milk' ? 'dairy' : null);
      // พูดหลายค่า แต่มีค่าที่ถูกอยู่ด้วย (เช่น "เย็น... น้ำแข็ง") ไม่นับว่าผิด
      if (m[g].length && want && !m[g].includes(want)) wrong.push(g);
    }
    if (r.p.quantity && r.p.quantity !== t.quantity) wrong.push('qty');
    const missing = comps.filter((c) => c !== 'item' && !m[c].length && !wrong.includes(c));
    if (t.quantity > 1 && !r.p.quantity) missing.push('qty');
    const txt = (xs) => S.list(xs.map((c) => partText(st, c, lang)));
    if (wrong.length || missing.length) {
      st.readback_errors += 1;
      ev.readback = { ok: false, wrong, missing };
      if (wrong.length) out.push(S.wrong(txt(wrong)));
      const safetyMiss = st.profile.allergy && (missing.includes('milk') || wrong.includes('milk'));
      if (safetyMiss && missing.includes('milk')) out.push(S.forgotAllergy(partText(st, 'milk', lang)));
      const otherMiss = missing.filter((c) => !(safetyMiss && c === 'milk'));
      if (otherMiss.length) out.push(S.missing(txt(otherMiss)));
      [...wrong, ...missing].forEach((c) => { if (c === 'qty') st.revealed.quantity = true; else if (c !== 'item') st.revealed.options[c] = true; });
      if (safetyMiss) st.revealed.allergy = true;
    } else {
      st.readback_ok = true;
      ev.readback = { ok: true, wrong: [], missing: [] };
      out.push(S.correct);
      if (r.price == null) out.push(S.askPrice);
    }
  }

  // ราคา
  if (r.price != null) {
    const expected = totalPrice(t);
    if (r.price === expected) {
      ev.price = { ok: true, expected, stated: r.price };
      if (st.readback_ok) { st.phase = 'done'; t.is_complete = true; out.push(S.pay(expected)); } else if (!r.readback) out.push(S.readbackFirst);
    } else {
      st.price_errors += 1;
      ev.price = { ok: false, expected, stated: r.price };
      out.push(S.priceWrong(r.price));
      if (st.price_errors >= 2) out.push(S.priceHint(expected));
    }
  }

  if (!out.length) out.push(st.readback_ok ? S.askPrice : r.p.empty ? S.waiting : S.confused);
  const action = st.phase === 'done' ? 'making' : ev.readback?.ok === false || ev.price?.ok === false ? 'confused' : ev.newInfo.length ? 'asking' : 'looking';
  return result(st, out.join(' '), action, r, ev, lang);
}

// ---------------------------------------------------------------- โค้ช (ประเมินฝั่งพนักงาน)
const C = {
  th: {
    excellent: 'ดีเยี่ยม', good: 'ดี', improve: 'ต้องปรับปรุง',
    greet: 'ทักทายลูกค้าอย่างเป็นมิตร',
    manyQ: (n) => `ถามรายละเอียดได้ ${n} เรื่องในครั้งเดียว มีประสิทธิภาพมาก`,
    oneQ: 'ถามคำถามเจาะจงได้ตรงประเด็น',
    repeat: 'ถามซ้ำเรื่องที่ลูกค้าบอกไปแล้ว',
    repeatTip: 'ฟังให้ครบ และจดสิ่งที่ลูกค้าบอกไว้ในใบจดออเดอร์',
    irrelevant: 'ถามเรื่องที่เมนูนี้ไม่มีให้เลือก',
    rbOk: 'ทวนออเดอร์ได้ถูกต้องครบถ้วน',
    rbBad: 'ทวนออเดอร์ยังไม่ถูก/ไม่ครบ',
    priceOk: 'บอกราคาได้ถูกต้อง',
    priceBad: (e) => `คิดราคาผิด (ที่ถูกคือ ${e} บาท)`,
    allergyOk: 'รับเรื่องแพ้นมวัว และเสนอนมทางเลือกให้',
    allergyAsked: 'ถามเรื่องอาการแพ้ ใส่ใจความปลอดภัยของลูกค้า',
    allergyTip: 'ลูกค้าแพ้นมวัว — ยืนยันว่าจะไม่ใช้นมวัว และเสนอนมโอ๊ต/นมถั่วเหลือง',
    confused: 'ลูกค้าไม่เข้าใจสิ่งที่พูด',
    confusedTip: 'ลองถามทีละเรื่อง เช่น "รับร้อนหรือเย็นครับ?"',
    ask: (xs) => `ยังไม่ได้ถาม: ${xs}`,
    readbackTip: 'ได้ข้อมูลครบแล้ว ลองทวนออเดอร์ให้ลูกค้าฟัง',
    priceTip: 'ทวนถูกแล้ว บอกยอดรวม เช่น "ทั้งหมด 65 บาทครับ" (ดูราคาจากป้ายเมนู)',
    askMoreTip: 'ลองถาม "รับอะไรเพิ่มไหมครับ?" ลูกค้าอาจมีคำขอพิเศษ',
    politeTip: 'พนักงานควรลงท้ายด้วย "ครับ/ค่ะ" ทุกประโยค',
    doneTip: 'ขายสำเร็จ! 🎉',
  },
  en: {
    excellent: 'Excellent', good: 'Good', improve: 'Needs work',
    greet: 'Greeted the customer warmly',
    manyQ: (n) => `Asked about ${n} details at once — very efficient`,
    oneQ: 'Asked a clear, specific question',
    repeat: 'Asked about something the customer already told you',
    repeatTip: 'Listen carefully and note what the customer already said',
    irrelevant: "Asked about an option this drink doesn't have",
    rbOk: 'Read the order back accurately',
    rbBad: 'The read-back was wrong or incomplete',
    priceOk: 'Stated the correct price',
    priceBad: (e) => `Wrong price (it should be ${e} baht)`,
    allergyOk: 'Acknowledged the dairy allergy and offered a non-dairy milk',
    allergyAsked: "Asked about allergies — good care for the customer's safety",
    allergyTip: "The customer is allergic to dairy — confirm you won't use dairy and offer oat or soy milk",
    confused: "The customer didn't understand",
    confusedTip: 'Ask one thing at a time, e.g. "Hot or iced?"',
    ask: (xs) => `Not asked yet: ${xs}`,
    readbackTip: 'You have everything — read the order back to the customer',
    priceTip: 'Read-back confirmed — now state the total, e.g. "That\'s 65 baht." (prices are on the menu board)',
    askMoreTip: 'Try "Anything else?" — the customer may have a special request',
    politeTip: 'Use "please", "certainly" or "of course" to sound professional',
    doneTip: 'Sale complete! 🎉',
  },
};

function staffCoach(st, r, ev, lang) {
  const c = C[lang];
  const notes = [];
  let tip = '';
  let rating = 'good';
  const politeness = r.p.empty ? null : r.p.politeness;

  if (ev.greeted) notes.push(c.greet);
  const asked = ev.newInfo.length;
  if (asked >= 2) { rating = 'excellent'; notes.push(c.manyQ(asked)); } else if (asked === 1) notes.push(c.oneQ);
  if (ev.repeats.length) { rating = 'improve'; notes.push(c.repeat); tip = c.repeatTip; }
  if (ev.irrelevant) { notes.push(c.irrelevant); if (rating !== 'improve') rating = 'good'; }
  if (ev.allergyHandled) { rating = 'excellent'; notes.push(c.allergyOk); }
  if (r.askAllergy && !ev.newInfo.includes('allergy') && !ev.allergyHandled) notes.push(c.allergyAsked);
  if (ev.readback?.ok) { rating = 'excellent'; notes.push(c.rbOk); }
  if (ev.readback && !ev.readback.ok) { rating = 'improve'; notes.push(c.rbBad); }
  if (ev.price?.ok) notes.push(c.priceOk);
  if (ev.price && !ev.price.ok) { rating = 'improve'; notes.push(c.priceBad(ev.price.expected)); }
  if (!notes.length && !r.p.empty) { rating = 'improve'; notes.push(c.confused); tip = c.confusedTip; }

  // คำแนะนำขั้นต่อไป (Scaffold)
  if (!tip) {
    const notAsked = requiredGroups(st, true).filter((g) => !st.revealed.options[g]).map((g) => groupLabel(g, lang));
    if (!st.revealed.quantity) notAsked.push(lang === 'en' ? 'quantity' : 'จำนวน');
    if (st.phase === 'done') tip = c.doneTip;
    else if (st.revealed.allergy && !st.allergy_ack) tip = c.allergyTip;
    else if (notAsked.length) tip = c.ask(notAsked.join(', '));
    else if (st.readback_ok) tip = c.priceTip;
    else if (st.profile.pref_milk && !st.revealed.options.milk) tip = c.askMoreTip;
    else tip = c.readbackTip;
  }
  if (politeness != null && politeness < 100 && rating !== 'improve' && lang === 'th') tip = tip || c.politeTip;

  const clarity = r.p.empty ? 0 : Math.min(100, 50 + asked * 20 + (ev.readback?.ok ? 40 : 0) + (ev.price?.ok ? 20 : 0) - ev.repeats.length * 20);
  return {
    rating, label: c[rating], notes, tip, politeness, clarity: Math.max(0, clarity),
    flags: {
      greeted: ev.greeted, new_info: ev.newInfo, repeats: ev.repeats.length, readback_ok: !!ev.readback?.ok,
      readback_bad: !!(ev.readback && !ev.readback.ok), price_ok: !!ev.price?.ok, price_bad: !!(ev.price && !ev.price.ok),
      allergy_ok: ev.allergyHandled,
    },
  };
}

// สิ่งที่ "พนักงาน" รู้แล้ว (ใช้แสดงในใบจดออเดอร์ของผู้เรียน) — ไม่เปิดเผยสิ่งที่ลูกค้ายังไม่ได้บอก
export function notesView(st, lang) {
  const t = st.target;
  const it = menuById(t.item);
  const rows = [{ key: 'item', label: lang === 'en' ? 'Drink' : 'เมนู', value: st.revealed.item ? `${it.emoji} ${it[lang]}` : null }];
  if (it.temps.length > 1) rows.push({ key: 'temperature', label: groupLabel('temperature', lang), value: st.revealed.options.temperature ? valName('temperature', t.temperature, lang) : null });
  for (const g of ['sweetness', 'size']) rows.push({ key: g, label: groupLabel(g, lang), value: st.revealed.options[g] ? valName(g, t[g], lang) : null });
  if (st.revealed.allergy || st.revealed.options.milk) {
    rows.push({ key: 'milk', label: groupLabel('milk', lang), value: st.revealed.options.milk ? valName('milk', t.milk || 'dairy', lang) : null });
  }
  rows.push({ key: 'quantity', label: lang === 'en' ? 'Qty' : 'จำนวน', value: st.revealed.quantity ? String(t.quantity) : null });
  return { rows, allergy: !!st.revealed.allergy, phase: st.phase, readback_ok: st.readback_ok };
}

function result(st, reply, action, r, ev, lang) {
  return {
    customer_reply: reply,
    action_state: action,
    customer_state: st,
    notes_view: notesView(st, lang),
    coach: staffCoach(st, r, ev, lang),
    total_price: st.phase === 'done' ? totalPrice(st.target) : null,
    engine: 'offline',
  };
}

export function startCustomer({ language } = {}, rng = Math.random) {
  const lang = language === 'en' ? 'en' : 'th';
  const st = generateCustomer(rng);
  const reply = openCustomer(st, lang, rng);
  return { customer_reply: reply, customer_state: st, notes_view: notesView(st, lang), customer_emoji: pick(['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '🧔', '👵', '🧑‍🎓'], rng) };
}

// ---------------------------------------------------------------- สรุปผลฝั่งพนักงาน
const D = {
  th: {
    goalDone: 'ขายสำเร็จ ออเดอร์ถูกต้อง', goalErr: (n) => `ขายสำเร็จ แต่ทวนผิด ${n} ครั้ง`, goalNot: 'ยังขายไม่สำเร็จ',
    turns: (n, rp) => `ใช้ ${n} เทิร์น (ถามซ้ำ ${rp} ครั้ง)`,
    price: (e, n) => (n ? `คิดราคาผิด ${n} ครั้ง (ที่ถูก ${e} บาท)` : `ราคาถูกต้อง ${e} บาท`),
    safetyOk: 'ดูแลลูกค้าที่แพ้นมวัวได้ถูกต้อง', safetyMiss: 'ยังไม่ได้ยืนยันเรื่องแพ้นมวัวกับลูกค้า',
    s: { greet: 'ทักทายลูกค้าเป็นมิตร', multi: 'ถามหลายเรื่องในประโยคเดียวได้ดี', readback: 'ทวนออเดอร์ถูกต้องตั้งแต่ครั้งแรก', price: 'คิดราคาถูกต้อง', allergy: 'ดูแลเรื่องแพ้นมวัวได้ดี', polite: 'ใช้ภาษาสุภาพแบบพนักงานมืออาชีพ' },
    i: { greet: 'เริ่มด้วยการทักทาย เช่น "สวัสดีครับ ยินดีต้อนรับครับ"', repeat: 'ฟังและจดสิ่งที่ลูกค้าบอก จะได้ไม่ต้องถามซ้ำ', readback: 'ทวนออเดอร์ให้ครบทุกรายละเอียดก่อนคิดเงิน', price: 'รวมราคาเย็น/ปั่น ไซส์ใหญ่ และนมทางเลือก (+) แล้วคูณจำนวนแก้ว', allergy: 'เมื่อลูกค้าบอกว่าแพ้นมวัว ให้ยืนยันว่าจะไม่ใช้นมวัว และเสนอนมโอ๊ต/ถั่วเหลือง', polite: 'ลงท้ายด้วย "ครับ/ค่ะ" ให้สม่ำเสมอ', efficiency: 'ถามหลายเรื่องพร้อมกัน เช่น "รับร้อนหรือเย็น หวานระดับไหนครับ?"' },
  },
  en: {
    goalDone: 'Sale completed with a correct order', goalErr: (n) => `Sale completed, but the read-back was wrong ${n} time(s)`, goalNot: 'Sale not completed yet',
    turns: (n, rp) => `${n} turn(s) used (${rp} repeated question(s))`,
    price: (e, n) => (n ? `Wrong price ${n} time(s) (correct: ${e} baht)` : `Correct price: ${e} baht`),
    safetyOk: 'Handled the dairy allergy correctly', safetyMiss: "Didn't confirm the customer's dairy allergy",
    s: { greet: 'Greeted the customer warmly', multi: 'Asked several details in one question', readback: 'Read back the order correctly first time', price: 'Calculated the price correctly', allergy: 'Took good care of the dairy allergy', polite: 'Professional, polite language' },
    i: { greet: 'Start with a greeting, e.g. "Hi, welcome!"', repeat: "Note what the customer says so you don't have to ask again", readback: 'Read back every detail before taking payment', price: 'Add the surcharges (iced/frappé, large, non-dairy milk) and multiply by the number of cups', allergy: "When a customer mentions a dairy allergy, confirm you won't use dairy and offer oat or soy milk", polite: 'Keep your language polite and professional', efficiency: 'Ask about several things at once, e.g. "Hot or iced, and how sweet?"' },
  },
};

export function buildStaffDebrief({ language = 'th', turns = [], customer_state }) {
  const lang = language === 'en' ? 'en' : 'th';
  const d = D[lang];
  const st = customer_state;
  const t = st.target;
  const done = st.phase === 'done';
  const n = turns.length;
  const flag = (k) => turns.some((x) => { const v = x.coach?.flags?.[k]; return Array.isArray(v) ? v.length > 0 : !!v; });
  const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  const goal = done ? Math.max(40, 100 - st.readback_errors * 20) : st.readback_ok ? 50 : 10;
  const ideal = 3;
  const efficiency = n === 0 ? 0 : Math.max(10, 100 - Math.max(0, n - ideal) * 12 - st.repeats * 10 - (done ? 0 : 20));
  const priceScore = done || st.price_errors ? Math.max(20, 100 - st.price_errors * 40) : 0;
  const politeness = avg(turns.map((x) => x.coach?.politeness).filter((v) => v != null));

  let safety = null;
  let safetyNote = null;
  if (st.profile.allergy) {
    safety = st.allergy_ack || (done && st.readback_ok) ? 100 : 40;
    safetyNote = safety === 100 ? d.safetyOk : d.safetyMiss;
  }

  const scores = { goal, efficiency, price: priceScore, politeness: politeness ?? 0, safety };
  const overall = Math.round(safety == null
    ? goal * 0.35 + efficiency * 0.2 + priceScore * 0.25 + (politeness ?? 50) * 0.2
    : goal * 0.25 + efficiency * 0.15 + priceScore * 0.2 + (politeness ?? 50) * 0.15 + safety * 0.25);
  const stars = overall >= 90 ? 3 : overall >= 70 ? 2 : overall >= 40 ? 1 : 0;

  const strengths = [];
  const improvements = [];
  if (flag('greeted')) strengths.push(d.s.greet); else improvements.push(d.i.greet);
  if (turns.some((x) => (x.coach?.flags?.new_info || []).length >= 2)) strengths.push(d.s.multi);
  if (done && st.readback_errors === 0) strengths.push(d.s.readback);
  if (done && st.price_errors === 0) strengths.push(d.s.price);
  if (st.allergy_ack) strengths.push(d.s.allergy);
  if (politeness != null && politeness >= 90) strengths.push(d.s.polite);
  if (st.repeats) improvements.push(d.i.repeat);
  if (st.readback_errors || !st.readback_ok) improvements.push(d.i.readback);
  if (st.price_errors) improvements.push(d.i.price);
  if (st.profile.allergy && !st.allergy_ack) improvements.push(d.i.allergy);
  if (politeness != null && politeness < 80) improvements.push(d.i.polite);
  if (n > 5) improvements.push(d.i.efficiency);

  return {
    mode: 'staff', overall, stars, scores,
    notes: {
      goal: done ? (st.readback_errors ? d.goalErr(st.readback_errors) : d.goalDone) : d.goalNot,
      efficiency: d.turns(n, st.repeats),
      price: d.price(totalPrice(t), st.price_errors),
      safety: safetyNote,
    },
    order_summary: `${describeOrder(t, lang)} = ${totalPrice(t)} ฿${st.profile.allergy ? (lang === 'en' ? ' (dairy allergy)' : ' (แพ้นมวัว)') : ''}`,
    strengths, improvements,
  };
}
