// ตัวแยกความหมาย (Intent & Slot Extractor) แบบ rule-based ภาษาไทย + อังกฤษ — ใช้ในโหมด Offline
// หลักการ: หาคำจากพจนานุกรมของสถานการณ์ (เลือกคำที่ยาวที่สุดเมื่อซ้อนกัน เช่น "ถั่วฝักยาว" ชนะ "ถั่ว")
// แล้วตีความตามบริบทข้างหน้า: ปฏิเสธ ("ไม่ใส่...") / แพ้ ("แพ้...") / คำถาม ("มี...ไหม")
import { GROUPS, INGREDIENTS, ALLERGENS, MODIFIERS } from './scenarios.js';

const LATIN = /[a-z]/;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lexCache = new Map();

function lexicon(sc) {
  if (lexCache.has(sc.id)) return lexCache.get(sc.id);
  const E = [];
  const add = (kind, props, kws) => {
    for (const k of kws || []) {
      const w = (typeof k === 'string' ? k : k.w).toLowerCase();
      E.push({ kind, ...props, w, standalone: typeof k === 'object' && !!k.standalone, rank: E.length });
    }
  };
  for (const it of sc.menu) add('item', { id: it.id }, it.keywords);
  for (const g of new Set(sc.menu.flatMap((it) => it.groups))) {
    for (const [v, d] of Object.entries(GROUPS[g].values)) add('option', { group: g, value: v, allergen: d.allergen }, d.kw);
  }
  for (const id of sc.modifiers) add('mod', { id, allergens: MODIFIERS[id].allergens || [] }, MODIFIERS[id].kw);
  for (const [id, d] of Object.entries(INGREDIENTS)) add('ing', { id, allergen: d.allergen }, d.kw);
  for (const [id, d] of Object.entries(ALLERGENS)) add('allergen', { id, allergen: id }, d.kw);
  for (const gn of sc.generic || []) add('generic', { id: gn.key }, gn.kw);
  lexCache.set(sc.id, E);
  return E;
}

// คำตอบสั้นๆ ที่มีความหมายเฉพาะตอนถูกถาม เช่น "น้อย" ตอนถามความเผ็ด / "L" ตอนถามไซส์
function shortEntries(pending) {
  if (!GROUPS[pending]) return [];
  const out = [];
  for (const [v, d] of Object.entries(GROUPS[pending].values)) {
    for (const w of d.short || []) out.push({ kind: 'option', group: pending, value: v, allergen: d.allergen, w, rank: 1e6 + out.length });
  }
  return out;
}

// คำที่ใช้ได้เฉพาะเมื่ออยู่ท้ายวลี เช่น "พิเศษ" = จานพิเศษ แต่ "พิเศษไข่ดาว" = เพิ่มไข่ดาว
const STANDALONE_NEXT = /^\s*(ครับ|คับ|ค่ะ|คะ|นะ|จ้ะ|จ้า|หน่อย|จาน|please|[,.!?]|\d|หนึ่ง|สอง|สาม|$)/;

function findHits(t, entries) {
  const hits = [];
  for (const e of entries) {
    if (LATIN.test(e.w)) {
      const re = new RegExp(`(?<![a-z])${escapeRe(e.w)}(?:e?s)?(?![a-z])`, 'g');
      for (const m of t.matchAll(re)) hits.push({ ...e, start: m.index, end: m.index + m[0].length });
    } else {
      for (let i = t.indexOf(e.w); i !== -1; i = t.indexOf(e.w, i + 1)) hits.push({ ...e, start: i, end: i + e.w.length });
    }
  }
  const valid = hits.filter((h) => !h.standalone || STANDALONE_NEXT.test(t.slice(h.end)));
  valid.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.rank - b.rank);
  const accepted = [];
  for (const h of valid) if (!accepted.some((x) => h.start < x.end && x.start < h.end)) accepted.push(h);
  return accepted.sort((a, b) => a.start - b.start);
}

const BREAK = /(แล้วก็|แล้ว|แต่|เพิ่ม|พิเศษ|ขอ|,|\.|!|\?|ครับ|ค่ะ|คะ|(?<![a-z])(but|also|plus|extra|add|with(?!out)|please)(?![a-z]))/g;
const NEG = /(ไม่ใส่|ไม่เอา|ไม่ต้องใส่|ไม่ต้อง|ไม่|งด|(?<![a-z])(no|without|hold the|hold|don't|dont|do not|skip|minus|remove|leave out|not)(?![a-z]))/g;
const ALG = /(แพ้|(?<![a-z])(allergic to|allergic|allergy to|intolerant to|intolerant|can't eat|cannot eat|can not eat|can't have)(?![a-z]))/g;
const ASK_BEFORE = /(มี|contain|contains|any|is there|are there|have|has)\s*$/;
const ADD_BEFORE = /(ใส่|เอา|เพิ่ม|with|add)\s*$/;

function lastEnd(re, s) {
  let last = -1;
  re.lastIndex = 0;
  for (let m; (m = re.exec(s));) last = m.index + m[0].length;
  return last;
}

const listy = (h) => h.kind === 'ing' || h.kind === 'allergen';

// ข้อความหน้าคำที่สนใจ ตัดที่คำเชื่อม/คำก่อนหน้า (ยกเว้นเป็นรายการวัตถุดิบต่อกัน เช่น "ไม่ใส่ต้นหอม ผักชี")
function segmentBefore(t, hits, i) {
  const h = hits[i];
  let from = 0;
  for (let j = i - 1; j >= 0; j--) {
    if (!(listy(h) && listy(hits[j]))) { from = hits[j].end; break; }
  }
  const seg = t.slice(Math.max(from, h.start - 30), h.start);
  const cut = lastEnd(BREAK, seg);
  return cut >= 0 ? seg.slice(cut) : seg;
}

function contextOf(t, hits, i) {
  const h = hits[i];
  const seg = segmentBefore(t, hits, i);
  const after = t.slice(h.end, h.end + 14);
  const neg = lastEnd(NEG, seg);
  const alg = lastEnd(ALG, seg);
  if (alg >= 0 && alg >= neg) return { ctx: 'allergy', seg };
  if (/^\s*(allerg|intoleran)/.test(after) || (/^\s*ไม่ได้/.test(after) && seg.includes('กิน'))) return { ctx: 'allergy', seg };
  if (neg >= 0) return { ctx: 'neg', seg };
  if (/^\s*ออก/.test(after) && seg.includes('เอา')) return { ctx: 'neg', seg };
  return { ctx: 'pos', seg };
}

const NUMS = {
  'หนึ่ง': 1, 'นึง': 1, 'เดียว': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5,
  one: 1, two: 2, three: 3, four: 4, five: 5,
};
const UNIT = '(แก้ว|จาน|ที่|กล่อง|ชุด|cups?|glass(?:es)?|plates?|servings?|orders?|portions?|bowls?)';

function findQuantity(t) {
  const digit = t.match(new RegExp(`(\\d+)\\s*${UNIT}`));
  if (digit) return Math.min(10, Math.max(1, parseInt(digit[1], 10)));
  const th = t.match(/(หนึ่ง|นึง|เดียว|สอง|สาม|สี่|ห้า)\s*(แก้ว|จาน|ที่|กล่อง|ชุด)|(แก้ว|จาน|ที่|กล่อง|ชุด)\s*(หนึ่ง|นึง|เดียว|สอง|สาม|สี่|ห้า)/);
  if (th) return NUMS[th[1] || th[4]];
  const en = t.match(/(^|[^a-z])(one|two|three|four|five)([^a-z]|$)/);
  if (en) return NUMS[en[2]];
  const lead = t.match(/(^|[^a-z0-9])(\d)\s+[a-z]/);
  if (lead) return parseInt(lead[2], 10);
  return null;
}

const has = (t, words) => words.some((w) => t.includes(w));
const hasWord = (t, words) => words.some((w) => new RegExp(`(^|[^a-z])${escapeRe(w)}([^a-z]|$)`).test(t));

// ความสุภาพ: 100 = สุภาพชัดเจน, 70 = มีรูปแบบคำขอ, 50 = กลางๆ, 30 = ห้วน/สั่งการ
export function politenessScore(raw) {
  const t = raw.toLowerCase();
  if (has(t, ['ครับ', 'คับ', 'ค่ะ', 'คะ', 'ค่า', 'จ้า', 'please', 'thank', 'could i', 'may i', "i'd like", 'i would like', 'would you', 'could you'])) return 100;
  if (has(t, ['ขอ', 'รบกวน', 'หน่อย', 'ได้ไหม', 'ได้มั้ย', 'can i', 'can you'])) return 70;
  if (/^\s*(เอา|ให้|give me|i want|gimme)/.test(t)) return 30;
  return 50;
}

export function parseUtterance(raw, sc, pending = null) {
  const t = (raw || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const out = {
    text: t, empty: t.length === 0,
    item: null, options: {}, clearOptions: [],
    addMods: [], removeMods: [], exclude: [], unexclude: [], excludeAllergens: [],
    allergies: [], askIngredients: [], askAllergens: [], generic: null,
    mentions: [],
  };
  if (!t) return { ...out, politeness: null };

  const isQuestion = /(ไหม|มั้ย|หรือเปล่า|รึเปล่า|ป่าว|หรือไม่|\?)/.test(t) || /^(does|do|is|are|can|could)\b/.test(t);
  const hits = findHits(t, [...lexicon(sc), ...shortEntries(pending)]);
  const addAllergy = (a) => { if (a && !out.allergies.includes(a)) out.allergies.push(a); };

  hits.forEach((h, i) => {
    const { ctx, seg } = contextOf(t, hits, i);
    switch (h.kind) {
      case 'item':
        if (!out.item) out.item = h.id;
        out.mentions.push(`item:${h.id}`);
        break;
      case 'option': {
        if (ctx === 'allergy' && h.allergen) { addAllergy(h.allergen); break; }
        if (isQuestion && h.allergen && /(มี|contain|contains|any|is there|are there)\s*$/.test(seg)) { out.askAllergens.push(h.allergen); break; }
        if (ctx === 'neg' && !GROUPS[h.group].required) { out.clearOptions.push(h.group); break; }
        let value = h.value;
        const def = GROUPS[h.group].values[value];
        if (def.partial) {
          // "ไข่ดาว สุกๆ" → ไข่ดาวสุก
          const after = t.slice(h.end, h.end + 14).trim();
          const refined = def.refine
            .flatMap((rv) => (GROUPS[h.group].values[rv].short || []).map((s) => [rv, s]))
            .sort((a, b) => b[1].length - a[1].length)
            .find(([, s]) => after.startsWith(s));
          if (refined) value = refined[0];
        }
        out.options[h.group] = value;
        out.mentions.push(`opt:${h.group}:${value}`);
        break;
      }
      case 'mod':
        if (ctx === 'allergy') { h.allergens.forEach(addAllergy); break; }
        if (ctx === 'neg') { out.removeMods.push(h.id); break; }
        out.addMods.push(h.id);
        out.mentions.push(`mod:${h.id}`);
        break;
      case 'ing':
        if (ctx === 'allergy') { addAllergy(h.allergen); break; }
        if (ctx === 'neg') { out.exclude.push(h.id); out.mentions.push(`mod:no_${h.id}`); break; }
        if (isQuestion && (ASK_BEFORE.test(seg) || h.allergen)) { out.askIngredients.push(h.id); break; }
        if (ADD_BEFORE.test(seg)) out.unexclude.push(h.id);
        break;
      case 'allergen':
        if (ctx === 'allergy') { addAllergy(h.allergen); break; }
        if (ctx === 'neg') { out.excludeAllergens.push(h.allergen); break; }
        if (isQuestion) out.askAllergens.push(h.allergen);
        break;
      case 'generic':
        if (!out.generic) out.generic = h.id;
        break;
      default:
    }
  });
  if (out.item) out.generic = null;

  const yesWords = ['ใช่', 'ถูกต้อง', 'ถูกแล้ว', 'โอเค', 'ตามนั้น', 'ได้เลย', 'ครบแล้ว', 'เรียบร้อย', 'ยืนยัน', 'แค่นี้'];
  // "ไม่ใช่" มีคำว่า "ใช่" อยู่ข้างใน → ตรวจปฏิเสธก่อน
  const no = has(t, ['ไม่ใช่', 'ผิด', 'ไม่ถูก', 'ขอแก้', 'แก้ไข']) || hasWord(t, ['wrong', 'incorrect', 'not right']) || /^no\b/.test(t);
  const yes = !no && (has(t, yesWords)
    || hasWord(t, ['ok', 'okay', 'yes', 'yeah', 'yep', 'yup', 'correct', "that's right", 'thats right', 'sounds good', 'perfect', 'confirm', 'right'])
    || /^(ครับ|คับ|ค่ะ|คะ|ค่า|จ้า|จ้ะ)$/.test(t));
  return {
    ...out,
    quantity: findQuantity(t),
    greeting: has(t, ['สวัสดี', 'หวัดดี']) || hasWord(t, ['hello', 'hi', 'hey', 'good morning', 'good afternoon']),
    thanks: has(t, ['ขอบคุณ', 'ขอบใจ', 'thank']),
    askMenu: has(t, ['มีอะไรบ้าง', 'มีเมนูอะไร', 'เมนู', 'แนะนำ', 'อะไรอร่อย', 'ขายอะไร', 'menu', 'recommend', 'what do you have', 'what do you serve', 'what’s good', "what's good"]),
    askPrice: has(t, ['เท่าไหร่', 'เท่าไร', 'กี่บาท', 'ราคา', 'how much', 'price']),
    cancel: has(t, ['ยกเลิก', 'ไม่เอาแล้ว', 'เริ่มใหม่', 'cancel', 'start over', 'never mind']),
    safety: has(t, ['ปลอดภัย', 'แน่ใจ', 'มั่นใจ', 'รับรอง', 'แยกอุปกรณ์', 'แยกกระทะ', 'ปนเปื้อน', 'is it safe', 'safe for', 'make sure', 'are you sure', 'guarantee', 'cross contam', 'cross-contam', 'separate pan', 'separate utensil']),
    yes, no,
    politeness: politenessScore(t),
  };
}
