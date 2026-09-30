// ข้อมูลตั้งต้นสำหรับหน้าเว็บ (/api/config) — ใช้ร่วมกันระหว่าง server.js และโหมด static (GitHub Pages)
// ไฟล์นี้ต้องไม่ import อะไรที่ใช้ได้เฉพาะ Node เพราะถูกโหลดในเบราว์เซอร์ด้วย
import { SCENARIO_LIST, GROUPS, ALLERGENS, INGREDIENTS } from './scenarios.js';
import { applicableModifiers, allModifierIds, modifierDef, cardName, cardPrice, removableOf } from './order.js';

// ข้อมูลสำหรับหน้าเว็บ (ตัด keywords และฟังก์ชันออก)
export function publicConfig(engine = 'offline') {
  const strip = ({ kw, short, ...v }) => v;
  return {
    engine,
    groups: Object.fromEntries(Object.entries(GROUPS).map(([g, d]) => [g, {
      th: d.th, en: d.en, required: d.required,
      values: Object.fromEntries(Object.entries(d.values).map(([k, v]) => [k, strip(v)])),
    }])),
    allergens: Object.fromEntries(Object.entries(ALLERGENS).map(([k, { kw, ...v }]) => [k, v])),
    scenarios: SCENARIO_LIST.map((sc) => ({
      id: sc.id, code: sc.code, icon: sc.icon, th: sc.th, en: sc.en, staff: sc.staff, unit: sc.unit, decor: sc.decor,
      focus: sc.focus, opening: sc.opening, allergyPanel: !!sc.allergyPanel, missions: sc.missions,
      modifiers: Object.fromEntries(allModifierIds(sc).map((id) => {
        const { kw, applies, ...d } = modifierDef(id);
        return [id, d];
      })),
      menu: sc.menu.map((it) => ({
        id: it.id, emoji: it.emoji, kind: it.kind, groups: it.groups,
        th: cardName(it, 'th'), en: cardName(it, 'en'), price: cardPrice(it),
        values: Object.fromEntries(it.groups.map((g) => [g, it.values?.[g] || Object.keys(GROUPS[g].values)])),
        modifiers: applicableModifiers(sc, it),
        allergens: [...new Set([...removableOf(sc, it), ...(it.fixed || [])].map((i) => INGREDIENTS[i].allergen).filter(Boolean))],
      })),
    })),
  };
}
