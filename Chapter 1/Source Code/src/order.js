// Order State: Slot Filling + ราคา + การตรวจสารก่อภูมิแพ้ (ใช้ร่วมกันทั้ง Offline engine, Claude engine และ Debrief)
import { GROUPS, INGREDIENTS, ALLERGENS, MODIFIERS } from './scenarios.js';

// phase: ordering (กำลังเก็บข้อมูล) → confirming (พนักงานทวนออเดอร์ รอลูกค้ายืนยัน) → complete
export function emptyOrder() {
  return { item: null, options: {}, modifiers: [], allergies: [], quantity: 1, phase: 'ordering', safety_notes: [], is_complete: false };
}

export function normalizeOrder(o) {
  const e = emptyOrder();
  if (!o || typeof o !== 'object') return e;
  return {
    ...e, ...o,
    options: { ...(o.options || {}) },
    modifiers: [...(o.modifiers || [])],
    allergies: [...(o.allergies || [])],
    safety_notes: [...(o.safety_notes || [])],
  };
}

export const itemById = (sc, id) => sc.menu.find((m) => m.id === id) || null;

export function modifierDef(id) {
  if (MODIFIERS[id]) return MODIFIERS[id];
  if (id?.startsWith('no_')) {
    const ing = INGREDIENTS[id.slice(3)];
    if (ing) return { type: 'exclude', ingredient: id.slice(3), th: `ไม่ใส่${ing.th}`, en: `no ${ing.en}`, extra: 0 };
  }
  return null;
}

export const removableOf = (sc, item) => [...(item?.removable || []), ...(sc.commonRemovable || [])];

export function applicableModifiers(sc, item) {
  if (!item) return [];
  return [...removableOf(sc, item).map((i) => `no_${i}`), ...sc.modifiers.filter((id) => MODIFIERS[id].applies(item))];
}

// ทุก modifier ที่เป็นไปได้ในสถานการณ์นี้ (ใช้ทำ JSON Schema)
export function allModifierIds(sc) {
  const ids = new Set(sc.modifiers);
  for (const it of sc.menu) removableOf(sc, it).forEach((i) => ids.add(`no_${i}`));
  return [...ids];
}

export function scenarioGroups(sc) {
  return [...new Set(sc.menu.flatMap((it) => it.groups))];
}

export function allowedValues(item, group) {
  return item?.values?.[group] || Object.keys(GROUPS[group].values);
}

export const valueDef = (group, value) => GROUPS[group]?.values?.[value] || null;

export function valueSafe(group, value, allergies = []) {
  const a = valueDef(group, value)?.allergen;
  return !a || !allergies.includes(a);
}

// ค่าที่พนักงานควรเสนอให้เลือก: ไม่รวมค่ากำกวม (partial) และค่าที่ลูกค้าแพ้
export function offerValues(item, group, allergies = []) {
  return allowedValues(item, group).filter((v) => !valueDef(group, v).partial && valueSafe(group, v, allergies));
}

// เปลี่ยนเมนู: ล้างตัวเลือกที่ไม่รองรับ + ใส่ค่าเริ่มต้นของเมนู
export function setItem(sc, order, id) {
  const item = itemById(sc, id);
  if (!item) return;
  order.item = id;
  for (const g of Object.keys(order.options)) {
    if (!item.groups.includes(g) || !allowedValues(item, g).includes(order.options[g])) delete order.options[g];
  }
  for (const g of item.groups) {
    if (order.options[g]) continue;
    const d = item.defaults?.[g] ?? GROUPS[g].default;
    if (d) order.options[g] = d;
    else if (GROUPS[g].required && allowedValues(item, g).length === 1) order.options[g] = allowedValues(item, g)[0];
  }
  const ok = applicableModifiers(sc, item);
  order.modifiers = order.modifiers.filter((m) => ok.includes(m));
}

export function missingSlots(sc, order) {
  const item = itemById(sc, order.item);
  if (!item) return ['item'];
  const miss = [];
  for (const g of item.groups) {
    const v = order.options[g];
    if (!v) { if (GROUPS[g].required) miss.push(g); } else if (valueDef(g, v)?.partial) miss.push(g);
  }
  return miss;
}

export function unitPrice(sc, order) {
  const item = itemById(sc, order.item);
  if (!item) return 0;
  let p = item.price;
  for (const [g, v] of Object.entries(order.options)) p += valueDef(g, v)?.extra || 0;
  for (const m of order.modifiers) p += modifierDef(m)?.extra || 0;
  return p;
}

export const totalPrice = (sc, order) => unitPrice(sc, order) * (order.quantity || 1);

export function prepMinutes(sc, order) {
  const item = itemById(sc, order.item);
  return item ? item.prep + ((order.quantity || 1) - 1) * 2 : 0;
}

// ราคาและชื่อที่แสดงบนป้ายเมนู (รวมเนื้อสัตว์ตั้งต้น เช่น ข้าวผัดกระเทียม + แซลมอน)
export function cardName(item, lang) {
  const p = item.defaults?.protein && valueDef('protein', item.defaults.protein);
  if (!p) return item[lang];
  return lang === 'en' ? `${p.en[0].toUpperCase()}${p.en.slice(1)} ${item.en}` : item.th + p.th;
}

export function cardPrice(item) {
  let p = item.price;
  for (const [g, v] of Object.entries(item.defaults || {})) p += valueDef(g, v)?.extra || 0;
  return p;
}

export const enLower = (s) => s.toLowerCase().replace(/\b(thai|hainanese)\b/g, (w) => w[0].toUpperCase() + w.slice(1));

export function itemLabel(sc, order, lang = 'th') {
  const item = itemById(sc, order.item);
  if (!item) return '';
  const p = valueDef('protein', order.options.protein);
  const t = valueDef('temperature', order.options.temperature);
  if (lang === 'en') {
    let n = enLower(item.en) + (item.kind === 'drink' && (order.quantity || 1) > 1 ? 's' : '');
    if (t) n = `${t.en} ${n}`;
    if (p) n += ` with ${p.en}`;
    return n;
  }
  return item.th + (p ? p.th : '') + (t ? t.th : '');
}

export function describeOrder(sc, order, lang = 'th') {
  const item = itemById(sc, order.item);
  if (!item) return '';
  const q = order.quantity || 1;
  const extras = [];
  for (const g of item.groups) {
    const v = order.options[g];
    if (!v || g === 'protein' || g === 'temperature' || (g === 'portion' && v === 'regular')) continue;
    extras.push(valueDef(g, v)[lang]);
  }
  for (const m of order.modifiers) extras.push(modifierDef(m)[lang]);
  if (lang === 'en') return [`${q === 1 ? 'one' : q} ${itemLabel(sc, order, 'en')}`, ...extras].join(', ');
  return [itemLabel(sc, order, 'th'), ...extras, `${q} ${sc.unit.th}`].join(' ');
}

export const allergenName = (a, lang) => ALLERGENS[a]?.[lang] || a;

export function listText(xs, lang) {
  if (xs.length <= 1) return xs.join('');
  if (lang === 'en') return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
  return `${xs.slice(0, -1).join(' ')} และ${xs[xs.length - 1]}`;
}

// ตรวจความขัดแย้งระหว่างออเดอร์กับอาการแพ้ — ใช้เป็น Safety Guard (ไม่พึ่ง LLM)
// kind: fixed (เอาออกไม่ได้ → ไม่ปลอดภัย), removable (ต้องสั่งไม่ใส่), option (ต้องเปลี่ยนตัวเลือก), addon (ต้องเอาออก)
export function allergyConflicts(sc, order, allergies = order.allergies) {
  const item = itemById(sc, order.item);
  const out = [];
  for (const a of allergies) {
    if (item) {
      for (const ing of item.fixed || []) if (INGREDIENTS[ing].allergen === a) out.push({ kind: 'fixed', allergen: a, ingredient: ing });
      for (const ing of removableOf(sc, item)) {
        if (INGREDIENTS[ing].allergen === a && !order.modifiers.includes(`no_${ing}`)) out.push({ kind: 'removable', allergen: a, ingredient: ing });
      }
    }
    for (const [g, v] of Object.entries(order.options)) {
      if (valueDef(g, v)?.allergen === a) out.push({ kind: 'option', allergen: a, group: g, value: v });
    }
    for (const m of order.modifiers) {
      if (MODIFIERS[m]?.allergens?.includes(a)) out.push({ kind: 'addon', allergen: a, modifier: m });
    }
  }
  return out;
}

// เมนูที่ทานได้อย่างปลอดภัยสำหรับอาการแพ้ที่ระบุ (ส่วนผสมที่เอาออกได้ถือว่าปลอดภัย)
export function safeItems(sc, allergies) {
  return sc.menu.filter((it) =>
    !(it.fixed || []).some((ing) => allergies.includes(INGREDIENTS[ing].allergen))
    && it.groups.every((g) => !GROUPS[g].required || offerValues(it, g, allergies).length > 0));
}

// เมนูนี้มีสารก่อภูมิแพ้ตัวนี้ไหม (ใช้ตอบคำถาม "มีถั่วไหม")
export function allergenInItem(sc, item, order, allergen) {
  const fixed = (item.fixed || []).filter((i) => INGREDIENTS[i].allergen === allergen);
  const removable = removableOf(sc, item).filter((i) => INGREDIENTS[i].allergen === allergen);
  const options = order.item === item.id
    ? Object.entries(order.options).filter(([g, v]) => valueDef(g, v)?.allergen === allergen).map(([g, v]) => valueDef(g, v))
    : [];
  return { fixed, removable, options, any: fixed.length + removable.length + options.length > 0 };
}
