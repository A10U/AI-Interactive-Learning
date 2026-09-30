// Actor Agent (Offline): สวมบทบาทพนักงาน (บาริสต้า / พนักงานร้านอาหาร) แบบ rule-based
// State Machine: ordering (เก็บ Slot) → confirming (ทวนออเดอร์) → complete (แจ้งเวลาเตรียมอาหาร + ยอดชำระ)
import { GROUPS, INGREDIENTS, getScenario } from './scenarios.js';
import {
  emptyOrder, normalizeOrder, itemById, setItem, missingSlots, allowedValues, offerValues, applicableModifiers,
  removableOf, modifierDef, valueDef, totalPrice, prepMinutes, itemLabel, describeOrder, cardName, enLower,
  allergyConflicts, safeItems, allergenInItem, allergenName, listText,
} from './order.js';
import { aggregate } from './aggregator.js';
import { coachTurn } from './coachEngine.js';

const orList = (xs, lang) => {
  if (xs.length <= 1) return xs.join('');
  return lang === 'en' ? `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}` : `${xs.slice(0, -1).join(' ')} หรือ${xs[xs.length - 1]}`;
};

const L = {
  th: {
    greet: 'สวัสดีครับ',
    ask: {
      temperature: (n, o) => `${n}มีแบบ${o} รับแบบไหนดีครับ?`,
      milk: (n, o) => `ใช้นมแบบไหนดีครับ? มี${o}ครับ`,
      sweetness: (n, o) => `ความหวานรับระดับไหนดีครับ? (${o})`,
      size: (n, o) => `รับ${o}ดีครับ?`,
      protein: (n, o) => `${n}รับเป็นอะไรดีครับ? มี${o}ครับ`,
      spice: (n, o) => `ความเผ็ดเอาระดับไหนดีครับ? (${o})`,
      egg: (n, o) => `รับไข่แบบไหนดีครับ? (${o})`,
      portion: (n, o) => `รับจาน${o}ดีครับ?`,
    },
    refine: { egg: 'ไข่ดาวรับแบบสุก หรือไม่สุก (ยางมะตูม) ดีครับ?' },
    generic: (label, names) => `${label}ทางร้านมี ${names} ครับ รับตัวไหนดีครับ?`,
    pointAck: (d) => `${d} ตัวนี้นะครับ`,
    ack: (d) => `ได้ครับ ${d}`,
    conflict: (a, b) => `ขอโทษครับ ลูกค้าชี้ที่${a} แต่ผมได้ยินว่า${b} รับเป็นตัวไหนดีครับ?`,
    unavailable: (n, o) => `ขออภัยครับ ${n}มีแค่${o}ครับ`,
    notInDish: (ing, n) => `${n}ไม่ได้ใส่${ing}อยู่แล้วครับ`,
    cannotRemove: (ing, n) => `ขออภัยครับ ${ing}เป็นส่วนผสมหลักของ${n} เอาออกไม่ได้ครับ`,
    modNA: (m, n) => `ขออภัยครับ ${m}ใช้กับ${n}ไม่ได้ครับ`,
    allergyAck: (l) => `รับทราบครับ ลูกค้าแพ้${l} ผมจะแจ้งครัวให้ระวังเป็นพิเศษครับ`,
    safetyFixed: (n, ing, safe) => `ขออภัยจริงๆ ครับ ${n}มี${ing}เป็นส่วนผสมหลัก เอาออกไม่ได้ ไม่ปลอดภัยสำหรับลูกค้าครับ${safe ? ` แนะนำ${safe}แทนครับ` : ''}`,
    safetyRemovable: (n, ing) => `ปกติ${n}ใส่${ing} ทางครัวจะไม่ใส่ให้ และแยกอุปกรณ์ปรุงครับ`,
    safetyOption: (v, a) => `${v}เป็น${a} ไม่เหมาะกับลูกค้าครับ`,
    safetyAddon: (m, a) => `${m}มีส่วนผสมของ${a} ขอเอาออกจากออเดอร์ก่อนนะครับ`,
    hasFixed: (n, ing) => `${n}มี${ing}เป็นส่วนผสมหลักครับ`,
    hasRemovable: (n, ing) => `${n}ปกติใส่${ing}ครับ แต่ทางครัวงดให้ได้ครับ`,
    hasExcluded: (n, ing) => `${n}ปกติใส่${ing} แต่ออเดอร์นี้ไม่ใส่แล้วครับ`,
    hasNot: (n, what) => `${n}ไม่มี${what}ครับ`,
    safeList: (what, names) => `เมนูที่ไม่มี${what}หรือเอาออกได้ มี${names}ครับ`,
    safetyAssure: (l) => `มั่นใจได้ครับ ผมแจ้งครัวแล้วว่าลูกค้าแพ้${l} ทางครัวจะไม่ใส่วัตถุดิบนั้นและแยกอุปกรณ์ปรุงให้ครับ`,
    safetyAskBack: 'ลูกค้ามีอาการแพ้อาหารอะไรไหมครับ? แจ้งผมได้เลยครับ ทางครัวจะได้ระวังให้',
    readback: (d, note, p) => `ขอทวนออเดอร์นะครับ ${d}${note} ทั้งหมด ${p} บาท ถูกต้องไหมครับ?`,
    readbackAllergy: (l) => ` (แจ้งครัวแล้วว่าแพ้${l})`,
    confirmAgain: 'ออเดอร์ตามที่ทวนไปถูกต้องไหมครับ?',
    whatToFix: 'ได้ครับ ต้องการแก้ไขตรงไหนดีครับ?',
    done: (d, p, m) => `ขอบคุณครับ ${d} ยอดชำระ ${p} บาท ใช้เวลาเตรียมประมาณ ${m} นาทีครับ`,
    alreadyDone: 'ออเดอร์ของลูกค้าเรียบร้อยแล้วครับ กดปุ่ม "สรุปผล" หรือ "เริ่มใหม่" ได้เลยครับ',
    notUnderstood: 'ขอโทษครับ ผมยังไม่ค่อยเข้าใจ ลองบอกชื่อเมนู หรือชี้ที่ป้ายเมนูได้เลยครับ',
    noisy: 'ขอโทษครับ ในร้านเสียงดังไปหน่อย ผมได้ยินไม่ชัด รบกวนพูดอีกครั้ง หรือชี้ที่เมนูให้ดูได้ไหมครับ?',
    menuList: (names, rec) => `เมนูของร้านมี ${names} ครับ ${rec}`,
    price: (p) => `ตอนนี้ยอดรวม ${p} บาทครับ`,
    cancel: 'ได้ครับ ยกเลิกออเดอร์เดิมให้แล้ว เริ่มใหม่ได้เลยครับ',
    thanks: 'ยินดีครับ',
  },
  en: {
    greet: 'Hello!',
    ask: {
      temperature: (n, o) => `Would you like your ${n} ${o}?`,
      milk: (n, o) => `Which milk would you like — ${o}?`,
      sweetness: (n, o) => `How sweet would you like it — ${o}?`,
      size: (n, o) => `What size — ${o}?`,
      protein: (n, o) => `What would you like in your ${n} — ${o}?`,
      spice: (n, o) => `How spicy would you like it — ${o}?`,
      egg: (n, o) => `How would you like your egg — ${o}?`,
      portion: (n, o) => `Would you like a ${o}?`,
    },
    refine: { egg: 'How would you like your fried egg — well done or runny?' },
    generic: (label, names) => `For ${label} we have ${names}. Which one would you like?`,
    pointAck: (d) => `The ${d}, this one? Sure.`,
    ack: (d) => `Sure, ${d}.`,
    conflict: (a, b) => `Sorry, you pointed at the ${a} but I heard "${b}". Which one would you like?`,
    unavailable: (n, o) => `Sorry, the ${n} only comes ${o}.`,
    notInDish: (ing, n) => `The ${n} doesn't have ${ing} in it anyway.`,
    cannotRemove: (ing, n) => `Sorry, ${ing} is a main ingredient of the ${n} — we can't leave it out.`,
    modNA: (m, n) => `Sorry, ${m} isn't available for the ${n}.`,
    allergyAck: (l) => `Noted — you're allergic to ${l}. I'll let the kitchen know to be extra careful.`,
    safetyFixed: (n, ing, safe) => `I'm really sorry — the ${n} has ${ing} as a main ingredient and we can't remove it, so it isn't safe for you.${safe ? ` I'd suggest ${safe} instead.` : ''}`,
    safetyRemovable: (n, ing) => `The ${n} normally comes with ${ing}; the kitchen will leave it out and use separate utensils.`,
    safetyOption: (v, a) => `The ${v} counts as ${a}, so it isn't suitable for you.`,
    safetyAddon: (m, a) => `The ${m} contains ${a}, so I've taken it off the order.`,
    hasFixed: (n, ing) => `The ${n} has ${ing} as a main ingredient.`,
    hasRemovable: (n, ing) => `The ${n} normally has ${ing}, but the kitchen can leave it out.`,
    hasExcluded: (n, ing) => `The ${n} normally has ${ing}, but it's already left out of your order.`,
    hasNot: (n, what) => `The ${n} doesn't contain any ${what}.`,
    safeList: (what, names) => `Dishes without ${what} (or where we can leave it out): ${names}.`,
    safetyAssure: (l) => `Absolutely — I've told the kitchen about your ${l} allergy. They'll leave it out and use separate utensils.`,
    safetyAskBack: 'Do you have any food allergies? Just let me know and the kitchen will take care.',
    readback: (d, note, p) => `Let me read that back: ${d}${note}. That's ${p} baht in total — is that correct?`,
    readbackAllergy: (l) => ` (kitchen informed of your ${l} allergy)`,
    confirmAgain: 'Is the order I read back correct?',
    whatToFix: 'Of course — what would you like to change?',
    done: (d, p, m) => `Thank you! ${d[0].toUpperCase()}${d.slice(1)} — that's ${p} baht, and it'll take about ${m} minutes.`,
    alreadyDone: 'Your order is all set! Press "Debrief" or "Restart" whenever you like.',
    notUnderstood: "Sorry, I didn't quite catch that. You can tell me the name, or point at the menu.",
    noisy: "Sorry, it's a bit loud in here and I couldn't hear you. Could you say that again, or point at the menu?",
    menuList: (names, rec) => `We have ${names}. ${rec}`,
    price: (p) => `Your total so far is ${p} baht.`,
    cancel: "Okay, I've cancelled that order. Let's start over.",
    thanks: "You're welcome!",
  },
};

const fmtValue = (g, v, lang) => {
  const d = valueDef(g, v);
  return d.extra ? `${d[lang]} (+${d.extra})` : d[lang];
};

function askFor(sc, order, slot, lang, parsed) {
  const S = L[lang];
  if (slot === 'item') {
    const gn = parsed.generic && sc.generic.find((g) => g.key === parsed.generic);
    if (gn) return S.generic(gn[lang], listText(sc.menu.filter(gn.filter).map((it) => cardName(it, lang)), lang));
    return sc.askItem[lang];
  }
  const it = itemById(sc, order.item);
  if (valueDef(slot, order.options[slot])?.partial) return S.refine[slot];
  const opts = offerValues(it, slot, order.allergies).map((v) => fmtValue(slot, v, lang));
  return S.ask[slot](lang === 'en' ? enLower(it.en) : it.th, orList(opts, lang));
}

const nameOf = (sc, id, lang) => { const it = itemById(sc, id); return it ? cardName(it, lang) : id; };
const ingName = (ing, lang) => INGREDIENTS[ing][lang];
const uniq = (xs) => [...new Set(xs)];

// Safety Guard: บังคับให้ออเดอร์ปลอดภัยตามอาการแพ้ที่ลูกค้าแจ้ง — ใช้ทั้งกับ Offline และหลัง Claude ตอบ
export function enforceSafety(sc, order, lang) {
  const S = L[lang];
  const conflicts = allergyConflicts(sc, order);
  if (!conflicts.length) return { messages: [], changed: false, unsafeItem: false };
  const names = (as) => listText(uniq(as).map((a) => allergenName(a, lang)), lang);
  const messages = [];
  const item = itemById(sc, order.item);
  const label = item ? (lang === 'en' ? itemLabel(sc, order, 'en') : itemLabel(sc, order, 'th')) : '';

  const fixed = conflicts.filter((k) => k.kind === 'fixed');
  if (fixed.length) {
    const safe = safeItems(sc, order.allergies).slice(0, 3).map((it) => cardName(it, lang));
    messages.push(S.safetyFixed(label, listText(uniq(fixed.map((k) => ingName(k.ingredient, lang))), lang), orList(safe, lang)));
    order.item = null;
    order.options = {};
    order.modifiers = order.modifiers.filter((m) => MODIFIER_ANY_ITEM.has(m));
    return { messages, changed: true, unsafeItem: true };
  }
  const removable = uniq(conflicts.filter((k) => k.kind === 'removable').map((k) => k.ingredient));
  if (removable.length) {
    removable.forEach((ing) => order.modifiers.push(`no_${ing}`));
    const fresh = removable.filter((ing) => !order.safety_notes.includes(ing));
    order.safety_notes.push(...fresh);
    if (fresh.length) messages.push(S.safetyRemovable(label, listText(fresh.map((i) => ingName(i, lang)), lang)));
  }
  for (const k of conflicts.filter((x) => x.kind === 'option')) {
    delete order.options[k.group];
    messages.push(S.safetyOption(valueDef(k.group, k.value)[lang], names([k.allergen])));
  }
  for (const k of conflicts.filter((x) => x.kind === 'addon')) {
    if (!order.modifiers.includes(k.modifier)) continue;
    order.modifiers = order.modifiers.filter((m) => m !== k.modifier);
    messages.push(S.safetyAddon(modifierDef(k.modifier)[lang], names([k.allergen])));
  }
  return { messages, changed: true, unsafeItem: false };
}
const MODIFIER_ANY_ITEM = new Set(['takeaway']);

// ผู้เรียนทวนออเดอร์เองหรือไม่: พูดชื่อเมนู + รายละเอียดอย่างน้อย 60% ของออเดอร์
export function recapOf(sc, order, parsed) {
  if (!order.item) return false;
  const parts = [
    `item:${order.item}`,
    ...Object.entries(order.options).filter(([g, v]) => !(g === 'portion' && v === 'regular')).map(([g, v]) => `opt:${g}:${v}`),
    ...order.modifiers.map((m) => `mod:${m}`),
  ];
  const said = new Set(parsed.mentions);
  if (!said.has(`item:${order.item}`) || parts.length < 2) return false;
  return parts.filter((p) => said.has(p)).length / parts.length >= 0.6;
}

// justNoted = วัตถุดิบที่ Safety Guard เพิ่งแจ้งลูกค้าไปในเทิร์นนี้ (ไม่ต้องตอบซ้ำ)
function answerQuestions(sc, order, parsed, point, lang, justNoted = []) {
  const S = L[lang];
  const out = [];
  const focus = itemById(sc, order.item) || itemById(sc, point.item);
  const fName = focus ? (order.item === focus.id ? itemLabel(sc, order, lang) : cardName(focus, lang)) : '';
  const allergens = uniq([...parsed.askAllergens, ...parsed.askIngredients.map((i) => INGREDIENTS[i].allergen).filter(Boolean)]);
  for (const a of allergens) {
    const what = allergenName(a, lang);
    if (!focus) {
      out.push(S.safeList(what, listText(safeItems(sc, [a]).map((it) => cardName(it, lang)), lang)));
      continue;
    }
    const r = allergenInItem(sc, focus, order, a);
    if (!r.any) out.push(S.hasNot(fName, what));
    else if (r.fixed.length) out.push(S.hasFixed(fName, listText(r.fixed.map((i) => ingName(i, lang)), lang)));
    else if (r.options.length) out.push(S.hasFixed(fName, listText(r.options.map((d) => d[lang]), lang)));
    else if (r.removable.every((i) => justNoted.includes(i))) continue;
    else {
      const excluded = order.item === focus.id ? r.removable.filter((i) => order.modifiers.includes(`no_${i}`)) : [];
      const list = listText(r.removable.map((i) => ingName(i, lang)), lang);
      out.push(excluded.length === r.removable.length ? S.hasExcluded(fName, list) : S.hasRemovable(fName, list));
    }
  }
  for (const ing of parsed.askIngredients.filter((i) => !INGREDIENTS[i].allergen)) {
    if (!focus) continue;
    const name = ingName(ing, lang);
    if ((focus.fixed || []).includes(ing)) out.push(S.hasFixed(fName, name));
    else if (removableOf(sc, focus).includes(ing)) out.push(S.hasRemovable(fName, name));
    else out.push(S.hasNot(fName, name));
  }
  if (parsed.safety) {
    out.push(order.allergies.length
      ? S.safetyAssure(listText(order.allergies.map((a) => allergenName(a, lang)), lang))
      : S.safetyAskBack);
  }
  return out;
}

export function processTurn(payload, { rng = Math.random } = {}) {
  const sc = getScenario(payload.scenario);
  const lang = payload.language === 'en' ? 'en' : 'th';
  const S = L[lang];
  const prev = normalizeOrder(payload.order_state);
  const history = payload.dialogue_history || [];
  const userTurns = history.filter((h) => h.role === 'user').length;
  // พนักงานกำลังรอคำตอบเรื่องอะไรอยู่ — ใช้ตีความคำตอบสั้นๆ เช่น "น้อย" / "สุกๆ" / "regular"
  const askedSlot = prev.phase === 'confirming' ? 'confirm' : (userTurns || prev.item ? missingSlots(sc, prev)[0] || null : 'item');
  const { channels, parsed, point, selection } = aggregate(payload, sc, askedSlot);
  const profile = payload.learner_profile || null;

  const respond = (reply, order, actionState, extra = {}) => {
    order.is_complete = order.phase === 'complete';
    return {
      actor_reply: reply,
      action_state: actionState,
      order_state: order,
      total_price: totalPrice(sc, order),
      prep_minutes: order.is_complete ? prepMinutes(sc, order) : null,
      coach: coachTurn({ lang, sc, channels, parsed, order, prev, askedSlot, profile, ...extra }),
      engine: 'offline',
    };
  };
  const say = (parts) => parts.filter(Boolean).join(' ');

  if (prev.phase === 'complete') return respond(S.alreadyDone, prev, 'serving');
  if (parsed.cancel) return respond(S.cancel, emptyOrder(), 'idle');

  // สภาพแวดล้อม: ร้านเสียงดัง → พูดอย่างเดียวมีโอกาสฟังไม่ชัด
  const noiseChance = { quiet: 0, medium: 0.15, loud: 0.4 }[payload.environment_factors?.noise_level] ?? 0;
  if (channels.speech && !channels.point && !channels.text && !channels.select && rng() < noiseChance) {
    return respond(S.noisy, prev, 'confused', { noisy: true });
  }
  if (point.item && parsed.item && point.item !== parsed.item) {
    return respond(S.conflict(nameOf(sc, point.item, lang), nameOf(sc, parsed.item, lang)), prev, 'confused', { conflict: true });
  }

  const order = normalizeOrder(prev);
  const changes = [];
  const pre = [];
  const mark = (k) => { if (!changes.includes(k)) changes.push(k); };
  const item = () => itemById(sc, order.item);
  const itemName = () => (lang === 'en' ? enLower(item().en) : item().th);

  // 1) เมนู: การชี้ (Touch UI) มาก่อนคำพูด
  const newItem = point.item || parsed.item;
  if (newItem && newItem !== order.item) { setItem(sc, order, newItem); mark('item'); }

  // 2) ตัวเลือก Slot: การชี้ปุ่มย่อย → คำพูด/ข้อความ → Checkbox/Chip (ค่าหลังสุดชนะ)
  for (const [g, v] of Object.entries({ ...point.options, ...parsed.options, ...selection.options })) {
    if (!valueDef(g, v)) continue;
    const it = item();
    if (it && !it.groups.includes(g)) continue;
    if (it && !allowedValues(it, g).includes(v)) {
      pre.push(S.unavailable(itemName(), orList(offerValues(it, g, order.allergies).map((x) => valueDef(g, x)[lang]), lang)));
      continue;
    }
    if (order.options[g] !== v) { order.options[g] = v; mark(g); }
  }
  for (const g of parsed.clearOptions) {
    if (order.options[g] && !GROUPS[g].required) { delete order.options[g]; mark(g); }
  }

  // 3) Modifiers: "ไม่ใส่...", คำขอพิเศษ, ของเพิ่ม และ Checkbox
  const addMod = (m) => { if (!order.modifiers.includes(m)) { order.modifiers.push(m); mark(m); } };
  const delMod = (m) => { if (order.modifiers.includes(m)) { order.modifiers = order.modifiers.filter((x) => x !== m); mark(m); } };
  const tryAdd = (m) => {
    const it = item();
    if (!it || applicableModifiers(sc, it).includes(m)) { addMod(m); return; }
    const def = modifierDef(m);
    if (def?.type === 'exclude') {
      pre.push((it.fixed || []).includes(def.ingredient)
        ? S.cannotRemove(ingName(def.ingredient, lang), itemName())
        : S.notInDish(ingName(def.ingredient, lang), itemName()));
    } else if (def) pre.push(S.modNA(def[lang], itemName()));
  };
  // Checkbox = ชุดตัวเลือกทั้งหมดที่ติ๊กไว้ → ใช้ก่อน แล้วค่อยเพิ่มสิ่งที่พูด/พิมพ์ในเทิร์นเดียวกัน
  if (selection.modifiers) {
    const ok = item() ? applicableModifiers(sc, item()) : null;
    const want = selection.modifiers.filter((m) => modifierDef(m) && (!ok || ok.includes(m)));
    // สิ่งที่ถูกเอาออกเพราะอาการแพ้ ต้องคงไว้แม้ผู้เรียนเอาติ๊กออก
    const forced = (m) => m.startsWith('no_') && order.allergies.includes(INGREDIENTS[m.slice(3)]?.allergen);
    [...order.modifiers].forEach((m) => { if (!want.includes(m) && !forced(m)) delMod(m); });
    want.forEach(addMod);
  }
  parsed.exclude.forEach((ing) => tryAdd(`no_${ing}`));
  parsed.excludeAllergens.forEach((a) => {
    if (item()) removableOf(sc, item()).filter((i) => INGREDIENTS[i].allergen === a).forEach((i) => addMod(`no_${i}`));
  });
  parsed.unexclude.forEach((ing) => delMod(`no_${ing}`));
  parsed.addMods.forEach(tryAdd);
  parsed.removeMods.forEach(delMod);

  // 4) อาการแพ้ + จำนวน
  const newAllergies = uniq([...parsed.allergies, ...selection.allergies]).filter((a) => !order.allergies.includes(a));
  if (newAllergies.length) {
    order.allergies.push(...newAllergies);
    mark('allergy');
    pre.push(S.allergyAck(listText(newAllergies.map((a) => allergenName(a, lang)), lang)));
  }
  if (parsed.quantity && parsed.quantity !== order.quantity) { order.quantity = parsed.quantity; mark('quantity'); }

  // 5) Safety Guard + ตอบคำถามเรื่องส่วนผสม
  const notedBefore = order.safety_notes.length;
  const safety = enforceSafety(sc, order, lang);
  pre.push(...safety.messages);
  const answers = answerQuestions(sc, order, parsed, point, lang, order.safety_notes.slice(notedBefore));
  pre.push(...answers);

  const firstTurn = userTurns === 0;
  if (parsed.greeting && firstTurn && !changes.length) pre.unshift(S.greet);
  if (parsed.thanks && !changes.length) pre.unshift(S.thanks);
  if (parsed.askMenu && !order.item) pre.push(S.menuList(listText(sc.menu.map((it) => cardName(it, lang)), lang), sc.recommend[lang]));
  if (parsed.askPrice && order.item) pre.push(S.price(totalPrice(sc, order)));

  // 6) State Machine
  const missing = missingSlots(sc, order);
  const changed = changes.length > 0;
  const recap = recapOf(sc, order, parsed);

  if (prev.phase === 'confirming' && !changed && missing.length === 0) {
    if (parsed.yes || recap) {
      order.phase = 'complete';
      return respond(say([...pre, S.done(describeOrder(sc, order, lang), totalPrice(sc, order), prepMinutes(sc, order))]), order, 'making', { completed: true, recap });
    }
    if (parsed.no) {
      order.phase = 'ordering';
      return respond(say([...pre, S.whatToFix]), order, 'asking');
    }
    return respond(say([...pre, S.confirmAgain]), order, 'confirming', { changes });
  }

  if (missing.length) {
    order.phase = 'ordering';
    const verbal = channels.speech || channels.text;
    if (channels.point && !verbal && order.item && !safety.unsafeItem) pre.push(S.pointAck(itemLabel(sc, order, lang)));
    else if (changes.some((c) => c !== 'allergy') && order.item) pre.push(S.ack(describeOrder(sc, order, lang)));
    const informative = changed || parsed.greeting || parsed.askMenu || parsed.askPrice || parsed.thanks || answers.length > 0;
    const notUnderstood = !informative;
    if (notUnderstood && !parsed.generic) pre.push(S.notUnderstood);
    pre.push(askFor(sc, order, missing[0], lang, parsed));
    const action = safety.messages.length ? 'warning' : notUnderstood ? 'confused' : channels.point ? 'looking' : 'asking';
    return respond(say(pre), order, action, { changes, notUnderstood });
  }

  // ข้อมูลครบ → ทวนออเดอร์ (Actor ทวน, ผู้เรียนยืนยันหรือทวนซ้ำ)
  order.phase = 'confirming';
  const note = order.allergies.length ? S.readbackAllergy(listText(order.allergies.map((a) => allergenName(a, lang)), lang)) : '';
  pre.push(S.readback(describeOrder(sc, order, lang), note, totalPrice(sc, order)));
  return respond(say(pre), order, safety.messages.length ? 'warning' : 'confirming', { changes });
}

// ประโยคทวนออเดอร์มาตรฐาน (Claude engine ใช้เมื่อ Guard ต้องบังคับให้ทวนก่อนปิดออเดอร์)
export function readbackLine(sc, order, lang) {
  const S = L[lang];
  const note = order.allergies.length ? S.readbackAllergy(listText(order.allergies.map((a) => allergenName(a, lang)), lang)) : '';
  return S.readback(describeOrder(sc, order, lang), note, totalPrice(sc, order));
}

export function openingLine(scenarioId, lang = 'th') {
  return getScenario(scenarioId).opening[lang];
}
