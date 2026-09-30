// Coach Agent (Offline): ประเมินการสื่อสารของผู้เรียนรายเทิร์น
// ดูทั้ง "ช่องทาง" ที่ใช้ (ชี้อย่างเดียว vs พูดประกอบการชี้), ความครบถ้วน, ความสุภาพ และความปลอดภัยเรื่องอาการแพ้
import { allergyConflicts, allergenName, itemLabel, listText } from './order.js';

const C = {
  th: {
    excellent: 'ดีเยี่ยม', good: 'ดี', improve: 'ต้องปรับปรุง',
    multi: 'ใช้การชี้/เลือกตัวเลือก ร่วมกับการพูดหรือพิมพ์ ช่วยลดความกำกวมได้รวดเร็วมาก',
    pointOnly: 'สื่อสารสำเร็จด้วยการชี้ (AAC ระดับพื้นฐาน)',
    selectOnly: 'เลือกตัวเลือกย่อย (Checkbox) ได้ถูกต้อง',
    speakTip: (name) => (name ? `ลองพูดหรือพิมพ์ประกอบด้วย เช่น "ขอ${name}ครับ/ค่ะ"` : 'ลองพูดหรือพิมพ์ประกอบการชี้/เลือกด้วย'),
    rich: (n) => `ให้ข้อมูลครบถึง ${n} อย่างในครั้งเดียว ชัดเจนมาก`,
    partial: (n) => `ได้ข้อมูลเพิ่ม ${n} อย่าง`,
    answered: 'ตอบคำถามพนักงานได้ตรงประเด็น',
    ambiguous: 'ข้อมูลยังกำกวม พนักงานต้องถามซ้ำ',
    ambiguousTip: 'ระบุชื่อเมนูให้เจาะจง แทนการพูดกว้างๆ',
    nothing: 'พนักงานยังไม่ได้ข้อมูลที่ใช้สั่งอาหาร',
    nothingTip: 'ลองบอกชื่อเมนู หรือแตะที่ป้ายเมนูช่วย',
    conflict: 'สิ่งที่ชี้กับสิ่งที่พูดไม่ตรงกัน',
    conflictTip: 'ตรวจให้แน่ใจว่าชี้และพูดถึงเมนูเดียวกัน',
    noisy: 'ร้านเสียงดัง เสียงพูดอย่างเดียวอาจไม่พอ',
    noisyTip: 'ในที่เสียงดัง ลองชี้เมนู เลือกตัวเลือก หรือพิมพ์ช่วย',
    recap: 'ทวนออเดอร์ด้วยตัวเองได้ครบถ้วน ช่วยป้องกันการสั่งผิด',
    confirmed: 'ยืนยันออเดอร์เรียบร้อย',
    recapTip: 'ครั้งหน้าลองทวนออเดอร์ด้วยตัวเอง เช่น "กะเพราหมูสับ เผ็ดน้อย ไม่ใส่ถั่วฝักยาวนะครับ"',
    corrected: 'บอกพนักงานได้ว่าออเดอร์ยังไม่ถูกต้อง',
    confirmTip: 'ฟังพนักงานทวนออเดอร์ แล้วตอบยืนยัน หรือทวนซ้ำด้วยตัวเอง',
    allergy: (l) => `แจ้งอาการแพ้${l}ได้ชัดเจน — สำคัญมากต่อความปลอดภัย`,
    safetyAsk: 'ถามส่วนผสม/ยืนยันความปลอดภัยกับพนักงาน ก่อนสั่ง',
    risk: (l) => `⚠️ เมนูนี้มีส่วนผสมที่คุณแพ้ (${l}) แต่ยังไม่ได้แจ้งพนักงาน`,
    riskTip: (l) => `แจ้งพนักงานทันที เช่น "ผมแพ้${l}ครับ ช่วยไม่ใส่ได้ไหมครับ"`,
    declareTip: (l) => `อย่าลืมแจ้งพนักงานว่าคุณแพ้${l} ก่อนยืนยันออเดอร์`,
    politeTip: 'เติมคำลงท้าย "ครับ/ค่ะ" หรือขึ้นต้นด้วย "ขอ..." จะฟังสุภาพขึ้น',
    completeTip: 'สั่งสำเร็จ! ครั้งหน้าลองบอกทุกอย่างในประโยคเดียวเพื่อให้เร็วขึ้น',
    allInOne: {
      cafe: 'ครั้งหน้าลองบอก ร้อน/เย็น ชนิดนม ความหวาน และไซส์ ไปพร้อมกันเลย',
      food: 'ครั้งหน้าลองบอกเนื้อสัตว์ ความเผ็ด และสิ่งที่ไม่ใส่ ในประโยคเดียว',
    },
  },
  en: {
    excellent: 'Excellent', good: 'Good', improve: 'Needs work',
    multi: 'Combining pointing/ticking options with speech or text removed ambiguity quickly',
    pointOnly: 'Communicated successfully by pointing (basic AAC)',
    selectOnly: 'Ticked the right modifier options',
    speakTip: (name) => (name ? `Try saying or typing it too, e.g. "Could I get the ${name}, please?"` : 'Try speaking or typing alongside pointing/ticking'),
    rich: (n) => `Gave ${n} pieces of information at once — very clear`,
    partial: (n) => `Added ${n} new piece(s) of information`,
    answered: "Answered the server's question directly",
    ambiguous: 'Still ambiguous — the staff had to ask again',
    ambiguousTip: 'Name the exact dish or drink instead of something general',
    nothing: "The staff didn't get any order information",
    nothingTip: 'Say the dish name, or tap the menu to help',
    conflict: "What you pointed at and what you said didn't match",
    conflictTip: 'Make sure you point at and mention the same item',
    noisy: "It's noisy — speech alone may not be enough",
    noisyTip: 'In noisy places, point, tick options or type to be understood',
    recap: 'Read the order back yourself — a great way to prevent mistakes',
    confirmed: 'Confirmed the order',
    recapTip: 'Next time, read the order back yourself, e.g. "Kaprao with minced pork, mild, no long beans, right?"',
    corrected: 'Told the staff the order was not right',
    confirmTip: 'Listen to the read-back, then confirm it or repeat it back yourself',
    allergy: (l) => `Clearly declared a ${l} allergy — vital for safety`,
    safetyAsk: 'Asked about ingredients / confirmed safety before ordering',
    risk: (l) => `⚠️ This order contains something you're allergic to (${l}) and you haven't told the staff`,
    riskTip: (l) => `Tell the staff right away, e.g. "I'm allergic to ${l} — could you leave it out?"`,
    declareTip: (l) => `Don't forget to tell the staff about your ${l} allergy before confirming`,
    politeTip: 'Add "please" or start with "Could I get..." to sound more polite',
    completeTip: 'Order complete! Next time try saying everything in one sentence',
    allInOne: {
      cafe: 'Next time, mention hot/iced, milk, sweetness and size together',
      food: 'Next time, give the protein, spice level and exclusions in one sentence',
    },
  },
};

export const RATING_LABELS = { th: { excellent: 'ดีเยี่ยม', good: 'ดี', improve: 'ต้องปรับปรุง' }, en: { excellent: 'Excellent', good: 'Good', improve: 'Needs work' } };

// ผลจากการเช็คโปรไฟล์ผู้เรียน: อาการแพ้ที่ผู้เรียนมี (จากภารกิจ) แต่ยังไม่ได้บอกพนักงาน
export function allergyRisk(sc, order, profile) {
  const undeclared = (profile?.allergies || []).filter((a) => !order.allergies.includes(a));
  const risky = undeclared.filter((a) => allergyConflicts(sc, order, [a]).length > 0);
  return { undeclared, risky };
}

export function coachTurn({
  lang, sc, channels, parsed, changes = [], order, prev, askedSlot,
  conflict = false, noisy = false, notUnderstood = false, completed = false, recap = false, profile = null,
}) {
  const c = C[lang];
  const verbal = channels.speech || channels.text;
  const nonverbal = channels.point || channels.select;
  const filled = changes.filter((x) => x !== 'allergy');
  const notes = [];
  let tip = '';
  let rating;
  const declaredNow = order.allergies.filter((a) => !prev.allergies.includes(a));
  const safetyAsked = parsed.askIngredients.length > 0 || parsed.askAllergens.length > 0 || parsed.safety;

  if (noisy) { rating = 'improve'; notes.push(c.noisy); tip = c.noisyTip; }
  else if (conflict) { rating = 'improve'; notes.push(c.conflict); tip = c.conflictTip; }
  else if (completed) {
    if (recap) { rating = 'excellent'; notes.push(c.recap); tip = c.completeTip; }
    else { rating = 'good'; notes.push(c.confirmed); tip = c.recapTip; }
  } else if (prev.phase === 'confirming' && parsed.no && filled.length === 0) {
    rating = 'good'; notes.push(c.corrected);
  } else if (nonverbal && !verbal) {
    rating = 'good';
    notes.push(channels.point ? c.pointOnly : c.selectOnly);
    tip = c.speakTip(itemLabel(sc, order, lang));
  } else if (notUnderstood) {
    rating = 'improve';
    notes.push(parsed.generic ? c.ambiguous : c.nothing);
    tip = parsed.generic ? c.ambiguousTip : c.nothingTip;
  } else {
    if (nonverbal && verbal && filled.length >= 2) { rating = 'excellent'; notes.push(c.multi); }
    else if (filled.length >= 3) { rating = 'excellent'; notes.push(c.rich(filled.length)); }
    else if (askedSlot && filled.includes(askedSlot)) { rating = 'good'; notes.push(c.answered); }
    else if (filled.length > 0) { rating = 'good'; notes.push(c.partial(filled.length)); }
    else if (declaredNow.length || safetyAsked || parsed.askMenu || parsed.askPrice || parsed.greeting || parsed.thanks || parsed.yes) { rating = 'good'; }
    else { rating = 'improve'; notes.push(c.nothing); tip = c.nothingTip; }
    if (!tip) tip = order.phase === 'confirming' ? c.confirmTip : c.allInOne[sc.id === 'cafe' ? 'cafe' : 'food'];
  }

  const names = (xs) => listText(xs.map((a) => allergenName(a, lang)), lang);
  if (declaredNow.length) {
    notes.push(c.allergy(names(declaredNow)));
    if (!noisy && !conflict) rating = 'excellent';
  }
  if (safetyAsked) {
    notes.push(c.safetyAsk);
    if (rating !== 'improve') rating = 'excellent';
  }
  const { undeclared, risky } = allergyRisk(sc, order, profile);
  if (risky.length) {
    rating = 'improve';
    notes.push(c.risk(names(risky)));
    tip = c.riskTip(names(risky));
  } else if (undeclared.length && (order.phase === 'confirming' || completed)) {
    tip = c.declareTip(names(undeclared));
  }

  const politeness = verbal ? parsed.politeness : null;
  // คำตอบยืนยันสั้นๆ ("ใช่", "yes") ไม่จำเป็นต้องเติมคำสุภาพ
  const shortReply = parsed.yes || parsed.no || completed;
  if (politeness !== null && politeness < 70 && rating !== 'improve' && !risky.length && !shortReply) tip = c.politeTip;

  let clarity;
  if (conflict || noisy) clarity = 40;
  else if (completed) clarity = recap ? 100 : 80;
  else if (filled.length === 0) clarity = declaredNow.length || safetyAsked ? 80 : nonverbal ? 60 : 20;
  else clarity = Math.min(100, 55 + filled.length * 15);

  return {
    rating, label: c[rating], notes, tip, politeness, clarity, slots_filled: changes,
    flags: { recap, allergy_declared: declaredNow, safety_asked: safetyAsked, risk: risky },
  };
}
