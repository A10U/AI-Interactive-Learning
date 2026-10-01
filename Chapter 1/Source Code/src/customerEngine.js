// โหมดสลับบทบาท (Role Swap): AI เป็น "ลูกค้า" — ผู้เรียนเป็น "พนักงาน"
// ลูกค้ามีออเดอร์ในใจ (target) ที่บอกไม่หมดตั้งแต่แรก ผู้เรียนต้อง: ทักทาย → ถามรายละเอียดให้ครบ →
// ดูแลเรื่องอาการแพ้ / ตรวจบัตรเมื่อสั่งแอลกอฮอล์ → ทวนออเดอร์ให้ถูก → บอกราคาให้ถูก
import { GROUPS, INGREDIENTS, getScenario } from './scenarios.js';
import {
  emptyOrder, normalizeOrder, itemById, allowedValues, offerValues, applicableModifiers, removableOf, valueDef, modifierDef,
  totalPrice, itemLabel, orderHasAlcohol, itemMayHaveAlcohol, listText, allergenName, cardName, enLower, allergyConflicts,
} from './order.js';
import { parseUtterance } from './nlu.js';

// ตัวเลือกที่ลูกค้าต้องบอก: ช่องบังคับ + ตัวเลือกไม่บังคับที่ลูกค้าเลือกต่างจากค่าเริ่มต้น (เช่น ไข่ดาว, จานพิเศษ)
const wanted = (t, g) => !!t.options[g] && (GROUPS[g].required || t.options[g] !== GROUPS[g].default);
const optionalPending = (st, it) => it.groups.filter((g) => !GROUPS[g].required && wanted(st.target, g) && !st.revealed.options[g]);

const pick = (xs, rng) => xs[Math.floor(rng() * xs.length)];
const has = (t, words) => words.some((w) => t.includes(w));
const hasWord = (t, words) => words.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t));

const L = {
  th: {
    open: (item, q, unit) => `สวัสดีครับ ขอ${item}${q > 1 ? ` ${q} ${unit}` : ''}`,
    openAlcohol: ' แบบมีแอลกอฮอล์',
    openOption: (v) => ` ${v}`,
    openEnd: 'ครับ',
    openAllergy: (a) => ` อ้อ ผมแพ้${a}นะครับ`,
    greetBack: 'สวัสดีครับ',
    value: (v) => `${v}ครับ`,
    again: (v) => `เมื่อกี้บอกไปแล้วครับ ${v}`,
    notApplicable: 'เอ๊ะ เมนูนี้ต้องเลือกเรื่องนั้นด้วยเหรอครับ?',
    item: (item) => `ขอ${item}ครับ`,
    qty: (q, unit) => `${q} ${unit}ครับ`,
    more: (xs) => `ขอ${xs}ด้วยครับ`,
    noMore: 'ไม่มีแล้วครับ แค่นี้ครับ',
    noThanks: 'ไม่เอาครับ',
    allergy: (a) => `ผมแพ้${a}ครับ`,
    noAllergy: 'ไม่แพ้อะไรครับ',
    allergyThanks: 'ขอบคุณครับ ช่วยระวังให้ด้วยนะครับ',
    showId: (age) => `ได้ครับ นี่ครับบัตร 🪪 (บัตรระบุอายุ ${age} ปี)`,
    idAgain: 'เมื่อกี้ให้ดูบัตรไปแล้วนะครับ',
    acceptVirgin: 'อ๋อ ขอโทษครับ งั้นขอแบบไม่มีแอลกอฮอล์ครับ',
    switchMocktail: (d) => `อ๋อ ขอโทษครับ งั้นขอเปลี่ยนเป็น${d}ครับ`,
    whyRefuse: (age) => `เอ๊ะ ผมอายุ ${age} แล้วนะครับ ทำไมเหรอครับ?`,
    wrong: (xs) => `ไม่ใช่ครับ ${xs}ครับ`,
    missing: (xs) => `แล้วก็${xs}ด้วยนะครับ`,
    forgotAllergy: (a) => `อย่าลืมนะครับ ผมแพ้${a}`,
    correct: 'ถูกต้องครับ',
    askPrice: 'ทั้งหมดเท่าไหร่ครับ?',
    pay: (p) => `นี่ครับ ${p} บาท ขอบคุณครับ 😊`,
    readbackFirst: 'ได้ครับ แต่ช่วยทวนออเดอร์ให้ฟังก่อนได้ไหมครับ กลัวสั่งผิด',
    priceWrong: (p) => `เอ๊ะ ${p} บาทเหรอครับ? รบกวนเช็คราคาอีกทีได้ไหมครับ`,
    priceHint: (p) => `ผมลองดูจากเมนูแล้ว น่าจะเป็น ${p} บาทนะครับ`,
    confused: 'ขอโทษครับ? ไม่ค่อยเข้าใจครับ',
    waiting: 'ครับ',
    done: 'ขอบคุณครับ 😊',
  },
  en: {
    open: (item, q) => `Hi! Could I get ${q > 1 ? `${q} ` : 'a '}${item}`,
    openAlcohol: ', with alcohol',
    openOption: (v) => `, ${v}`,
    openEnd: ', please?',
    openAllergy: (a) => ` Oh, and I'm allergic to ${a}.`,
    greetBack: 'Hello!',
    value: (v) => `${v[0].toUpperCase()}${v.slice(1)}, please.`,
    again: (v) => `I already said — ${v}.`,
    notApplicable: 'Hmm, is that something I need to choose for this one?',
    item: (item) => `I'd like ${item}, please.`,
    qty: (q) => `${q}, please.`,
    more: (xs) => `Could I also get ${xs}?`,
    noMore: "No, that's everything.",
    noThanks: 'No, thanks.',
    allergy: (a) => `I'm allergic to ${a}.`,
    noAllergy: 'No allergies.',
    allergyThanks: 'Thank you — please be careful with that.',
    showId: (age) => `Sure, here's my ID 🪪 (it says I'm ${age}).`,
    idAgain: 'I already showed you my ID.',
    acceptVirgin: "Oh, sorry! I'll have it without alcohol, then.",
    switchMocktail: (d) => `Oh, sorry! Then I'll have ${d} instead.`,
    whyRefuse: (age) => `Huh? I'm ${age}. Why not?`,
    wrong: (xs) => `No, sorry — ${xs}.`,
    missing: (xs) => `And ${xs}, please.`,
    forgotAllergy: (a) => `Please don't forget — I'm allergic to ${a}.`,
    correct: "That's right.",
    askPrice: 'How much is that?',
    pay: (p) => `Here's ${p} baht. Thank you! 😊`,
    readbackFirst: 'Sure — but could you read my order back first? I want to be sure.',
    priceWrong: (p) => `${p} baht? Could you double-check that, please?`,
    priceHint: (p) => `I checked the menu — I think it should be ${p} baht.`,
    confused: "Sorry? I didn't quite get that.",
    waiting: 'Okay.',
    done: 'Thanks! 😊',
  },
};

// ---------------------------------------------------------------- สร้างลูกค้า
export function generateCustomer(sc, rng = Math.random) {
  const target = emptyOrder();
  let profile = {};
  const missions = sc.missions.filter((m) => m.target.item);
  if (missions.length && rng() < 0.5) {
    const m = pick(missions, rng);
    target.item = m.target.item;
    for (const [g, v] of Object.entries(m.target.options || {})) target.options[g] = Array.isArray(v) ? v[0] : v;
    target.modifiers = [...(m.target.modifiers || [])];
    target.quantity = m.target.quantity || 1;
    profile = { ...(m.profile || {}) };
  } else {
    const it = pick(sc.menu, rng);
    target.item = it.id;
    target.quantity = rng() < 0.25 ? 2 : 1;
    const mods = applicableModifiers(sc, it).filter((m) => !(sc.ageCheck && m === 'double_shot'));
    if (mods.length && rng() < 0.6) target.modifiers = [pick(mods, rng)];
  }
  const it = itemById(sc, target.item);

  // ลูกค้าบางคนแพ้อาหาร — เลือกเฉพาะสิ่งที่ "เอาออกได้" ในเมนูนี้ (พนักงานต้องรับมือให้ถูก)
  if (!sc.ageCheck && !profile.allergies && rng() < 0.35) {
    const cands = removableOf(sc, it).filter((i) => INGREDIENTS[i].allergen);
    if (cands.length) profile.allergies = [INGREDIENTS[pick(cands, rng)].allergen];
  }
  const allergies = profile.allergies || [];
  for (const g of it.groups) {
    const v = target.options[g];
    if ((!v || !offerValues(it, g, allergies).includes(v)) && GROUPS[g].required) target.options[g] = pick(offerValues(it, g, allergies), rng);
  }
  // ลูกค้าบางคนขอตัวเลือกเสริม เช่น ไข่ดาว / จานพิเศษ — ไม่บอกเอง พนักงานต้องถาม "รับอะไรเพิ่มไหม"
  for (const g of it.groups) {
    if (GROUPS[g].required || target.options[g] || rng() >= 0.3) continue;
    const vals = offerValues(it, g, allergies).filter((v) => v !== GROUPS[g].default);
    if (vals.length) target.options[g] = pick(vals, rng);
  }
  // ออเดอร์ที่ถูกต้องต้อง "ไม่ใส่" วัตถุดิบที่ลูกค้าแพ้ และไม่มีของเพิ่มที่มีสารนั้น
  const safetyMods = [];
  for (const k of allergyConflicts(sc, target, allergies)) {
    if (k.kind === 'removable') safetyMods.push(`no_${k.ingredient}`);
    if (k.kind === 'addon') target.modifiers = target.modifiers.filter((m) => m !== k.modifier);
  }
  target.modifiers = [...new Set([...target.modifiers, ...safetyMods])];

  if (sc.ageCheck) {
    if (profile.age == null) profile.age = rng() < 0.35 ? 18 : pick([22, 25, 31, 40], rng);
    if (it.groups.includes('alcohol') && !profile.driving) target.options.alcohol = rng() < 0.75 ? 'with' : 'virgin';
    if (profile.driving && it.groups.includes('alcohol')) target.options.alcohol = 'virgin';
  }
  target.allergies = [...allergies];

  return {
    target, profile, safety_mods: safetyMods,
    revealed: { item: false, quantity: target.quantity === 1, options: {}, modifiers: [], allergies: false },
    greeted: false, id_checked: false, refused_alcohol: false, allergy_ack: false,
    readback_ok: false, readback_errors: 0, price_errors: 0, repeats: 0, phase: 'ordering', turns: 0,
  };
}

const valName = (g, v, lang) => valueDef(g, v)[lang];
const itemText = (sc, target, lang) => (lang === 'en' ? itemLabel(sc, { ...target, options: {} }, 'en') : itemById(sc, target.item).th);

// ประโยคเปิดของลูกค้า: บอกเมนู (+ อาจบอกตัวเลือก 1 อย่าง / แอลกอฮอล์ / อาการแพ้)
export function openCustomer(sc, st, lang, rng = Math.random) {
  const S = L[lang];
  const t = st.target;
  const it = itemById(sc, t.item);
  st.revealed.item = true;
  let line = S.open(itemText(sc, t, lang), t.quantity, lang === 'en' ? sc.unit.en : sc.unit.th);
  if (t.quantity > 1) st.revealed.quantity = true;
  if (t.options.alcohol === 'with') { line += S.openAlcohol; st.revealed.options.alcohol = true; }
  const free = it.groups.filter((g) => GROUPS[g].required && !st.revealed.options[g] && g !== 'alcohol');
  if (free.length && rng() < 0.4) {
    const g = pick(free, rng);
    st.revealed.options[g] = true;
    line += S.openOption(valName(g, t.options[g], lang));
  }
  line += S.openEnd;
  if (st.profile.allergies?.length && rng() < 0.6) {
    st.revealed.allergies = true;
    line += S.openAllergy(listText(st.profile.allergies.map((a) => allergenName(a, lang)), lang));
  }
  return line;
}

// ---------------------------------------------------------------- เข้าใจสิ่งที่ "พนักงาน" (ผู้เรียน) พูด
const QUESTION = /(ไหม|มั้ย|หรือ|ไหน|อะไร|ยังไง|เท่าไหร่|กี่|ดี\s*(ครับ|คะ|ค่ะ)|\?|which|would you|what|how|do you|anything|any )/;

function readStaff(sc, st, text) {
  const t = st.target;
  const it = itemById(sc, t.item);
  const p = parseUtterance(text, sc, null);
  const low = p.text;
  const isQuestion = QUESTION.test(low);
  const askQty = has(low, ['กี่แก้ว', 'กี่จาน', 'กี่ชิ้น', 'กี่ที่', 'กี่ถาด', 'กี่ชาม', 'how many']);
  const askedGroups = isQuestion
    ? it.groups.filter((g) => p.options[g] || (GROUPS[g].q || []).some((w) => (/[a-z]/.test(w) ? hasWord(low, [w]) : low.includes(w))))
    : [];
  // กลุ่มที่ไม่มีในเมนูนี้แต่ผู้เรียนถาม
  const irrelevant = isQuestion && Object.keys(p.options).some((g) => !it.groups.includes(g));
  const price = (() => {
    const m = low.match(/(\d[\d,]*)\s*(บาท|baht|฿|thb)/) || low.match(/(?:ทั้งหมด|total|รวม|that'?s|comes to)\D{0,12}(\d[\d,]*)/);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  })();
  const mentionedParts = new Set(p.mentions);
  // คำถามให้เลือก เช่น "ร้อนหรือเย็นครับ" = พูดถึง 2 ค่าในกลุ่มเดียวกัน → ไม่ใช่การทวนออเดอร์
  const perGroup = {};
  p.mentions.filter((m) => m.startsWith('opt:')).forEach((m) => { const g = m.split(':')[1]; perGroup[g] = (perGroup[g] || 0) + 1; });
  // คำถามที่เอ่ยชื่อเมนู เช่น "ขนมปังต้องการให้สไลซ์ไหมครับ?" ไม่ใช่การทวน — การทวนต้องเป็นประโยคบอกเล่า หรือมีคำชวนยืนยัน
  const rbCue = has(low, ['ทวน', 'ถูกต้องไหม', 'ถูกต้องมั้ย', 'ถูกไหม', 'ใช่ไหม', 'นะครับ', 'นะคะ', 'read that back', 'read back', 'is that correct', 'is that right', 'correct?', 'right?']);
  const choiceQuestion = isQuestion && !rbCue && Object.values(perGroup).some((n) => n >= 2);
  const readback = !!p.item && !choiceQuestion && (rbCue || !isQuestion)
    && (Object.keys(p.options).length + p.addMods.length + p.exclude.length >= 1 || components(sc, t).length <= 1 || price != null);
  const allergens = st.profile.allergies || [];
  const allergyHandled = allergens.some((a) =>
    p.excludeAllergens.includes(a)
    || p.exclude.some((i) => INGREDIENTS[i].allergen === a)
    || (has(low, ['ไม่ใส่', 'งด', 'เอาออก', 'ระวัง', 'แยก', 'without', 'leave out', 'no ', 'careful', 'separate']) && has(low, [allergenName(a, 'th'), allergenName(a, 'en').toLowerCase()])));
  const askMore = has(low, ['อะไรเพิ่ม', 'เพิ่มเติม', 'อะไรอีก', 'อย่างอื่น', 'anything else', 'something else', 'anything more']);
  // "รับแบบมีแอลกอฮอล์หรือเวอร์จิ้น?" = คำถามให้เลือก ไม่ใช่การปฏิเสธ (เว้นแต่มีคำปฏิเสธชัดเจน)
  const refuseCore = has(low, ['ขายไม่ได้', 'ให้ไม่ได้', 'เสิร์ฟไม่ได้', 'ไม่สามารถ', 'อายุไม่ถึง', 'ต่ำกว่า 20', "can't serve", 'cannot serve', 'not allowed', 'under 20', 'underage']);
  const refuseAlcohol = refuseCore || !(perGroup.alcohol >= 2) && has(low, ['ไม่มีแอลกอฮอล์', 'เวอร์จิ้น', 'เวอร์จิน', 'ขายไม่ได้', 'ให้ไม่ได้', 'เสิร์ฟไม่ได้', 'ไม่สามารถ', 'ม็อกเทล', 'virgin', 'non-alcoholic', 'alcohol-free', "can't serve", 'cannot serve', 'not allowed', 'mocktail', 'under 20', 'underage', 'อายุไม่ถึง', 'ต่ำกว่า 20']);
  return {
    p, low, isQuestion, askQty, irrelevant, price, readback, mentionedParts, allergyHandled, askMore, refuseAlcohol,
    // ประโยคปฏิเสธ/เสนอเวอร์จิ้น ไม่ใช่การถามเรื่องแอลกอฮอล์ซ้ำ
    askedGroups: refuseAlcohol ? askedGroups.filter((g) => g !== 'alcohol') : askedGroups,
    greet: p.greeting || has(low, ['ยินดีต้อนรับ', 'welcome', 'good evening', 'good morning']),
    askItem: !askMore && has(low, ['รับอะไร', 'อะไรดี', 'สั่งอะไร', 'what would you like', 'what can i get', 'what can i do for you', "what'll it be"]),
    askAllergy: has(low, ['แพ้', 'allerg', 'dietary']) && isQuestion,
    askId: !refuseAlcohol && (has(low, ['บัตร', 'ไอดี', 'อายุเท่าไหร่', 'อายุกี่ปี', 'พาสปอร์ต', 'how old', 'identification', 'your age']) || hasWord(low, ['id'])),
  };
}

// ส่วนประกอบของออเดอร์ที่ต้องทวน (ไม่นับค่าเริ่มต้นที่ลูกค้าไม่ได้เลือก)
function components(sc, t) {
  const it = itemById(sc, t.item);
  return [
    `item:${t.item}`,
    ...it.groups.filter((g) => wanted(t, g)).map((g) => `opt:${g}:${t.options[g]}`),
    ...t.modifiers.map((m) => `mod:${m}`),
  ];
}

function partText(sc, key, lang) {
  const [kind, a, b] = key.split(':');
  if (kind === 'item') return lang === 'en' ? enLower(itemById(sc, a).en) : itemById(sc, a).th;
  if (kind === 'opt') return valName(a, b, lang);
  return modifierDef(a)[lang];
}

// ---------------------------------------------------------------- เทิร์นของลูกค้า
export function customerTurn(payload) {
  const sc = getScenario(payload.scenario);
  const lang = payload.language === 'en' ? 'en' : 'th';
  const S = L[lang];
  const st = JSON.parse(JSON.stringify(payload.customer_state));
  st.target = normalizeOrder(st.target);
  const t = st.target;
  const turn = payload.current_turn || {};
  const text = [turn.user_speech, turn.user_text].filter((x) => x && x.trim()).join(' ');
  const r = readStaff(sc, st, text);
  const it = () => itemById(sc, t.item);
  const out = [];
  const ev = { newInfo: [], repeats: [], irrelevant: r.irrelevant, readback: null, price: null, idChecked: false, refused: false, allergyHandled: false, greeted: false };
  st.turns += 1;

  if (st.phase === 'done') return result(sc, st, S.done, 'serving', r, ev, lang);

  if (r.greet && !st.greeted) { st.greeted = true; ev.greeted = true; if (!r.readback && !r.askedGroups.length) out.push(S.greetBack); }
  if (r.askItem) out.push(S.item(itemText(sc, t, lang)));

  // ตอบคำถามทีละเรื่อง
  for (const g of r.askedGroups) {
    if (r.readback) break;
    if (!t.options[g]) { st.revealed.options[g] = true; out.push(S.noThanks); continue; } // ถามตัวเลือกเสริมที่ลูกค้าไม่ได้อยากได้
    const v = valName(g, t.options[g], lang);
    if (st.revealed.options[g]) { out.push(S.again(v)); ev.repeats.push(g); st.repeats += 1; } else { st.revealed.options[g] = true; ev.newInfo.push(g); out.push(S.value(v)); }
  }
  if (r.irrelevant && !r.askedGroups.length && !r.readback) out.push(S.notApplicable);
  if (r.askQty) {
    if (!st.revealed.quantity) ev.newInfo.push('quantity');
    st.revealed.quantity = true;
    out.push(S.qty(t.quantity, lang === 'en' ? sc.unit.en : sc.unit.th));
  }
  if (r.askMore) {
    const prefs = t.modifiers.filter((m) => !st.safety_mods.includes(m) && !st.revealed.modifiers.includes(m));
    const optPrefs = optionalPending(st, it());
    if (prefs.length || optPrefs.length) {
      st.revealed.modifiers.push(...prefs);
      optPrefs.forEach((g) => { st.revealed.options[g] = true; });
      ev.newInfo.push('modifiers');
      out.push(S.more(listText([...optPrefs.map((g) => valName(g, t.options[g], lang)), ...prefs.map((m) => modifierDef(m)[lang])], lang)));
    } else out.push(S.noMore);
  }
  const allergyText = () => listText((st.profile.allergies || []).map((a) => allergenName(a, lang)), lang);
  if (r.askAllergy) {
    st.allergy_asked = true;
    if (st.profile.allergies?.length) {
      if (!st.revealed.allergies) ev.newInfo.push('allergies');
      st.revealed.allergies = true;
      out.push(S.allergy(allergyText()));
    } else out.push(S.noAllergy);
  }
  if (r.allergyHandled && st.revealed.allergies && !st.allergy_ack) { st.allergy_ack = true; ev.allergyHandled = true; out.push(S.allergyThanks); }

  // ตรวจบัตร / ปฏิเสธแอลกอฮอล์
  if (sc.ageCheck && r.askId) {
    if (st.id_checked) out.push(S.idAgain); else { st.id_checked = true; ev.idChecked = true; out.push(S.showId(st.profile.age)); }
  }
  if (sc.ageCheck && r.refuseAlcohol && orderHasAlcohol(sc, t)) {
    if (st.id_checked && st.profile.age < (sc.legalAge || 20)) {
      st.refused_alcohol = true;
      ev.refused = true;
      if (it().groups.includes('alcohol')) { t.options.alcohol = 'virgin'; st.revealed.options.alcohol = true; out.push(S.acceptVirgin); } else {
        const mock = sc.menu.find((m) => !itemMayHaveAlcohol(m));
        t.item = mock.id;
        t.options = {};
        for (const g of mock.groups) if (GROUPS[g].required) t.options[g] = offerValues(mock, g)[0];
        t.modifiers = t.modifiers.filter((m) => m === 'no_straw');
        mock.groups.forEach((g) => { st.revealed.options[g] = true; });
        const d = lang === 'en'
          ? `${enLower(mock.en)} (${mock.groups.map((g) => valName(g, t.options[g], 'en')).join(', ')})`
          : `${mock.th} ${mock.groups.map((g) => valName(g, t.options[g], 'th')).join(' ')}`;
        out.push(S.switchMocktail(d));
      }
    } else if (st.id_checked) out.push(S.whyRefuse(st.profile.age));
  }

  // ทวนออเดอร์
  if (r.readback) {
    const comps = components(sc, t);
    const wrong = [];
    if (r.p.item && r.p.item !== t.item) wrong.push(`item:${t.item}`);
    for (const [g, v] of Object.entries(r.p.options)) if (it().groups.includes(g) && t.options[g] && v !== t.options[g] && !r.mentionedParts.has(`opt:${g}:${t.options[g]}`)) wrong.push(`opt:${g}:${t.options[g]}`);
    if (r.p.quantity && r.p.quantity !== t.quantity) wrong.push('qty');
    const missing = comps.filter((c) => !r.mentionedParts.has(c) && !wrong.includes(c));
    const qtyMissing = t.quantity > 1 && !r.p.quantity;
    const txt = (xs) => listText(xs.map((c) => (c === 'qty' ? `${t.quantity} ${lang === 'en' ? sc.unit.en : sc.unit.th}` : partText(sc, c, lang))), lang);
    if (wrong.length || missing.length || qtyMissing) {
      st.readback_errors += 1;
      ev.readback = { ok: false, wrong, missing: [...missing, ...(qtyMissing ? ['qty'] : [])] };
      if (wrong.length) out.push(S.wrong(txt(wrong)));
      const miss = [...missing, ...(qtyMissing ? ['qty'] : [])];
      const safetyMiss = miss.filter((c) => st.safety_mods.includes(c.replace(/^mod:/, '')));
      if (safetyMiss.length && st.profile.allergies?.length) out.push(S.forgotAllergy(allergyText()));
      const otherMiss = miss.filter((c) => !safetyMiss.includes(c));
      if (otherMiss.length) out.push(S.missing(txt(otherMiss)));
      miss.forEach((c) => {
        if (c.startsWith('opt:')) st.revealed.options[c.split(':')[1]] = true;
        if (c.startsWith('mod:')) st.revealed.modifiers.push(c.slice(4));
      });
      if (safetyMiss.length) st.revealed.allergies = true;
    } else {
      st.readback_ok = true;
      ev.readback = { ok: true, wrong: [], missing: [] };
      out.push(S.correct);
      if (r.price == null) out.push(S.askPrice);
    }
  }

  // ราคา
  if (r.price != null) {
    const expected = totalPrice(sc, t);
    if (r.price === expected) {
      ev.price = { ok: true, expected, stated: r.price };
      if (st.readback_ok) { st.phase = 'done'; out.push(S.pay(expected)); } else if (!r.readback) out.push(S.readbackFirst);
    } else {
      st.price_errors += 1;
      ev.price = { ok: false, expected, stated: r.price };
      out.push(S.priceWrong(r.price));
      if (st.price_errors >= 2) out.push(S.priceHint(expected));
    }
  }

  if (!out.length) out.push(st.readback_ok ? S.askPrice : r.p.empty ? S.waiting : S.confused);
  const action = st.phase === 'done' ? 'making' : ev.readback?.ok === false || ev.price?.ok === false ? 'confused' : ev.newInfo.length || ev.idChecked ? 'asking' : 'looking';
  return result(sc, st, out.join(' '), action, r, ev, lang);
}

// ---------------------------------------------------------------- โค้ช (ประเมินฝั่งพนักงาน)
const C = {
  th: {
    excellent: 'ดีเยี่ยม', good: 'ดี', improve: 'ต้องปรับปรุง',
    greet: 'ทักทายลูกค้าอย่างเป็นมิตร',
    manyQ: (n) => `ถามรายละเอียดได้ ${n} เรื่องในครั้งเดียว มีประสิทธิภาพมาก`,
    oneQ: 'ถามคำถามเจาะจงได้ตรงประเด็น',
    repeat: 'ถามซ้ำเรื่องที่ลูกค้าบอกไปแล้ว',
    repeatTip: 'ฟังให้ครบ และจดสิ่งที่ลูกค้าบอกไว้ในใบออเดอร์',
    irrelevant: 'ถามเรื่องที่เมนูนี้ไม่มีให้เลือก',
    rbOk: 'ทวนออเดอร์ได้ถูกต้องครบถ้วน',
    rbBad: 'ทวนออเดอร์ยังไม่ถูก/ไม่ครบ',
    priceOk: 'บอกราคาได้ถูกต้อง',
    priceBad: (e) => `คิดราคาผิด (ที่ถูกคือ ${e} บาท)`,
    idOk: 'ขอดูบัตรก่อนขายแอลกอฮอล์ ถูกต้องตามกฎหมาย',
    refuseOk: 'ปฏิเสธการขายแอลกอฮอล์ให้ผู้อายุต่ำกว่า 20 ปีได้อย่างสุภาพ',
    allergyOk: 'รับเรื่องอาการแพ้ และยืนยันว่าจะไม่ใส่ให้',
    allergyAsked: 'ถามเรื่องอาการแพ้อาหาร ใส่ใจความปลอดภัยของลูกค้า',
    allergyTip: (a) => `ลูกค้าแพ้${a} — ยืนยันว่า "จะไม่ใส่${a}ให้นะครับ"`,
    idTip: 'ลูกค้าสั่งเครื่องดื่มแอลกอฮอล์ — ต้องขอดูบัตรประชาชนก่อน',
    underage: '⚠️ ลูกค้าอายุไม่ถึง 20 ปี แต่ยังจะขายแอลกอฮอล์ให้',
    underageTip: 'บอกลูกค้าอย่างสุภาพว่าขายแอลกอฮอล์ให้ไม่ได้ และเสนอแบบเวอร์จิ้น/ม็อกเทล',
    noId: '⚠️ ทวนออเดอร์แอลกอฮอล์โดยยังไม่ได้ตรวจบัตร',
    confused: 'ลูกค้าไม่เข้าใจสิ่งที่พูด',
    confusedTip: 'ลองถามทีละเรื่อง เช่น "รับร้อนหรือเย็นครับ?"',
    ask: (xs) => `ยังไม่ได้ถาม: ${xs}`,
    readbackTip: 'ได้ข้อมูลครบแล้ว ลองทวนออเดอร์ให้ลูกค้าฟัง พร้อมบอกยอดเงิน',
    priceTip: 'ทวนถูกแล้ว บอกยอดรวม เช่น "ทั้งหมด 120 บาทครับ"',
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
    irrelevant: "Asked about an option this item doesn't have",
    rbOk: 'Read the order back accurately',
    rbBad: 'The read-back was wrong or incomplete',
    priceOk: 'Stated the correct price',
    priceBad: (e) => `Wrong price (it should be ${e} baht)`,
    idOk: 'Checked ID before serving alcohol — exactly right',
    refuseOk: 'Politely refused to serve alcohol to someone under 20',
    allergyOk: 'Acknowledged the allergy and confirmed it will be left out',
    allergyAsked: "Asked about food allergies — good care for the customer's safety",
    allergyTip: (a) => `The customer is allergic to ${a} — confirm "We'll leave the ${a} out"`,
    idTip: 'The customer ordered alcohol — ask to see their ID first',
    underage: "⚠️ The customer is under 20 but you're still serving alcohol",
    underageTip: "Politely explain you can't serve alcohol and offer a virgin version or a mocktail",
    noId: '⚠️ Read back an alcoholic order without checking ID',
    confused: "The customer didn't understand",
    confusedTip: 'Ask one thing at a time, e.g. "Hot or iced?"',
    ask: (xs) => `Not asked yet: ${xs}`,
    readbackTip: 'You have everything — read the order back and state the total',
    priceTip: 'Read-back confirmed — now state the total, e.g. "That\'s 120 baht."',
    askMoreTip: 'Try "Anything else?" — the customer may have special requests',
    politeTip: 'Use "please", "certainly" or "of course" to sound professional',
    doneTip: 'Sale complete! 🎉',
  },
};

function staffCoach(sc, st, r, ev, lang) {
  const c = C[lang];
  const t = st.target;
  const it = itemById(sc, t.item);
  const notes = [];
  let tip = '';
  let rating = 'good';
  const politeness = r.p.empty ? null : r.p.politeness;
  const underage = sc.ageCheck && st.profile.age < (sc.legalAge || 20);

  if (ev.greeted) notes.push(c.greet);
  const asked = ev.newInfo.length;
  if (asked >= 2) { rating = 'excellent'; notes.push(c.manyQ(asked)); } else if (asked === 1) notes.push(c.oneQ);
  if (ev.repeats.length) { rating = 'improve'; notes.push(c.repeat); tip = c.repeatTip; }
  if (ev.irrelevant) { notes.push(c.irrelevant); if (rating !== 'improve') rating = 'good'; }
  if (ev.allergyHandled) { rating = 'excellent'; notes.push(c.allergyOk); }
  if (r.askAllergy && !ev.newInfo.includes('allergies') && !ev.allergyHandled) notes.push(c.allergyAsked);
  if (ev.idChecked) { rating = 'excellent'; notes.push(c.idOk); }
  if (ev.refused) { rating = 'excellent'; notes.push(c.refuseOk); }
  if (ev.readback?.ok) { rating = 'excellent'; notes.push(c.rbOk); }
  if (ev.readback && !ev.readback.ok) { rating = 'improve'; notes.push(c.rbBad); }
  if (ev.price?.ok) notes.push(c.priceOk);
  if (ev.price && !ev.price.ok) { rating = 'improve'; notes.push(c.priceBad(ev.price.expected)); }
  if (ev.readback && sc.ageCheck && orderHasAlcohol(sc, t) && !st.id_checked) { rating = 'improve'; notes.push(c.noId); tip = c.idTip; }
  if (ev.readback && underage && orderHasAlcohol(sc, t) && st.id_checked) { rating = 'improve'; notes.push(c.underage); tip = c.underageTip; }
  if (!notes.length && !r.p.empty) { rating = 'improve'; notes.push(c.confused); tip = c.confusedTip; }

  // คำแนะนำขั้นต่อไป (Scaffold)
  if (!tip) {
    const notAsked = it.groups.filter((g) => GROUPS[g].required && !st.revealed.options[g]).map((g) => GROUPS[g][lang]);
    if (!st.revealed.quantity) notAsked.push(lang === 'en' ? 'quantity' : 'จำนวน');
    const allergyPending = st.revealed.allergies && st.profile.allergies?.length && !st.allergy_ack;
    if (st.phase === 'done') tip = c.doneTip;
    else if (allergyPending) tip = c.allergyTip(listText(st.profile.allergies.map((a) => allergenName(a, lang)), lang));
    else if (sc.ageCheck && orderHasAlcohol(sc, t) && !st.id_checked) tip = c.idTip;
    else if (underage && orderHasAlcohol(sc, t)) tip = c.underageTip;
    else if (notAsked.length) tip = c.ask(notAsked.join(', '));
    else if (st.readback_ok) tip = c.priceTip;
    else if ((!st.revealed.modifiers.length && t.modifiers.some((m) => !st.safety_mods.includes(m))) || optionalPending(st, it).length) tip = c.askMoreTip;
    else tip = c.readbackTip;
  }
  if (politeness != null && politeness < 100 && rating !== 'improve' && lang === 'th') tip = tip || c.politeTip;

  const clarity = r.p.empty ? 0 : Math.min(100, 50 + asked * 20 + (ev.readback?.ok ? 40 : 0) + (ev.price?.ok ? 20 : 0) - ev.repeats.length * 20);
  return {
    rating, label: c[rating], notes, tip, politeness, clarity: Math.max(0, clarity),
    flags: {
      greeted: ev.greeted, new_info: ev.newInfo, repeats: ev.repeats.length, readback_ok: !!ev.readback?.ok,
      readback_bad: !!(ev.readback && !ev.readback.ok), price_ok: !!ev.price?.ok, price_bad: !!(ev.price && !ev.price.ok),
      id_checked: ev.idChecked, refused: ev.refused, allergy_ok: ev.allergyHandled,
    },
  };
}

// สิ่งที่ "พนักงาน" รู้แล้ว (ใช้แสดงในใบจดออเดอร์ของผู้เรียน)
function notesView(sc, st, lang) {
  const t = st.target;
  const it = itemById(sc, t.item);
  const rows = [{ key: 'item', label: lang === 'en' ? 'Item' : 'เมนู', value: st.revealed.item ? cardName(it, lang) : null }];
  for (const g of it.groups.filter((x) => GROUPS[x].required || (wanted(t, x) && st.revealed.options[x]))) {
    rows.push({ key: g, label: GROUPS[g][lang], value: st.revealed.options[g] ? valName(g, t.options[g], lang) : null });
  }
  rows.push({ key: 'quantity', label: lang === 'en' ? 'Qty' : 'จำนวน', value: st.revealed.quantity ? String(t.quantity) : null });
  return {
    rows,
    extras: st.revealed.modifiers.map((m) => modifierDef(m)[lang]),
    allergies: st.revealed.allergies ? st.profile.allergies || [] : [],
    id_age: st.id_checked ? st.profile.age : null,
    phase: st.phase, readback_ok: st.readback_ok,
  };
}

function result(sc, st, reply, action, r, ev, lang) {
  return {
    customer_reply: reply,
    action_state: action,
    customer_state: st,
    notes_view: notesView(sc, st, lang),
    coach: staffCoach(sc, st, r, ev, lang),
    total_price: st.phase === 'done' ? totalPrice(sc, st.target) : null,
    engine: 'offline',
  };
}

export function startCustomer({ scenario, language }, rng = Math.random) {
  const sc = getScenario(scenario);
  const lang = language === 'en' ? 'en' : 'th';
  const st = generateCustomer(sc, rng);
  const reply = openCustomer(sc, st, lang, rng);
  return { customer_reply: reply, customer_state: st, notes_view: notesView(sc, st, lang), customer_emoji: pick(['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '🧔'], rng) };
}

// ---------------------------------------------------------------- สรุปผลฝั่งพนักงาน
const D = {
  th: {
    goalDone: 'ขายสำเร็จ ออเดอร์ถูกต้อง', goalErr: (n) => `ขายสำเร็จ แต่ทวนผิด ${n} ครั้ง`, goalNot: 'ยังขายไม่สำเร็จ',
    turns: (n, rp) => `ใช้ ${n} เทิร์น (ถามซ้ำ ${rp} ครั้ง)`,
    price: (e, n) => (n ? `คิดราคาผิด ${n} ครั้ง (ที่ถูก ${e} บาท)` : `ราคาถูกต้อง ${e} บาท`),
    safetyNote: { allergyOk: 'ดูแลลูกค้าที่แพ้อาหารได้ถูกต้อง', allergyMiss: 'ยังไม่ได้ยืนยันเรื่องอาการแพ้กับลูกค้า', idOk: 'ตรวจบัตรก่อนขายแอลกอฮอล์', idMiss: 'ไม่ได้ตรวจบัตรก่อนขายแอลกอฮอล์', underage: 'ขายแอลกอฮอล์ให้ผู้อายุต่ำกว่า 20 ปี' },
    s: { greet: 'ทักทายลูกค้าเป็นมิตร', multi: 'ถามหลายเรื่องในประโยคเดียวได้ดี', readback: 'ทวนออเดอร์ถูกต้องตั้งแต่ครั้งแรก', price: 'คิดราคาถูกต้อง', allergy: 'ดูแลเรื่องอาการแพ้ได้ดี', id: 'ตรวจบัตรยืนยันอายุตามกฎหมาย', refuse: 'ปฏิเสธลูกค้าอายุไม่ถึงอย่างสุภาพ', polite: 'ใช้ภาษาสุภาพแบบพนักงานมืออาชีพ' },
    i: { greet: 'เริ่มด้วยการทักทาย เช่น "สวัสดีครับ ยินดีต้อนรับครับ"', repeat: 'ฟังและจดสิ่งที่ลูกค้าบอก จะได้ไม่ต้องถามซ้ำ', readback: 'ทวนออเดอร์ให้ครบทุกรายละเอียดก่อนคิดเงิน', price: 'รวมราคาตัวเลือกเสริม (+) และคูณจำนวนให้ถูก', allergy: 'เมื่อลูกค้าบอกว่าแพ้อาหาร ให้ยืนยันว่าจะไม่ใส่ และแจ้งครัว', id: 'ขอดูบัตรทุกครั้งที่ลูกค้าสั่งแอลกอฮอล์', refuse: 'ถ้าลูกค้าอายุไม่ถึง 20 ปี ต้องปฏิเสธและเสนอแบบไม่มีแอลกอฮอล์', polite: 'ลงท้ายด้วย "ครับ/ค่ะ" ให้สม่ำเสมอ', efficiency: 'ถามหลายเรื่องพร้อมกัน เช่น "รับร้อนหรือเย็น หวานระดับไหนครับ?"' },
  },
  en: {
    goalDone: 'Sale completed with a correct order', goalErr: (n) => `Sale completed, but the read-back was wrong ${n} time(s)`, goalNot: 'Sale not completed yet',
    turns: (n, rp) => `${n} turn(s) used (${rp} repeated question(s))`,
    price: (e, n) => (n ? `Wrong price ${n} time(s) (correct: ${e} baht)` : `Correct price: ${e} baht`),
    safetyNote: { allergyOk: 'Handled the food allergy correctly', allergyMiss: "Didn't confirm the customer's allergy", idOk: 'Checked ID before serving alcohol', idMiss: 'Served alcohol without checking ID', underage: 'Served alcohol to someone under 20' },
    s: { greet: 'Greeted the customer warmly', multi: 'Asked several details in one question', readback: 'Read back the order correctly first time', price: 'Calculated the price correctly', allergy: 'Took good care of the allergy', id: 'Checked ID as required by law', refuse: 'Politely refused an underage customer', polite: 'Professional, polite language' },
    i: { greet: 'Start with a greeting, e.g. "Hi, welcome!"', repeat: 'Note what the customer says so you don\'t have to ask again', readback: 'Read back every detail before taking payment', price: 'Add the option surcharges (+) and multiply by the quantity', allergy: "When a customer mentions an allergy, confirm you'll leave it out", id: 'Always check ID when someone orders alcohol', refuse: 'If the customer is under 20, refuse politely and offer an alcohol-free option', polite: 'Keep your language polite and professional', efficiency: 'Ask about several things at once, e.g. "Hot or iced, and how sweet?"' },
  },
};

export function buildStaffDebrief({ language = 'th', scenario, turns = [], customer_state }) {
  const lang = language === 'en' ? 'en' : 'th';
  const d = D[lang];
  const sc = getScenario(scenario);
  const st = customer_state;
  const t = normalizeOrder(st.target);
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
  const underage = sc.ageCheck && st.profile.age < (sc.legalAge || 20);
  const alcoholOrdered = sc.ageCheck && (orderHasAlcohol(sc, t) || st.refused_alcohol);
  if (st.profile.allergies?.length) {
    safety = st.allergy_ack || (done && st.readback_ok) ? 100 : 40;
    safetyNote = safety === 100 ? d.safetyNote.allergyOk : d.safetyNote.allergyMiss;
  }
  if (alcoholOrdered) {
    safety = st.id_checked ? 100 : 30;
    safetyNote = st.id_checked ? d.safetyNote.idOk : d.safetyNote.idMiss;
    if (underage && orderHasAlcohol(sc, t)) { safety = 0; safetyNote = d.safetyNote.underage; }
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
  if (st.id_checked && alcoholOrdered) strengths.push(d.s.id);
  if (st.refused_alcohol) strengths.push(d.s.refuse);
  if (politeness != null && politeness >= 90) strengths.push(d.s.polite);
  if (st.repeats) improvements.push(d.i.repeat);
  if (st.readback_errors || !st.readback_ok) improvements.push(d.i.readback);
  if (st.price_errors) improvements.push(d.i.price);
  if (st.profile.allergies?.length && !st.allergy_ack) improvements.push(d.i.allergy);
  if (alcoholOrdered && !st.id_checked) improvements.push(d.i.id);
  if (underage && orderHasAlcohol(sc, t)) improvements.push(d.i.refuse);
  if (politeness != null && politeness < 80) improvements.push(d.i.polite);
  if (n > 5) improvements.push(d.i.efficiency);

  return {
    mode: 'staff', overall, stars, scores,
    notes: {
      goal: done ? (st.readback_errors ? d.goalErr(st.readback_errors) : d.goalDone) : d.goalNot,
      efficiency: d.turns(n, st.repeats),
      price: d.price(totalPrice(sc, t), st.price_errors),
      safety: safetyNote,
    },
    order_summary: (() => {
      const it = itemById(sc, t.item);
      const parts = [cardName(it, lang), ...it.groups.filter((g) => wanted(t, g)).map((g) => valName(g, t.options[g], lang)), ...t.modifiers.map((m) => modifierDef(m)[lang])];
      return `${parts.join(lang === 'en' ? ', ' : ' ')} ×${t.quantity} = ${totalPrice(sc, t)} ฿`;
    })(),
    customer_profile: st.profile,
    strengths, improvements,
  };
}
