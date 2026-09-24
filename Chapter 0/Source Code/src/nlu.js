// ตัวแยกความหมายแบบ rule-based ภาษาไทย + อังกฤษ (ใช้ในโหมด Offline ไม่ต้องมี API key)
import { MENU } from './menu.js';

const NUMS = {
  'หนึ่ง': 1, 'นึง': 1, 'เดียว': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5,
  one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5,
};

const has = (text, words) => words.some((w) => text.includes(w));
const word = (text, w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(text);
const hasWord = (text, words) => words.some((w) => word(text, w));

function findItem(t) {
  // เลือกคีย์เวิร์ดที่ยาวที่สุดที่เจอ กันการชนกัน เช่น "ชาเย็น" vs "เย็น"
  let best = null;
  for (const item of MENU) {
    for (const kw of item.keywords) {
      const hit = /[a-z]/.test(kw) ? word(t, `${kw}(e?s)?`) : t.includes(kw);
      if (hit && (!best || kw.length > best.len)) best = { id: item.id, len: kw.length };
    }
  }
  return best?.id || null;
}

function findTemperature(t) {
  if (has(t, ['ปั่น', 'frappe', 'frappé', 'blended', 'smoothie', 'สมูทตี้'])) return 'frappe';
  if (has(t, ['เย็น', 'ไอซ์', 'น้ำแข็ง']) || hasWord(t, ['iced', 'ice', 'cold'])) return 'iced';
  if (has(t, ['ร้อน', 'อุ่น']) || hasWord(t, ['hot', 'warm'])) return 'hot';
  return null;
}

function findSweetness(t, pending) {
  if (has(t, ['ไม่หวาน', 'หวาน 0', 'หวาน0', 'หวานศูนย์', 'ไม่ใส่น้ำตาล', 'no sugar', 'unsweetened', 'sugar free', 'sugar-free', 'without sugar', 'not sweet'])) return 'none';
  if (has(t, ['หวานน้อย', 'หวาน 25', 'หวาน 50', 'หวานครึ่ง', 'หวานนิด', 'less sweet', 'less sugar', 'half sweet', 'half sugar', 'little sugar', 'a bit sweet', 'slightly sweet'])) return 'less';
  if (has(t, ['หวานมาก', 'หวานๆ', 'หวาน ๆ', 'หวานเพิ่ม', 'หวานจัด', 'extra sweet', 'extra sugar', 'more sugar', 'very sweet', 'sweeter'])) return 'extra';
  if (has(t, ['หวานปกติ', 'หวานกลาง', 'หวาน 100', 'หวานธรรมดา', 'normal sweet', 'regular sweet', 'normal sugar', 'regular sugar', 'standard sweet'])) return 'normal';
  if (pending === 'sweetness') {
    if (has(t, ['น้อย', 'นิดเดียว', 'ครึ่ง']) || hasWord(t, ['less', 'half', 'little'])) return 'less';
    if (has(t, ['มาก', 'เยอะ', 'เพิ่ม']) || hasWord(t, ['extra', 'more', 'very'])) return 'extra';
    if (has(t, ['ไม่', 'ศูนย์']) || hasWord(t, ['no', 'none', 'zero'])) return 'none';
    if (has(t, ['ปกติ', 'ธรรมดา', 'กลาง', 'หวาน']) || hasWord(t, ['normal', 'regular', 'standard', 'sweet'])) return 'normal';
  }
  return null;
}

function findSize(t, pending) {
  // ตัวอักษรเดี่ยว L/M ตีความเป็นไซส์เฉพาะตอนถูกถามไซส์ หรือพูดว่า "size L" (กันชนกับ I'm, it's)
  const letter = pending === 'size' || /size ?[lm]\b|ไซส์ ?[lm]/.test(t);
  if (has(t, ['ใหญ่', 'ไซส์แอล', '22 ออนซ์', '22 oz']) || hasWord(t, ['large', 'big', 'grande', 'venti']) || (letter && word(t, 'l'))) return 'large';
  if (has(t, ['ไซส์ปกติ', 'ขนาดปกติ', 'แก้วปกติ', 'ไซส์กลาง', 'ไซส์เล็ก', 'แก้วเล็ก', 'เล็ก', '16 ออนซ์', '16 oz', 'regular size', 'normal size'])
    || hasWord(t, ['medium', 'small', 'tall']) || (letter && word(t, 'm'))) return 'regular';
  // "ปกติ / regular" เฉยๆ ตีความเป็นไซส์ได้เมื่อบาริสต้ากำลังถามไซส์อยู่ (ไม่ใช่ถามความหวาน)
  if (pending === 'size' && (has(t, ['ปกติ', 'ธรรมดา', 'กลาง']) || hasWord(t, ['regular', 'normal']))) return 'regular';
  return null;
}

function findMilk(t) {
  if (has(t, ['โอ๊ต', 'โอ๊ท', 'โอ้ต', 'โอต', 'oat'])) return 'oat';
  if (has(t, ['ถั่วเหลือง', 'โซย่า', 'soy'])) return 'soy';
  if (!has(t, ['แพ้', 'allerg', 'no dairy']) && (has(t, ['นมวัว', 'นมสด', 'dairy', 'whole milk', 'fresh milk']))) return 'dairy';
  return null;
}

function findQuantity(t) {
  const digit = t.match(/(\d+)\s*(แก้ว|ที่|cups?|glass(es)?)/);
  if (digit) return Math.min(10, Math.max(1, parseInt(digit[1], 10)));
  const th = t.match(/(หนึ่ง|นึง|เดียว|สอง|สาม|สี่|ห้า)\s*(แก้ว|ที่)|(แก้ว|ที่)\s*(หนึ่ง|นึง|เดียว|สอง|สาม|สี่|ห้า)/);
  if (th) return NUMS[th[1] || th[4]];
  const en = t.match(/(^|[^a-z])(one|two|three|four|five)([^a-z]|$)/);
  if (en) return NUMS[en[2]];
  const lead = t.match(/(^|[^a-z0-9])(\d)\s+[a-z]/);
  if (lead) return parseInt(lead[2], 10);
  return null;
}

// ความสุภาพ: 100 = สุภาพชัดเจน, 70 = มีรูปแบบคำขอ, 50 = กลางๆ, 30 = ห้วน/สั่งการ
export function politenessScore(raw) {
  const t = raw.toLowerCase();
  const polite = has(t, ['ครับ', 'คับ', 'ค่ะ', 'คะ', 'ค่า', 'จ้า', 'please', 'thank', 'could i', 'may i', "i'd like", 'i would like', 'would you']);
  const request = has(t, ['ขอ', 'รบกวน', 'หน่อย', 'ได้ไหม', 'ได้มั้ย', 'can i', 'can i get', 'could you', 'can you']);
  if (polite) return 100;
  if (request) return 70;
  if (/^\s*(เอา|ให้|give me|i want|gimme)/.test(t)) return 30;
  return 50;
}

export function detectLang(raw) {
  return /[฀-๿]/.test(raw || '') ? 'th' : 'en';
}

export function parseUtterance(raw, pending = null) {
  const t = (raw || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const item = findItem(t);
  return {
    text: t,
    empty: t.length === 0,
    item,
    genericCoffee: !item && (t.includes('กาแฟ') || hasWord(t, ['coffee'])),
    genericTea: !item && (/ชา(?!ไทย|เขียว|เย็น|ร์จ)/.test(t) || hasWord(t, ['tea'])),
    temperature: findTemperature(t),
    sweetness: findSweetness(t, pending),
    size: findSize(t, pending),
    milk: findMilk(t),
    allergy: has(t, ['แพ้นม', 'แพ้แลคโตส', 'allergic', 'allergy', 'lactose', 'no dairy', 'dairy free', 'dairy-free']),
    quantity: findQuantity(t),
    greeting: has(t, ['สวัสดี', 'หวัดดี']) || hasWord(t, ['hello', 'hi', 'hey', 'good morning']),
    thanks: has(t, ['ขอบคุณ', 'ขอบใจ', 'thank']),
    askMenu: has(t, ['มีอะไรบ้าง', 'เมนู', 'แนะนำ', 'อะไรอร่อย', 'ขายอะไร', 'menu', 'recommend', 'what do you have', 'what do you serve']),
    askPrice: has(t, ['เท่าไหร่', 'เท่าไร', 'กี่บาท', 'ราคา', 'how much', 'price']),
    cancel: has(t, ['ยกเลิก', 'ไม่เอาแล้ว', 'เริ่มใหม่', 'cancel', 'start over', 'never mind']),
    politeness: t ? politenessScore(t) : null,
  };
}
