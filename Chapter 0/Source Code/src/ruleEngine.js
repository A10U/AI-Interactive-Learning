// Offline engine: Barista Persona + Coach Evaluator แบบ rule-based
// รับ payload ตามรูปแบบในเอกสารแผนงาน (หัวข้อ 3) แล้วคืนคำตอบบาริสต้า + สถานะออเดอร์ + ผลประเมินรายเทิร์น
import {
  MENU, TEMPS, SWEETNESS, SIZES, MILKS, NO_MILK_ITEMS,
  menuById, enName, emptyOrder, missingSlots, totalPrice, itemName, describeOrder,
} from './menu.js';
import { parseUtterance } from './nlu.js';

const L = {
  th: {
    greet: 'สวัสดีครับ ยินดีต้อนรับครับ',
    askItem: 'วันนี้รับเครื่องดื่มอะไรดีครับ?',
    askCoffee: 'ทางร้านมีเอสเปรสโซ่ อเมริกาโน่ ลาเต้ คาปูชิโน่ และมอคค่า ลูกค้ารับเป็นกาแฟตัวไหนดีครับ?',
    askTea: 'ชามีชาไทยกับชาเขียวนมครับ รับเป็นตัวไหนดีครับ?',
    askTemp: (name, temps) => `${name} มีแบบ${temps.map((k) => TEMPS[k].th).join(' ')} รับแบบไหนดีครับ?`,
    askSweet: 'ความหวานรับระดับไหนดีครับ?',
    askSize: `รับไซส์ปกติหรือไซส์ใหญ่ดีครับ? (ไซส์ใหญ่ +${SIZES.large.extra} บาท)`,
    askMilk: `ทางร้านมีนมโอ๊ต (+${MILKS.oat.extra} บาท) กับนมถั่วเหลือง (+${MILKS.soy.extra} บาท) รับเป็นนมแบบไหนดีครับ?`,
    allergyAck: `ได้เลยครับ ทางร้านเปลี่ยนเป็นนมโอ๊ตได้ บวกเพิ่ม ${MILKS.oat.extra} บาท หรือนมถั่วเหลือง บวกเพิ่ม ${MILKS.soy.extra} บาทครับ`,
    noMilkNeeded: (name) => `${name} ไม่มีนมเป็นส่วนผสมอยู่แล้ว ทานได้สบายใจครับ`,
    pointAck: (name) => `รับเป็น${name}ตัวนี้นะครับ`,
    ack: (d) => `ได้ครับ ${d}`,
    conflict: (pointed, said) => `ขอโทษครับ ลูกค้าชี้ที่${pointed} แต่ผมได้ยินว่า${said} รับเป็นตัวไหนดีครับ?`,
    tempNA: (name, temps) => `ขออภัยครับ ${name}ทางร้านมีแค่แบบ${temps.map((k) => TEMPS[k].th).join('/')}ครับ`,
    notUnderstood: 'ขอโทษครับ ผมยังไม่ค่อยเข้าใจ ลองบอกชื่อเมนู หรือชี้ที่ป้ายเมนูได้เลยครับ',
    noisy: 'ขอโทษครับ ในร้านเสียงดังไปหน่อย ผมได้ยินไม่ชัด รบกวนพูดอีกครั้ง หรือชี้ที่เมนูให้ดูได้ไหมครับ?',
    menuList: `เมนูของร้านมี ${MENU.map((m) => m.th).join(' ')} ครับ ถ้าชอบรสเข้มแนะนำอเมริกาโน่ ถ้าชอบนุ่มๆ แนะนำลาเต้ครับ`,
    price: (p) => `ตอนนี้ยอดรวม ${p} บาทครับ`,
    cancel: 'ได้ครับ ยกเลิกออเดอร์เดิมให้แล้ว เริ่มใหม่ได้เลยครับ',
    thanks: 'ยินดีครับ',
    done: (d, p) => `ได้ครับ ${d} ทั้งหมด ${p} บาทครับ รอรับที่เคาน์เตอร์ได้เลยครับ ☕`,
    alreadyDone: 'ออเดอร์ของลูกค้าเรียบร้อยแล้วครับ กดปุ่ม "สรุปผล" หรือ "เริ่มใหม่" ได้เลยครับ',
  },
  en: {
    greet: 'Hi there, welcome!',
    askItem: 'What can I get for you today?',
    askCoffee: 'We have espresso, americano, latte, cappuccino and mocha. Which coffee would you like?',
    askTea: 'For tea we have Thai milk tea and green milk tea. Which one would you like?',
    askTemp: (name, temps) => `Would you like your ${name} ${orList(temps.map((k) => TEMPS[k].en))}?`,
    askSweet: 'How sweet would you like it?',
    askSize: `Regular or large? (Large is +${SIZES.large.extra} baht)`,
    askMilk: `We have oat milk (+${MILKS.oat.extra} baht) and soy milk (+${MILKS.soy.extra} baht). Which would you prefer?`,
    allergyAck: `No problem! We can switch to oat milk for +${MILKS.oat.extra} baht or soy milk for +${MILKS.soy.extra} baht.`,
    noMilkNeeded: (name) => `Good news, the ${name} has no milk in it at all.`,
    pointAck: (name) => `The ${name}, this one? Sure.`,
    ack: (d) => `Sure, ${d}.`,
    conflict: (pointed, said) => `Sorry, you pointed at the ${pointed} but I heard "${said}". Which one would you like?`,
    tempNA: (name, temps) => `Sorry, our ${name} only comes ${temps.map((k) => TEMPS[k].en).join('/')}.`,
    notUnderstood: "Sorry, I didn't quite catch that. You can tell me the drink name or point at the menu.",
    noisy: "Sorry, it's a bit loud in here and I couldn't hear you. Could you say that again, or point at the menu?",
    menuList: `We have ${MENU.map((m) => m.en).join(', ')}. If you like it strong, try the americano; if you like it smooth, the latte is great.`,
    price: (p) => `Your total so far is ${p} baht.`,
    cancel: "Okay, I've cancelled that order. Let's start over.",
    thanks: "You're welcome!",
    done: (d, p) => `Great, that's ${d}. That'll be ${p} baht. It'll be ready at the counter shortly ☕`,
    alreadyDone: 'Your order is all set! Press "Debrief" or "Restart" whenever you like.',
  },
};

function orList(xs) {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`;
}

function nameOf(id, lang) {
  const m = menuById(id);
  if (!m) return id;
  return lang === 'en' ? enName(m) : m.th;
}

function askFor(slot, order, lang, parsed) {
  const s = L[lang];
  const item = menuById(order.item);
  switch (slot) {
    case 'item':
      if (parsed?.genericCoffee) return s.askCoffee;
      if (parsed?.genericTea) return s.askTea;
      return s.askItem;
    case 'milk': return s.askMilk;
    case 'temperature': return s.askTemp(lang === 'en' ? enName(item) : item.th, item.temps);
    case 'sweetness': return s.askSweet;
    case 'size': return s.askSize;
    default: return '';
  }
}

// ======================= Coach (ประเมินรายเทิร์น) =======================
const C = {
  th: {
    excellent: 'ดีเยี่ยม', good: 'ดี', improve: 'ต้องปรับปรุง',
    multi: 'ใช้การชี้ร่วมกับการพูด/พิมพ์ ช่วยลดความกำกวมได้รวดเร็วมาก',
    pointOnly: 'สื่อสารสำเร็จด้วยการชี้ (AAC ระดับพื้นฐาน)',
    pointOnlyTip: (name) => `ลองฝึกพูดชื่อเมนูเพิ่ม เช่น "ขอ${name}ครับ/ค่ะ"`,
    rich: (n) => `ให้ข้อมูลครบถึง ${n} อย่างในครั้งเดียว ชัดเจนมาก`,
    partial: (n) => `ได้ข้อมูลเพิ่ม ${n} อย่าง`,
    answered: 'ตอบคำถามบาริสต้าได้ตรงประเด็น',
    ambiguous: 'ข้อมูลยังกำกวม บาริสต้าต้องถามซ้ำ',
    ambiguousTip: 'ระบุชื่อเมนูให้ชัด เช่น ชนิดกาแฟ + ร้อน/เย็น + ความหวาน + ไซส์',
    nothing: 'บาริสต้ายังไม่ได้ข้อมูลที่ใช้สั่งเครื่องดื่ม',
    nothingTip: 'ลองบอกชื่อเมนู หรือแตะที่ป้ายเมนูช่วย',
    conflict: 'สิ่งที่ชี้กับสิ่งที่พูดไม่ตรงกัน',
    conflictTip: 'ตรวจให้แน่ใจว่าชี้และพูดถึงเมนูเดียวกัน',
    noisy: 'ร้านเสียงดัง เสียงพูดอย่างเดียวอาจไม่พอ',
    noisyTip: 'ในที่เสียงดัง ลองชี้เมนูหรือพิมพ์ช่วย จะสื่อสารได้แม่นยำขึ้น',
    allergy: 'แจ้งเงื่อนไขเฉพาะตัว (แพ้นม) ได้ชัดเจน เหมาะกับสถานการณ์',
    politeTip: 'เติมคำลงท้าย "ครับ/ค่ะ" หรือขึ้นต้นด้วย "ขอ..." จะฟังสุภาพขึ้น',
    completeTip: 'สั่งสำเร็จ! ครั้งหน้าลองบอกทุกอย่างในประโยคเดียวเพื่อให้เร็วขึ้น',
    allInOneTip: 'ครั้งหน้าลองบอก ร้อน/เย็น ความหวาน และไซส์ ไปพร้อมกันเลย',
  },
  en: {
    excellent: 'Excellent', good: 'Good', improve: 'Needs work',
    multi: 'Combining pointing with speech/text removed ambiguity quickly',
    pointOnly: 'Communicated successfully by pointing (basic AAC)',
    pointOnlyTip: (name) => `Try saying the drink name too, e.g. "Could I get a ${name}, please?"`,
    rich: (n) => `Gave ${n} pieces of information at once — very clear`,
    partial: (n) => `Added ${n} new piece(s) of information`,
    answered: 'Answered the barista\'s question directly',
    ambiguous: 'Still ambiguous — the barista had to ask again',
    ambiguousTip: 'Name the exact drink: type + hot/iced + sweetness + size',
    nothing: 'The barista didn\'t get any order information',
    nothingTip: 'Say the drink name, or tap the menu board to help',
    conflict: 'What you pointed at and what you said didn\'t match',
    conflictTip: 'Make sure you point at and mention the same drink',
    noisy: 'The café is noisy — speech alone may not be enough',
    noisyTip: 'In noisy places, point at the menu or type to be understood',
    allergy: 'Clearly communicated a personal need (dairy allergy)',
    politeTip: 'Add "please" or start with "Could I get..." to sound more polite',
    completeTip: 'Order complete! Next time try saying everything in one sentence',
    allInOneTip: 'Next time, mention hot/iced, sweetness and size together',
  },
};

function coach({ lang, channels, filled, parsed, conflict, noisy, notUnderstood, askedSlot, complete, order }) {
  const c = C[lang];
  const verbal = channels.speech || channels.text;
  const notes = [];
  let tip = '';
  let rating;

  if (noisy) { rating = 'improve'; notes.push(c.noisy); tip = c.noisyTip; }
  else if (conflict) { rating = 'improve'; notes.push(c.conflict); tip = c.conflictTip; }
  else if (channels.point && !verbal) {
    rating = 'good'; notes.push(c.pointOnly);
    tip = c.pointOnlyTip(lang === 'en' ? itemName(order, 'en') : itemName(order, 'th'));
  } else if (notUnderstood) {
    rating = 'improve';
    notes.push(parsed.genericCoffee || parsed.genericTea ? c.ambiguous : c.nothing);
    tip = parsed.genericCoffee || parsed.genericTea ? c.ambiguousTip : c.nothingTip;
  } else {
    if (channels.point && verbal && filled.length >= 2) { rating = 'excellent'; notes.push(c.multi); }
    else if (filled.length >= 3) { rating = 'excellent'; notes.push(c.rich(filled.length)); }
    else if (askedSlot && filled.includes(askedSlot)) { rating = 'good'; notes.push(c.answered); }
    else if (filled.length > 0) { rating = 'good'; notes.push(c.partial(filled.length)); }
    else { rating = 'improve'; notes.push(c.nothing); tip = c.nothingTip; }
    if (!tip) tip = complete ? c.completeTip : c.allInOneTip;
  }
  if (parsed.allergy) { notes.push(c.allergy); if (!conflict && !noisy) rating = 'excellent'; }

  const politeness = verbal ? parsed.politeness : null;
  if (politeness !== null && politeness < 70 && rating !== 'improve') tip = c.politeTip;

  let clarity;
  if (conflict || noisy) clarity = 40;
  else if (filled.length === 0) clarity = parsed.allergy ? 70 : 20;
  else clarity = Math.min(100, 55 + filled.length * 15);

  return { rating, label: c[rating], notes, tip, politeness, clarity, slots_filled: filled };
}

// ======================= Barista (สร้างคำตอบ + อัปเดตสถานะ) =======================
export function processTurn(payload, { rng = Math.random } = {}) {
  const lang = payload.language === 'en' ? 'en' : 'th';
  const s = L[lang];
  const prev = { ...emptyOrder(), ...(payload.order_state || {}) };
  const turn = payload.current_turn || {};
  const history = payload.dialogue_history || [];
  const channels = {
    speech: !!(turn.user_speech && turn.user_speech.trim()),
    text: !!(turn.user_text && turn.user_text.trim()),
    point: !!(turn.user_action && turn.user_action.type === 'point' && turn.user_action.target_id),
  };
  const utterance = [turn.user_speech, turn.user_text].filter(Boolean).join(' ');

  // บาริสต้ากำลังรอคำตอบสล็อตไหนอยู่ (ถามครั้งล่าสุด) — ใช้ตีความคำตอบสั้นๆ เช่น "ปกติ" / "regular"
  const askedSlot = history.some((h) => h.role === 'user') || prev.item ? missingSlots(prev)[0] || null : 'item';
  const parsed = parseUtterance(utterance, askedSlot);

  const result = (reply, order, actionState, extra = {}) => ({
    barista_reply: reply,
    action_state: actionState,
    order_state: order,
    total_price: totalPrice(order),
    coach: coach({ lang, channels, parsed, order, askedSlot, complete: order.is_complete, filled: [], ...extra }),
    engine: 'offline',
  });

  if (prev.is_complete) return result(s.alreadyDone, prev, 'serving', { filled: [] });

  if (parsed.cancel) return result(s.cancel, emptyOrder(), 'idle', { filled: [] });

  // สภาพแวดล้อม: ร้านเสียงดัง → เสียงพูดอย่างเดียวมีโอกาสฟังไม่ชัด
  const noiseChance = { quiet: 0, medium: 0.15, loud: 0.4 }[payload.environment_factors?.noise_level] ?? 0;
  if (channels.speech && !channels.point && !channels.text && rng() < noiseChance) {
    return result(s.noisy, prev, 'confused', { filled: [], noisy: true });
  }

  const order = { ...prev };
  const filled = [];
  const pre = [];
  const set = (slot, value) => {
    if (value == null) return;
    if (order[slot] !== value) { order[slot] = value; filled.push(slot); }
  };

  // รวม Context: การชี้ (Gesture) + คำพูด/ข้อความ
  // target_id อาจเป็น "latte" หรือ "iced_latte" (แตะที่ปุ่มร้อน/เย็น/ปั่นบนป้ายเมนู)
  const target = channels.point ? String(turn.user_action.target_id).replace(/^menu_/, '') : null;
  const tm = target && target.match(/^(hot|iced|frappe)_(.+)$/);
  const pointed = tm ? tm[2] : target;
  if (tm && !parsed.temperature) parsed.temperature = tm[1];
  if (pointed && parsed.item && pointed !== parsed.item) {
    return result(s.conflict(nameOf(pointed, lang), nameOf(parsed.item, lang)), prev, 'confused', { filled: [], conflict: true });
  }
  const newItem = pointed || parsed.item;
  if (newItem && newItem !== order.item) {
    // เปลี่ยนเมนู → ล้างอุณหภูมิที่ไม่รองรับ
    set('item', newItem);
    if (order.temperature && !menuById(newItem).temps.includes(order.temperature)) order.temperature = null;
  }
  if (parsed.allergy) { order.allergy = true; filled.push('allergy'); }
  set('milk', parsed.milk);
  set('sweetness', parsed.sweetness);
  set('size', parsed.size);
  if (parsed.quantity && parsed.quantity !== order.quantity) { order.quantity = parsed.quantity; filled.push('quantity'); }

  if (parsed.temperature) {
    const item = menuById(order.item);
    if (item && !item.temps.includes(parsed.temperature)) {
      pre.push(s.tempNA(lang === 'en' ? enName(item) : item.th, item.temps));
    } else set('temperature', parsed.temperature);
  }
  // เมนูที่มีแบบเดียว (เอสเปรสโซ่) เติมอุณหภูมิให้อัตโนมัติ
  const it = menuById(order.item);
  if (it && it.temps.length === 1 && !order.temperature) order.temperature = it.temps[0];

  // ประโยคตอบรับ
  const isFirstTurn = !history.some((h) => h.role === 'user');
  if (parsed.greeting && isFirstTurn && filled.length === 0) pre.unshift(s.greet);
  if (parsed.thanks && filled.length === 0) pre.unshift(s.thanks);
  if (parsed.allergy) {
    pre.push(order.item && NO_MILK_ITEMS.includes(order.item)
      ? s.noMilkNeeded(lang === 'en' ? enName(menuById(order.item)) : menuById(order.item).th)
      : s.allergyAck);
  }
  if (pointed && !channels.speech && !channels.text) {
    pre.push(s.pointAck(lang === 'en' ? itemName(order, 'en') : itemName(order, 'th')));
  } else if (filled.some((f) => f !== 'allergy') && order.item) {
    pre.push(s.ack(describeOrder(order, lang)));
  }
  if (parsed.askMenu && !order.item) pre.push(s.menuList);
  if (parsed.askPrice && order.item) pre.push(s.price(totalPrice(order)));

  const missing = missingSlots(order);
  if (missing.length === 0) {
    order.is_complete = true;
    const reply = s.done(describeOrder(order, lang), totalPrice(order));
    return {
      ...result(reply, order, 'making', { filled }),
    };
  }

  const notUnderstood = filled.length === 0 && !parsed.greeting && !parsed.askMenu && !parsed.askPrice && !parsed.thanks;
  if (notUnderstood && !(parsed.genericCoffee || parsed.genericTea)) pre.push(s.notUnderstood);
  pre.push(askFor(missing[0], order, lang, parsed));

  const actionState = notUnderstood ? 'confused' : channels.point ? 'looking' : 'asking';
  return result(pre.filter(Boolean).join(' '), order, actionState, { filled, notUnderstood });
}

export function openingLine(lang = 'th') {
  return `${L[lang].greet} ${L[lang].askItem}`;
}
