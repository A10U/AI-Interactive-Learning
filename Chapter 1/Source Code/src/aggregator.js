// Context Aggregator (Master Plan หัวข้อ 3.2): รวมข้อมูลจากทุกช่องทางในเทิร์นเดียว
//   🎤 Voice (user_speech) + ⌨️ Text (user_text) + 👉 Touch UI (user_action) + ☑️ Modifiers (user_selection)
// แล้วส่งต่อให้ Actor (พนักงาน) และ Coach (ผู้ประเมิน)
import { GROUPS, ALLERGENS } from './scenarios.js';
import { parseUtterance } from './nlu.js';

// target_id จากการแตะ: "food_04", "latte" หรือมีตัวเลือกนำหน้า เช่น "iced_latte" (แตะปุ่ม เย็น บนการ์ดเมนู)
export function resolveTarget(sc, raw) {
  const target = String(raw || '').replace(/^menu_/, '');
  for (const it of sc.menu) {
    if (target === it.id) return { item: it.id, options: {} };
    if (target.endsWith(`_${it.id}`)) {
      const prefix = target.slice(0, -(it.id.length + 1));
      const g = it.groups.find((x) => GROUPS[x].values[prefix]);
      return { item: it.id, options: g ? { [g]: prefix } : {} };
    }
  }
  return { item: null, options: {} };
}

export function aggregate(payload, sc, pending = null) {
  const turn = payload.current_turn || {};
  const sel = turn.user_selection || {};
  const selection = {
    options: sel.options && typeof sel.options === 'object' ? { ...sel.options } : {},
    modifiers: Array.isArray(sel.modifiers) ? sel.modifiers.map(String) : null, // null = ไม่ได้แตะ checkbox เลย
    allergies: Array.isArray(sel.allergies) ? sel.allergies.filter((a) => ALLERGENS[a]) : [],
  };
  const channels = {
    speech: !!turn.user_speech?.trim(),
    text: !!turn.user_text?.trim(),
    point: !!(turn.user_action?.type === 'point' && turn.user_action.target_id),
    select: Object.keys(selection.options).length > 0 || selection.modifiers !== null || selection.allergies.length > 0,
  };
  const utterance = [turn.user_speech, turn.user_text].filter((s) => s && s.trim()).join(' ');
  return {
    channels,
    utterance,
    parsed: parseUtterance(utterance, sc, pending),
    point: channels.point ? resolveTarget(sc, turn.user_action.target_id) : { item: null, options: {} },
    selection,
  };
}
