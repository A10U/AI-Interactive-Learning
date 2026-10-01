// Domain Ontology ของร้านกาแฟ (เฟสที่ 1): เมนู ตัวเลือก และราคา — รองรับ 2 ภาษา (th / en)

export const MENU = [
  { id: 'espresso',   th: 'เอสเปรสโซ่', en: 'Espresso',        emoji: '☕', category: 'coffee', price: 45, temps: ['hot'],
    keywords: ['เอสเปรสโซ่', 'เอสเปรสโซ', 'เอสเพรสโซ', 'espresso', 'expresso'] },
  { id: 'americano',  th: 'อเมริกาโน่', en: 'Americano',       emoji: '🖤', category: 'coffee', price: 50, temps: ['hot', 'iced'],
    keywords: ['อเมริกาโน่', 'อเมริกาโน', 'americano', 'อเมริกัน', 'black coffee'] },
  { id: 'latte',      th: 'ลาเต้',      en: 'Latte',           emoji: '🥛', category: 'coffee', price: 55, temps: ['hot', 'iced', 'frappe'],
    keywords: ['ลาเต้', 'ลาเต', 'ลาเท่', 'latte', 'late'] },
  { id: 'cappuccino', th: 'คาปูชิโน่',   en: 'Cappuccino',      emoji: '☁️', category: 'coffee', price: 55, temps: ['hot', 'iced', 'frappe'],
    keywords: ['คาปูชิโน่', 'คาปูชิโน', 'คาปู', 'cappuccino', 'capuccino', 'cappucino'] },
  { id: 'mocha',      th: 'มอคค่า',     en: 'Mocha',           emoji: '🍫', category: 'coffee', price: 60, temps: ['hot', 'iced', 'frappe'],
    keywords: ['มอคค่า', 'มอคคา', 'ม็อคค่า', 'มอคา', 'mocha', 'mocca'] },
  { id: 'thai_tea',   th: 'ชาไทย',      en: 'Thai Milk Tea',   emoji: '🧡', category: 'tea',    price: 50, temps: ['hot', 'iced', 'frappe'],
    keywords: ['ชาไทย', 'ชาเย็น', 'ชานมเย็น', 'ชาส้ม', 'thai tea', 'thai milk tea'] },
  { id: 'green_tea',  th: 'ชาเขียวนม',  en: 'Green Milk Tea',  emoji: '🍵', category: 'tea',    price: 55, temps: ['hot', 'iced', 'frappe'],
    keywords: ['ชาเขียว', 'มัทฉะ', 'มัชฉะ', 'matcha', 'green tea', 'green milk tea'] },
  { id: 'cocoa',      th: 'โกโก้',      en: 'Cocoa',           emoji: '🍪', category: 'other',  price: 50, temps: ['hot', 'iced', 'frappe'],
    keywords: ['โกโก้', 'โกโก', 'ช็อกโกแลต', 'ช็อคโกแลต', 'cocoa', 'hot chocolate', 'chocolate'] },
];

export const TEMPS = {
  hot:    { th: 'ร้อน', en: 'hot',    extra: 0 },
  iced:   { th: 'เย็น', en: 'iced',   extra: 5 },
  frappe: { th: 'ปั่น', en: 'frappé', extra: 10 },
};

export const SWEETNESS = {
  none:   { th: 'ไม่หวาน',  en: 'no sugar' },
  less:   { th: 'หวานน้อย', en: 'less sweet' },
  normal: { th: 'หวานปกติ', en: 'normal sweetness' },
  extra:  { th: 'หวานมาก',  en: 'extra sweet' },
};

export const SIZES = {
  regular: { th: 'ไซส์ปกติ', en: 'regular size', oz: 16, extra: 0 },
  large:   { th: 'ไซส์ใหญ่', en: 'large size',   oz: 22, extra: 10 },
};

export const MILKS = {
  dairy: { th: 'นมวัว',        en: 'dairy milk', extra: 0 },
  oat:   { th: 'นมโอ๊ต',       en: 'oat milk',   extra: 15 },
  soy:   { th: 'นมถั่วเหลือง', en: 'soy milk',   extra: 10 },
};

// เมนูที่ไม่มีนมเป็นส่วนผสม (ไม่ต้องถามเรื่องนมแม้ลูกค้าแพ้นม)
export const NO_MILK_ITEMS = ['espresso', 'americano'];

export const menuById = (id) => MENU.find((m) => m.id === id) || null;

export function emptyOrder() {
  return { item: null, temperature: null, sweetness: null, size: null, milk: null, allergy: false, quantity: 1, is_complete: false };
}

export function missingSlots(order) {
  const missing = [];
  if (!order.item) missing.push('item');
  if (order.item && order.allergy && !order.milk && !NO_MILK_ITEMS.includes(order.item)) missing.push('milk');
  for (const s of ['temperature', 'sweetness', 'size']) if (!order[s]) missing.push(s);
  return missing;
}

export function unitPrice(order) {
  const item = menuById(order.item);
  if (!item) return 0;
  return item.price
    + (TEMPS[order.temperature]?.extra || 0)
    + (SIZES[order.size]?.extra || 0)
    + (MILKS[order.milk]?.extra || 0);
}

export const totalPrice = (order) => unitPrice(order) * (order.quantity || 1);

// ชื่อเมนูภาษาอังกฤษสำหรับใช้ในประโยค เช่น "iced latte", "Thai milk teas"
export const enName = (item, plural = false) =>
  item.en.toLowerCase().replace('thai', 'Thai') + (plural ? 's' : '');

export function itemName(order, lang = 'th') {
  const item = menuById(order.item);
  if (!item) return '';
  const temp = TEMPS[order.temperature];
  if (lang === 'en') {
    const name = enName(item, (order.quantity || 1) > 1);
    return temp ? `${temp.en} ${name}` : name;
  }
  return item.th + (temp ? temp.th : '');
}

export function describeOrder(order, lang = 'th') {
  const q = order.quantity || 1;
  const parts = [];
  if (lang === 'en') {
    parts.push(`${q === 1 ? 'one' : q} ${itemName(order, 'en')}`);
    if (order.milk && order.milk !== 'dairy') parts.push(`with ${MILKS[order.milk].en}`);
    if (order.sweetness) parts.push(SWEETNESS[order.sweetness].en);
    if (order.size) parts.push(SIZES[order.size].en);
    return parts.join(', ');
  }
  parts.push(itemName(order, 'th'));
  if (order.milk && order.milk !== 'dairy') parts.push(`เปลี่ยนเป็น${MILKS[order.milk].th}`);
  if (order.sweetness) parts.push(SWEETNESS[order.sweetness].th);
  if (order.size) parts.push(SIZES[order.size].th);
  parts.push(`${q} แก้ว`);
  return parts.join(' ');
}

// ภารกิจสำหรับโหมดเกม: เป้าหมายที่ผู้เรียนต้องสั่งให้ได้
export const MISSIONS = [
  { id: 'm1', th: 'ลาเต้เย็นสายสุขภาพ',  en: 'The Healthy Iced Latte', target: { item: 'latte', temperature: 'iced', sweetness: 'less', size: 'regular', quantity: 1 } },
  { id: 'm2', th: 'อเมริกาโน่ร้อนตอนเช้า', en: 'Morning Americano',      target: { item: 'americano', temperature: 'hot', sweetness: 'none', size: 'large', quantity: 1 } },
  { id: 'm3', th: 'ชาไทยปั่นให้เพื่อน',   en: 'Thai Tea for a Friend',  target: { item: 'thai_tea', temperature: 'frappe', sweetness: 'normal', size: 'regular', quantity: 2 } },
  { id: 'm4', th: 'แพ้นมวัว!',            en: 'Dairy Allergy!',         target: { item: 'cappuccino', temperature: 'iced', sweetness: 'less', size: 'regular', milk: 'oat', quantity: 1 } },
  { id: 'm5', th: 'มอคค่าหวานฉ่ำ',         en: 'Sweet Tooth Mocha',      target: { item: 'mocha', temperature: 'iced', sweetness: 'extra', size: 'large', quantity: 1 } },
  { id: 'm6', th: 'โกโก้ร้อนวันฝนตก',      en: 'Rainy Day Cocoa',        target: { item: 'cocoa', temperature: 'hot', sweetness: 'normal', size: 'regular', quantity: 1 } },
];
