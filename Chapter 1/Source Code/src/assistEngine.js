// Assist Bot (ตัวช่วย): ช่วยผู้เรียนเมื่อคุยกับ AI แล้วติด — ทำงานแบบ Offline เสมอ (เร็ว ไม่ต้องใช้ API)
//   1) 🧭 บอกว่าตอนนี้อีกฝ่ายถามอะไร / ควรทำอะไรต่อ
//   2) 📖 อธิบายคำศัพท์เฉพาะในประโยคล่าสุด (เช่น มีเดียมแรร์, เวอร์จิ้น, ทงคตสึ)
//   3) 💬 ประโยคตัวอย่างให้แตะใช้ได้ทันที (⭐ = ตรงกับภารกิจ)
//   4) 🎯 ประโยคเต็มแบบเฉลย (ซ่อนไว้ ผู้เรียนกดดูเอง)
// ใช้ได้ทั้งโหมดลูกค้า (ผู้เรียนสั่ง) และโหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน)
import { GROUPS, INGREDIENTS, getScenario } from './scenarios.js';
import {
  normalizeOrder, itemById, missingSlots, offerValues, valueDef, valueExtra, modifierDef, totalPrice, unitPrice,
  describeOrder, cardName, enLower, allergenName, listText, orderHasAlcohol, safeItems,
} from './order.js';
import { askFor } from './actorEngine.js';

// คำอธิบายศัพท์เฉพาะ (group.value)
const GLOSS = {
  'doneness.rare': { th: 'สุกน้อยที่สุด ข้างในยังแดงและชุ่มฉ่ำ', en: 'barely cooked — red and juicy inside' },
  'doneness.medium_rare': { th: 'สุกน้อย ข้างในสีชมพูอมแดง (นิยมที่สุดสำหรับสเต๊ก)', en: 'warm pink-red centre — the most popular for steak' },
  'doneness.medium': { th: 'สุกปานกลาง ข้างในสีชมพู', en: 'pink centre, cooked through the edges' },
  'doneness.well_done': { th: 'สุกทั้งชิ้น ไม่มีสีชมพูเหลือ', en: 'cooked all the way through, no pink' },
  'firmness.soft': { th: 'เส้นต้มนาน นุ่มนิ่ม', en: 'cooked longer, very soft' },
  'firmness.regular': { th: 'ความนุ่มมาตรฐานของร้าน', en: "the shop's standard texture" },
  'firmness.firm': { th: 'เส้นหนึบ ยังมีแรงกัด (ภาษาญี่ปุ่น: คาตะ)', en: 'chewy with a bite (Japanese: kata)' },
  'broth.tonkotsu': { th: 'ซุปกระดูกหมูเคี่ยว ข้นสีขาว', en: 'rich, creamy pork-bone broth' },
  'broth.shoyu': { th: 'ซุปซีอิ๊วญี่ปุ่น ใส สีน้ำตาล (มีกลูเตน)', en: 'clear soy-sauce broth (contains gluten)' },
  'broth.miso': { th: 'ซุปเต้าเจี้ยวญี่ปุ่น รสเข้ม', en: 'savoury fermented soybean broth' },
  'crust.thin': { th: 'แป้งบาง กรอบ', en: 'thin and crispy' },
  'crust.thick': { th: 'แป้งหนา นุ่มฟู', en: 'thick and fluffy' },
  'crust.cheese_crust': { th: 'ขอบแป้งสอดไส้ชีส', en: 'the edge is stuffed with cheese' },
  'steak_sauce.chimichurri': { th: 'ซอสสมุนไพรสีเขียวแบบอาร์เจนตินา', en: 'Argentinian green herb sauce' },
  'carb.naan': { th: 'แป้งนานอบ ทานคู่แกงอินเดีย (มีกลูเตนและนม)', en: 'Indian flatbread (contains gluten and dairy)' },
  'carb.rice': { th: 'ข้าวเมล็ดยาวแบบอินเดีย', en: 'long-grain Indian rice' },
  'matcha_level.standard': { th: 'ความเข้มปกติของร้าน', en: "the shop's standard strength" },
  'matcha_level.strong': { th: 'ใส่ผงมัทฉะมากขึ้น รสเข้ม ขมขึ้น', en: 'more matcha powder — bolder and more bitter' },
  'matcha_level.double': { th: 'ใส่มัทฉะ 2 เท่า เข้มที่สุด', en: 'twice the matcha — the strongest' },
  'base.yogurt': { th: 'ปั่นกับโยเกิร์ต (มีนม)', en: 'blended with yogurt (contains dairy)' },
  'base.coconut': { th: 'ปั่นกับน้ำมะพร้าว', en: 'blended with coconut water' },
  'base.fruit': { th: 'ผลไม้ล้วน ไม่ใส่นมหรือโยเกิร์ต', en: 'just fruit, no dairy' },
  'alcohol.with': { th: 'ใส่เหล้า ต้องอายุ 20 ปีขึ้นไปและแสดงบัตร', en: 'contains alcohol — you must be 20+ and show ID' },
  'alcohol.virgin': { th: '"เวอร์จิ้น" = ทำแบบไม่ใส่เหล้า รสชาติคล้ายเดิม', en: '"virgin" = made without alcohol, similar taste' },
  'serve.rocks': { th: '"On the rocks" = เสิร์ฟกับน้ำแข็งก้อน', en: 'served over ice cubes' },
  'serve.frozen': { th: '"Frozen" = ปั่นกับน้ำแข็งจนเป็นเกล็ด', en: 'blended with ice until slushy' },
  'rim.salt': { th: 'ทาเกลือรอบขอบแก้ว (นิยมกับมาร์การิต้า)', en: 'salt around the glass edge (classic for margaritas)' },
  'rim.sugar_rim': { th: 'ทาน้ำตาลรอบขอบแก้ว', en: 'sugar around the glass edge' },
  'slice.whole': { th: 'เค้กทั้งก้อน ขนาด 1 ปอนด์ (ประมาณ 8 ชิ้น)', en: 'the whole 1-lb cake (about 8 slices)' },
  'slicing.sliced': { th: 'หั่นขนมปังเป็นแผ่นให้', en: 'the loaf is cut into slices for you' },
  'dining.here': { th: 'นั่งทานที่ร้าน (For here / Dine in)', en: 'eat at the shop' },
  'dining.takeaway': { th: 'ใส่กล่องกลับบ้าน (To go / Take away)', en: 'packed to take away' },
};

// คำลงท้ายของผู้เรียน: ครับ (ผม) หรือ ค่ะ (ดิฉัน)
function pol(text, polite) {
  if (polite !== 'ค่ะ') return text;
  return text.replace(/นะครับ/g, 'นะคะ').replace(/ครับ\?/g, 'คะ?').replace(/ครับ/g, 'ค่ะ').replace(/ผม/g, 'ดิฉัน');
}
const bare = (s) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim();
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const asArr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

const T = {
  th: {
    item: 'พนักงานถามว่าจะสั่งเมนูอะไร — บอกชื่อเมนู หรือแตะที่ป้ายเมนูก็ได้',
    slot: (label) => `พนักงานถามเรื่อง "${label}" — ตอบสั้นๆ ได้เลย เลือกประโยคด้านล่าง`,
    id: 'เครื่องดื่มนี้มีแอลกอฮอล์ พนักงานจึงต้องขอดูบัตร — กดการ์ด 🪪 หรือพูดว่า "นี่บัตรประชาชนครับ"',
    confirm: 'พนักงานกำลังทวนออเดอร์ — ถ้าถูกให้ตอบว่า "ถูกต้อง" ถ้าผิดให้บอกสิ่งที่ต้องแก้',
    done: 'สั่งสำเร็จแล้ว! 🎉 กดปุ่ม "สรุปผล" เพื่อดูคะแนน',
    allergyWarn: (a) => `⚠️ อย่าลืมบอกพนักงานว่าคุณแพ้${a}`,
    driveWarn: '⚠️ คุณต้องขับรถกลับบ้าน — เลือกแบบไม่มีแอลกอฮอล์',
    underWarn: '⚠️ คุณอายุยังไม่ถึง 20 ปี — สั่งเครื่องดื่มแอลกอฮอล์ไม่ได้',
    mismatch: (xs) => `⚠️ ยังไม่ตรงกับภารกิจ: ${xs} — ตอบว่า "ไม่ถูก" แล้วบอกสิ่งที่ต้องแก้`,
    missionOk: '✅ ออเดอร์ตรงกับภารกิจแล้ว ตอบยืนยันได้เลย',
    safeFor: (a, names) => `เมนูที่ปลอดภัยสำหรับคนแพ้${a}: ${names}`,
    // ประโยคตัวอย่าง (ผู้เรียนเป็นลูกค้า)
    sayItem: (n) => `ขอ${n}ครับ`,
    sayValue: (v) => `${v}ครับ`,
    sayId: 'นี่บัตรประชาชนครับ',
    sayYes: 'ถูกต้องครับ',
    sayNo: 'ไม่ถูกครับ ขอแก้หน่อยครับ',
    sayAllergy: (a) => `ผมแพ้${a}ครับ`,
    sayMod: (m) => `ขอ${m}ด้วยครับ`,
    sayQty: (q, u) => `เอา ${q} ${u}ครับ`,
    sayVirgin: 'ขอแบบเวอร์จิ้น ไม่มีแอลกอฮอล์ครับ',
    sayMenu: 'มีเมนูอะไรแนะนำบ้างครับ?',
    sayThanks: 'ขอบคุณครับ',
    sayFull: (parts) => `ขอ${parts.join(' ')}ครับ`,
    // ผู้เรียนเป็นพนักงาน
    sGreet: 'เริ่มจากทักทายลูกค้า แล้วถามว่ารับอะไรดี',
    sAllergy: (a) => `ลูกค้าบอกว่าแพ้${a} — ยืนยันว่าจะไม่ใส่ให้`,
    sId: 'ลูกค้าสั่งเครื่องดื่มแอลกอฮอล์ — ต้องขอดูบัตรก่อน',
    sUnder: (age) => `บัตรระบุอายุ ${age} ปี (ต่ำกว่า 20) — ปฏิเสธอย่างสุภาพและเสนอแบบเวอร์จิ้น/ม็อกเทล`,
    sAsk: (xs) => `ยังไม่รู้: ${xs} — ถามลูกค้า (ถามหลายเรื่องในประโยคเดียวได้คะแนนดี)`,
    sAskAllergy: 'ถามเรื่องอาการแพ้อาหารก่อนทวน เพื่อความปลอดภัย',
    sMore: 'ถามว่าลูกค้าต้องการอะไรเพิ่มไหม (ลูกค้าอาจมีคำขอพิเศษ)',
    sReadback: 'ได้ข้อมูลครบแล้ว — ทวนออเดอร์ให้ลูกค้าฟัง',
    sPrice: 'ทวนถูกแล้ว — บอกยอดเงินรวม',
    sDone: 'ขายสำเร็จ! 🎉 กดปุ่ม "สรุปผล" เพื่อดูคะแนน',
    tGreet: 'สวัสดีครับ ยินดีต้อนรับครับ รับอะไรดีครับ?',
    tAllergy: (ings) => `ได้ครับ ทางร้านจะไม่ใส่${ings}ให้ และแยกอุปกรณ์ให้นะครับ`,
    tId: 'ขออนุญาตดูบัตรประชาชนหน่อยครับ',
    tRefuse: 'ขออภัยครับ ร้านขายเครื่องดื่มแอลกอฮอล์ให้ผู้ที่อายุต่ำกว่า 20 ปีไม่ได้ ขอทำเป็นแบบเวอร์จิ้น (ไม่มีแอลกอฮอล์) ให้แทนนะครับ',
    tQty: (u) => `รับกี่${u}ดีครับ?`,
    tAskAllergy: 'มีอาการแพ้อาหารอะไรไหมครับ?',
    tMore: 'รับอะไรเพิ่มไหมครับ?',
    tAll: 'ถามรวดเดียว',
    tReadback: (d) => `ขอทวนออเดอร์นะครับ ${d} ถูกต้องไหมครับ?`,
    tPrice: (p) => `ทั้งหมด ${p} บาทครับ`,
    priceHow: 'วิธีคิดราคา',
    base: 'ราคาเมนู',
    times: (q) => `× ${q}`,
  },
  en: {
    item: 'The staff is asking what you would like — say the name, or tap the menu board',
    slot: (label) => `The staff is asking about "${label}" — a short answer is fine, pick one below`,
    id: 'This drink has alcohol, so the staff needs to see your ID — tap the 🪪 card or say "Here\'s my ID"',
    confirm: 'The staff is reading your order back — say "Yes, that\'s right" or tell them what to change',
    done: 'Order complete! 🎉 Press "Debrief" to see your score',
    allergyWarn: (a) => `⚠️ Don't forget to tell the staff you're allergic to ${a}`,
    driveWarn: "⚠️ You're driving home — choose an alcohol-free drink",
    underWarn: "⚠️ You're under 20 — you can't order alcohol",
    mismatch: (xs) => `⚠️ Not what your mission needs: ${xs} — say "No" and tell them what to change`,
    missionOk: '✅ The order matches your mission — go ahead and confirm',
    safeFor: (a, names) => `Safe choices for a ${a} allergy: ${names}`,
    sayItem: (n) => `Could I have the ${n}, please?`,
    sayValue: (v) => `${cap(v)}, please.`,
    sayId: "Here's my ID.",
    sayYes: "Yes, that's right.",
    sayNo: "No, I'd like to change something.",
    sayAllergy: (a) => `I'm allergic to ${a}.`,
    sayMod: (m) => (/^no /.test(m) ? `${cap(m)}, please.` : `Could I also get ${m}, please?`),
    sayQty: (q, u) => `Could I have ${q} ${u}s, please?`,
    sayVirgin: 'Could I have it virgin, with no alcohol?',
    sayMenu: 'What do you recommend?',
    sayThanks: 'Thank you!',
    sayFull: (parts) => `Could I have ${parts.join(', ')}, please?`,
    sGreet: 'Start by greeting the customer and asking what they would like',
    sAllergy: (a) => `The customer is allergic to ${a} — confirm you'll leave it out`,
    sId: 'The customer ordered alcohol — check their ID first',
    sUnder: (age) => `The ID says ${age} (under 20) — politely refuse and offer a virgin drink or a mocktail`,
    sAsk: (xs) => `Still unknown: ${xs} — ask the customer (asking several at once scores well)`,
    sAskAllergy: 'Ask about food allergies before the read-back — safety first',
    sMore: 'Ask if they would like anything else (they may have special requests)',
    sReadback: 'You have everything — read the order back to the customer',
    sPrice: 'Read-back confirmed — now state the total',
    sDone: 'Sale complete! 🎉 Press "Debrief" to see your score',
    tGreet: 'Hi, welcome! What can I get for you?',
    tAllergy: (ings) => `Of course — we'll leave out the ${ings} and use separate utensils.`,
    tId: 'May I see your ID, please?',
    tRefuse: "I'm sorry, we can't serve alcohol to anyone under 20. I can make it virgin (alcohol-free) for you instead.",
    tQty: () => 'How many would you like?',
    tAskAllergy: 'Do you have any food allergies?',
    tMore: 'Anything else?',
    tAll: 'Ask all at once',
    tReadback: (d) => `Let me read that back: ${d}. Is that correct?`,
    tPrice: (p) => `That's ${p} baht, please.`,
    priceHow: 'How the price adds up',
    base: 'Menu price',
    times: (q) => `× ${q}`,
  },
};

// ---------------------------------------------------------------- 📖 คำศัพท์ในประโยคล่าสุด
function glossary(sc, text, lang, focusGroup = null) {
  const low = String(text || '').toLowerCase();
  const out = [];
  const seen = new Set();
  const groups = [...new Set(sc.menu.flatMap((it) => it.groups))];
  const add = (key, th, en) => {
    if (seen.has(key) || out.length >= 6) return;
    seen.add(key);
    const g = GLOSS[key];
    out.push({ term: lang === 'en' ? bare(en) : bare(th), other: lang === 'en' ? bare(th) : bare(en), meaning: g ? g[lang] : '' });
  };
  // กลุ่มที่กำลังถาม: อธิบายทุกตัวเลือกที่มีคำอธิบาย
  if (focusGroup && GROUPS[focusGroup]) {
    for (const [v, d] of Object.entries(GROUPS[focusGroup].values)) if (GLOSS[`${focusGroup}.${v}`]) add(`${focusGroup}.${v}`, d.th, d.en);
  }
  for (const g of groups) {
    for (const [v, d] of Object.entries(GROUPS[g].values)) {
      const names = [bare(d.th), bare(d.en).toLowerCase()].filter((x) => x.length > 2);
      if (GLOSS[`${g}.${v}`] && names.some((n) => low.includes(n.toLowerCase()))) add(`${g}.${v}`, d.th, d.en);
    }
  }
  for (const it of sc.menu) {
    if (low.includes(it.th.toLowerCase()) || low.includes(it.en.toLowerCase())) add(`menu.${it.id}`, `${it.emoji} ${it.th}`, `${it.emoji} ${it.en}`);
  }
  return out;
}

const valText = (g, v, lang) => bare(valueDef(g, v)[lang]);
const itemName = (it, lang) => (lang === 'en' ? enLower(cardName(it, 'en')) : cardName(it, 'th'));

// ---------------------------------------------------------------- โหมดลูกค้า (ผู้เรียนสั่ง)
function assistCustomer(payload, sc, lang) {
  const S = T[lang];
  const order = normalizeOrder(payload.order_state);
  const mission = sc.missions.find((m) => m.id === payload.mission_id) || null;
  const target = mission?.target || null;
  const profile = payload.learner_profile || mission?.profile || {};
  const allergies = [...new Set([...(profile.allergies || []), ...order.allergies])];
  const history = payload.dialogue_history || [];
  const lastLine = [...history].reverse().find((h) => h.role === 'actor')?.content || sc.opening[lang];
  const userTurns = history.filter((h) => h.role === 'user').length;
  const slot = order.phase === 'complete' ? 'done' : order.phase === 'confirming' ? 'confirm' : (userTurns || order.item ? missingSlots(sc, order)[0] || 'confirm' : 'item');

  const warnings = [];
  const suggestions = [];
  const push = (text, star = false) => { if (!suggestions.some((s) => s.text === text)) suggestions.push({ text: pol(text, payload.polite), star }); };

  const undeclared = (profile.allergies || []).filter((a) => !order.allergies.includes(a));
  if (undeclared.length && slot !== 'done') {
    const names = listText(undeclared.map((a) => allergenName(a, lang)), lang);
    warnings.push(S.allergyWarn(names));
    push(S.sayAllergy(names), true);
  }
  const noAlcohol = (profile.driving || (profile.age != null && profile.age < (sc.legalAge || 20))) && sc.ageCheck;
  if (noAlcohol && slot !== 'done') {
    warnings.push(profile.driving ? S.driveWarn : S.underWarn);
    if (order.item && orderHasAlcohol(sc, order) && itemById(sc, order.item).groups.includes('alcohol')) push(S.sayVirgin, true);
  }

  let situation;
  let focusGroup = null;
  if (slot === 'done') {
    situation = S.done;
    push(S.sayThanks);
  } else if (slot === 'item') {
    situation = S.item;
    let items = sc.menu;
    if (allergies.length) items = safeItems(sc, allergies);
    if (noAlcohol) items = items.filter((it) => !it.alcoholic);
    if (target?.item) push(S.sayItem(itemName(itemById(sc, target.item), lang)), true);
    items.slice(0, 4).forEach((it) => push(S.sayItem(itemName(it, lang))));
    if (allergies.length) warnings.push(S.safeFor(listText(allergies.map((a) => allergenName(a, lang)), lang), listText(items.map((it) => itemName(it, lang)), lang)));
    push(S.sayMenu);
  } else if (slot === 'id_check') {
    situation = S.id;
    push(S.sayId, !noAlcohol);
  } else if (slot === 'confirm') {
    situation = S.confirm;
    const wrong = target ? missionMismatch(sc, order, target, lang) : [];
    if (target && wrong.length) warnings.push(S.mismatch(wrong.map((w) => w.text).join(', ')));
    else if (target) warnings.push(S.missionOk);
    // ผิดตรงไหน → เสนอประโยคแก้ไขได้ทันที (บอกค่าที่ถูกเลย ไม่ต้องตอบว่า "ไม่ถูก" ก่อน)
    wrong.forEach((w) => push(w.say, true));
    push(S.sayYes, !!target && !wrong.length);
    if (!wrong.length) push(S.sayNo);
  } else {
    focusGroup = slot;
    situation = S.slot(`${GROUPS[slot][lang]}${lang === 'th' ? ` (${GROUPS[slot].en})` : ''}`);
    const it = itemById(sc, order.item);
    const want = asArr(target?.item && target.item !== order.item ? null : target?.options?.[slot]);
    for (const v of offerValues(it, slot, allergies)) {
      if (noAlcohol && slot === 'alcohol' && v === 'with') continue;
      // ใช้ชื่อเต็ม (เช่น medium (12")) กันสับสนกับค่าในกลุ่มอื่น (medium = ความสุก)
      push(S.sayValue(valueDef(slot, v)[lang]), want.includes(v) || (noAlcohol && slot === 'alcohol'));
    }
  }

  // สิ่งที่ภารกิจต้องการแต่ยังไม่ได้สั่ง (ของเพิ่ม / จำนวน)
  if (target && order.item && (!target.item || target.item === order.item) && slot !== 'done') {
    for (const m of target.modifiers || []) if (!order.modifiers.includes(m)) push(S.sayMod(modifierDef(m)[lang]), true);
    // ตัวเลือกไม่บังคับที่ภารกิจต้องการ (เช่น ไข่ดาวสุก / จานพิเศษ) — พนักงานไม่ถามเอง ต้องบอกเอง
    for (const [g, v] of Object.entries(target.options || {})) {
      if (!GROUPS[g].required && !asArr(v).includes(order.options[g])) push(S.sayMod(valueDef(g, asArr(v)[0])[lang]), true);
    }
    if (target.quantity && target.quantity !== (order.quantity || 1)) push(S.sayQty(target.quantity, sc.unit[lang]), true);
  }

  // 🎯 ประโยคเต็ม: ออเดอร์ตามภารกิจทั้งหมดในประโยคเดียว
  let model = null;
  if (target?.item && slot !== 'done') model = pol(fullOrderSentence(sc, target, lang), payload.polite);
  else if (slot !== 'item' && slot !== 'done' && suggestions.length) model = suggestions.find((s) => s.star)?.text || null;

  return {
    mode: 'customer', slot, situation, warnings, suggestions,
    glossary: glossary(sc, lastLine, lang, focusGroup), model, last_line: lastLine,
  };
}

function fullOrderSentence(sc, target, lang) {
  const S = T[lang];
  const it = itemById(sc, target.item);
  const q = target.quantity || 1;
  const vals = Object.entries(target.options || {}).map(([g, v]) => valText(g, asArr(v)[0], lang));
  const mods = (target.modifiers || []).map((m) => modifierDef(m)[lang]);
  if (lang === 'en') return S.sayFull([`${q === 1 ? 'one' : q} ${itemName(it, 'en')}`, ...vals, ...mods]);
  return S.sayFull([cardName(it, 'th'), ...vals, ...mods, ...(q > 1 ? [`${q} ${sc.unit.th}`] : [])]);
}

function missionMismatch(sc, order, target, lang) {
  const S = T[lang];
  const out = [];
  if (target.item && order.item !== target.item) {
    out.push({ text: itemName(itemById(sc, target.item), lang), say: pol(fullOrderSentence(sc, target, lang), null) });
    return out;
  }
  for (const [g, v] of Object.entries(target.options || {})) {
    if ((order.options[g] || !GROUPS[g].required) && !asArr(v).includes(order.options[g])) {
      const x = valText(g, asArr(v)[0], lang);
      out.push({ text: x, say: S.sayValue(x) });
    }
  }
  for (const m of target.modifiers || []) if (!order.modifiers.includes(m)) out.push({ text: modifierDef(m)[lang], say: S.sayMod(modifierDef(m)[lang]) });
  if (target.quantity && target.quantity !== (order.quantity || 1)) out.push({ text: `${target.quantity} ${sc.unit[lang]}`, say: S.sayQty(target.quantity, sc.unit[lang]) });
  if (target.alcoholFree && orderHasAlcohol(sc, order)) out.push({ text: valText('alcohol', 'virgin', lang), say: S.sayVirgin });
  return out;
}

// ---------------------------------------------------------------- โหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน)
function assistStaff(payload, sc, lang) {
  const S = T[lang];
  const st = payload.customer_state;
  const t = normalizeOrder(st.target);
  const it = itemById(sc, t.item);
  const history = payload.dialogue_history || [];
  const lastLine = [...history].reverse().find((h) => h.role === 'customer')?.content || '';
  const underage = sc.ageCheck && st.profile.age < (sc.legalAge || 20);
  const suggestions = [];
  const warnings = [];
  const push = (text, star = false) => { if (!suggestions.some((s) => s.text === text)) suggestions.push({ text: pol(text, payload.polite), star }); };
  const askOrder = { ...t, allergies: st.revealed.allergies ? st.profile.allergies || [] : [] };
  const notAsked = it.groups.filter((g) => GROUPS[g].required && !st.revealed.options[g]);
  const optPending = it.groups.filter((g) => !GROUPS[g].required && t.options[g] && t.options[g] !== GROUPS[g].default && !st.revealed.options[g]);
  const extrasPending = optPending.length > 0 || t.modifiers.some((m) => !st.safety_mods.includes(m) && !st.revealed.modifiers.includes(m));
  let situation;
  let explain = [];

  if (st.phase === 'done') {
    situation = S.sDone;
  } else if (!st.greeted && st.turns === 0) {
    situation = S.sGreet;
    push(S.tGreet, true);
  }
  if (st.phase !== 'done') {
    const allergyPending = st.revealed.allergies && st.profile.allergies?.length && !st.allergy_ack;
    if (allergyPending) {
      const names = listText(st.profile.allergies.map((a) => allergenName(a, lang)), lang);
      const ings = st.safety_mods.map((m) => INGREDIENTS[m.slice(3)]?.[lang]).filter(Boolean);
      situation = situation || S.sAllergy(names);
      push(S.tAllergy(listText(ings.length ? ings : [names], lang)), true);
    }
    if (sc.ageCheck && orderHasAlcohol(sc, t) && !st.id_checked) {
      situation = situation || S.sId;
      push(S.tId, true);
    } else if (underage && orderHasAlcohol(sc, t)) {
      situation = situation || S.sUnder(st.profile.age);
      push(S.tRefuse, true);
    }
    if (notAsked.length || !st.revealed.quantity) {
      const labels = [...notAsked.map((g) => GROUPS[g][lang]), ...(st.revealed.quantity ? [] : [lang === 'en' ? 'quantity' : 'จำนวน'])];
      situation = situation || S.sAsk(labels.join(', '));
      const qs = notAsked.map((g) => askFor(sc, askOrder, g, lang));
      if (qs.length > 1) suggestions.push({ text: pol(qs.join(' '), payload.polite), star: true, label: S.tAll });
      qs.forEach((q) => push(q, qs.length === 1));
      if (!st.revealed.quantity) push(S.tQty(sc.unit[lang]));
    } else if (!st.readback_ok) {
      if (!st.allergy_asked && !st.revealed.allergies && !sc.ageCheck) { situation = situation || S.sAskAllergy; push(S.tAskAllergy, true); }
      if (extrasPending) { situation = situation || S.sMore; push(S.tMore, true); }
      situation = situation || S.sReadback;
      // ทวนเฉพาะสิ่งที่ลูกค้าบอกแล้ว
      const options = Object.fromEntries(Object.entries(t.options).filter(([g]) => GROUPS[g].required || st.revealed.options[g]));
      const known = { ...t, options, modifiers: t.modifiers.filter((m) => st.revealed.modifiers.includes(m) || (st.revealed.allergies && st.safety_mods.includes(m))) };
      push(S.tReadback(describeOrder(sc, known, lang)), !extrasPending);
    } else {
      situation = situation || S.sPrice;
      const total = totalPrice(sc, t);
      push(S.tPrice(total), true);
      explain = priceBreakdown(sc, t, lang);
    }
    if (!st.revealed.allergies && !st.allergy_asked && !sc.ageCheck && (notAsked.length || !st.revealed.quantity)) push(S.tAskAllergy);
  }

  return {
    mode: 'staff', situation, warnings, suggestions, glossary: glossary(sc, lastLine, lang),
    model: suggestions.find((s) => s.star)?.text || null, price: explain, last_line: lastLine,
  };
}

// ขั้นตอนคิดเงิน: ราคาเมนู + ตัวเลือกเสริม + ของเพิ่ม × จำนวน
function priceBreakdown(sc, t, lang) {
  const S = T[lang];
  const it = itemById(sc, t.item);
  const lines = [`${S.base} ${itemName(it, lang)} ${it.price}`];
  for (const [g, v] of Object.entries(t.options)) {
    const x = valueExtra(it, g, v);
    if (x) lines.push(`+ ${valText(g, v, lang)} ${x}`);
  }
  for (const m of t.modifiers) if (modifierDef(m)?.extra) lines.push(`+ ${modifierDef(m)[lang]} ${modifierDef(m).extra}`);
  const unit = unitPrice(sc, t);
  const q = t.quantity || 1;
  lines.push(q > 1 ? `= ${unit} ${S.times(q)} = ${unit * q}` : `= ${unit}`);
  return lines;
}

export function buildAssist(payload) {
  const sc = getScenario(payload.scenario);
  const lang = payload.language === 'en' ? 'en' : 'th';
  return payload.mode === 'staff' && payload.customer_state ? assistStaff(payload, sc, lang) : assistCustomer(payload, sc, lang);
}

