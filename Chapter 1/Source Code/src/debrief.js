// Post-Scenario Debrief: สรุปคะแนน Goal Completion / Efficiency / Politeness / Clarity (+ Safety เมื่อมีอาการแพ้)
import { GROUPS, getScenario } from './scenarios.js';
import { normalizeOrder, describeOrder, allergyConflicts, allergenName, listText, itemById, cardName, modifierDef, valueDef, missingSlots } from './order.js';

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

const T = {
  th: {
    goalDone: 'ได้ตามที่ต้องการครบถ้วน',
    goalMismatch: (l) => `สั่งสำเร็จ แต่ไม่ตรงภารกิจ: ${l}`,
    goalUnsafe: 'สั่งสำเร็จ แต่ออเดอร์มีส่วนผสมที่คุณแพ้ — อันตราย!',
    goalIncomplete: 'ยังสั่งไม่สำเร็จ',
    turns: (n, c) => `ใช้ ${n} เทิร์น (พนักงานต้องถามซ้ำ/ขอความชัดเจน ${c} ครั้ง)`,
    channels: 'ช่องทางที่ใช้',
    ch: { speech: 'พูด', text: 'พิมพ์', point: 'ชี้', select: 'เลือกตัวเลือก' },
    safetyOk: 'แจ้งอาการแพ้และได้ออเดอร์ที่ปลอดภัย',
    safetyUndeclared: (l) => `ไม่ได้แจ้งว่าแพ้${l}`,
    safetyUnsafe: 'ออเดอร์สุดท้ายยังมีส่วนผสมที่คุณแพ้',
    quantity: 'จำนวน', allergy: (a) => `แจ้งแพ้${a}`, item: 'เมนู',
    s: {
      oneShot: 'สั่งครบตั้งแต่ประโยคแรก แล้วยืนยันได้ทันที ยอดเยี่ยมมาก!',
      multi: 'ใช้การชี้/เลือกตัวเลือกผสมคำพูดหรือข้อความได้อย่างมีประสิทธิภาพ',
      polite: 'ใช้ภาษาสุภาพสม่ำเสมอ',
      aac: 'สื่อสารด้วยการชี้/เลือกตัวเลือกได้สำเร็จ',
      recap: 'ทวนออเดอร์ด้วยตัวเองได้ครบถ้วน',
      allergy: 'แจ้งอาการแพ้อาหารได้ชัดเจน',
      safety: 'ถามส่วนผสมและยืนยันความปลอดภัยกับพนักงาน',
    },
    i: {
      efficiency: 'ลองรวมข้อมูลทั้งหมดไว้ในประโยคเดียว จะใช้เทิร์นน้อยลง',
      polite: 'เติม "ครับ/ค่ะ" หรือขึ้นต้นด้วย "ขอ..." ให้บ่อยขึ้น',
      clarity: 'ระบุชื่อเมนูและรายละเอียดให้เจาะจง แทนการพูดกว้างๆ',
      speak: 'ลองฝึกพูดหรือพิมพ์ชื่อเมนูควบคู่กับการชี้',
      mission: 'อ่านโจทย์ภารกิจอีกครั้ง แล้วตรวจออเดอร์ตอนพนักงานทวนก่อนยืนยัน',
      recap: 'ตอนพนักงานถามว่า "ถูกต้องไหม" ลองทวนออเดอร์ด้วยตัวเองแทนการตอบแค่ "ใช่"',
      declare: 'แจ้งอาการแพ้อาหารตั้งแต่ต้น ก่อนเลือกเมนูเสมอ',
      safety: 'ลองถามพนักงานว่า "เมนูนี้มี...ไหม" หรือ "มั่นใจได้ไหมว่าไม่มี..." เพื่อยืนยันความปลอดภัย',
    },
  },
  en: {
    goalDone: 'Got exactly what you wanted',
    goalMismatch: (l) => `Order placed, but it didn't match the mission: ${l}`,
    goalUnsafe: "Order placed, but it contains something you're allergic to — dangerous!",
    goalIncomplete: 'Order not completed yet',
    turns: (n, c) => `${n} turn(s) used (staff had to clarify ${c} time(s))`,
    channels: 'Channels used',
    ch: { speech: 'speech', text: 'text', point: 'pointing', select: 'options' },
    safetyOk: 'Declared your allergy and got a safe order',
    safetyUndeclared: (l) => `Never told the staff about your ${l} allergy`,
    safetyUnsafe: "The final order still contains something you're allergic to",
    quantity: 'quantity', allergy: (a) => `declare ${a} allergy`, item: 'item',
    s: {
      oneShot: 'Gave the full order in one go and confirmed right away — outstanding!',
      multi: 'Combined pointing/options with words effectively',
      polite: 'Consistently polite language',
      aac: 'Communicated successfully by pointing/selecting',
      recap: 'Read the order back yourself accurately',
      allergy: 'Clearly declared your food allergy',
      safety: 'Asked about ingredients and confirmed safety with the staff',
    },
    i: {
      efficiency: 'Put all the details in one sentence to save turns',
      polite: 'Use "please", "Could I get..." or "I\'d like..." more often',
      clarity: 'Name the specific dish and details rather than something general',
      speak: 'Practise saying or typing the name alongside pointing',
      mission: 'Re-read the mission card and check the read-back before confirming',
      recap: 'When asked "is that correct?", try repeating the order back instead of just "yes"',
      declare: 'Always mention food allergies first, before choosing a dish',
      safety: 'Ask "Does this contain...?" or "Can you make sure there is no...?" to confirm safety',
    },
  },
};

export function missionChecks(sc, mission, order, lang = 'th') {
  const t = T[lang];
  const tg = mission.target;
  const checks = [];
  if (tg.item) checks.push({ label: `${t.item}: ${cardName(itemById(sc, tg.item), lang)}`, ok: order.item === tg.item });
  for (const [g, v] of Object.entries(tg.options || {})) {
    const want = Array.isArray(v) ? v : [v];
    checks.push({ label: `${GROUPS[g][lang]}: ${want.map((x) => valueDef(g, x)[lang]).join('/')}`, ok: want.includes(order.options[g]) });
  }
  for (const m of tg.modifiers || []) checks.push({ label: modifierDef(m)[lang], ok: order.modifiers.includes(m) });
  if (tg.quantity) checks.push({ label: `${t.quantity} ${tg.quantity}`, ok: (order.quantity || 1) === tg.quantity });
  for (const a of mission.profile?.allergies || []) checks.push({ label: t.allergy(allergenName(a, lang)), ok: order.allergies.includes(a) });
  return checks;
}

export function buildDebrief({ language = 'th', scenario, turns = [], order_state, mission_id = null }) {
  const lang = language === 'en' ? 'en' : 'th';
  const t = T[lang];
  const sc = getScenario(scenario);
  const order = normalizeOrder(order_state);
  const mission = sc.missions.find((m) => m.id === mission_id) || null;
  const profile = mission?.profile?.allergies || [];
  const complete = order.phase === 'complete' || order.is_complete;
  const n = turns.length;
  const clarifications = turns.filter((x) => x.coach?.rating === 'improve').length;
  const unsafe = order.item && profile.length > 0 && allergyConflicts(sc, order, profile).length > 0;

  // Goal Completion
  let goal = 0;
  let goalNote = t.goalIncomplete;
  let checks = [];
  if (complete) {
    if (mission) {
      checks = missionChecks(sc, mission, order, lang);
      const miss = checks.filter((c) => !c.ok);
      goal = checks.length ? Math.round((100 * (checks.length - miss.length)) / checks.length) : 100;
      goalNote = miss.length ? t.goalMismatch(miss.map((c) => c.label).join(', ')) : t.goalDone;
    } else { goal = 100; goalNote = t.goalDone; }
    if (unsafe) { goal = Math.min(goal, 20); goalNote = t.goalUnsafe; }
  } else if (order.item) {
    const it = itemById(sc, order.item);
    const total = it.groups.filter((g) => GROUPS[g].required).length + 1;
    goal = Math.round((40 * (total - missingSlots(sc, order).length)) / total);
  }

  // Efficiency: สั่ง 1 เทิร์น + ยืนยัน 1 เทิร์น = ดีที่สุด
  const efficiency = n === 0 ? 0 : Math.max(10, 100 - Math.max(0, n - 2) * 15 - (complete ? 0 : 30));
  const politeness = avg(turns.map((x) => x.coach?.politeness).filter((v) => v != null));
  const clarity = avg(turns.map((x) => x.coach?.clarity).filter((v) => v != null));

  // Safety: เฉพาะเมื่อผู้เรียนมีอาการแพ้ (จากภารกิจ) หรือแจ้งอาการแพ้เอง
  let safety = null;
  let safetyNote = null;
  if (profile.length || order.allergies.length) {
    const undeclared = profile.filter((a) => !order.allergies.includes(a));
    safety = 100 - (undeclared.length ? 40 : 0) - (unsafe ? 60 : 0);
    safety = Math.max(0, safety);
    safetyNote = unsafe ? t.safetyUnsafe
      : undeclared.length ? t.safetyUndeclared(listText(undeclared.map((a) => allergenName(a, lang)), lang))
        : t.safetyOk;
  }

  const scores = { goal, efficiency, politeness: politeness ?? 0, clarity: clarity ?? 0, safety };
  const pol = politeness ?? 60;
  const cla = clarity ?? 0;
  const overall = Math.round(safety == null
    ? goal * 0.35 + efficiency * 0.25 + pol * 0.2 + cla * 0.2
    : goal * 0.3 + efficiency * 0.15 + pol * 0.15 + cla * 0.15 + safety * 0.25);
  const stars = overall >= 90 ? 3 : overall >= 70 ? 2 : overall >= 40 ? 1 : 0;

  const used = { speech: false, text: false, point: false, select: false };
  turns.forEach((x) => Object.keys(used).forEach((k) => { if (x.channels?.[k]) used[k] = true; }));
  const verbalUsed = used.speech || used.text;
  const flag = (k) => turns.some((x) => {
    const v = x.coach?.flags?.[k];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });

  const strengths = [];
  const improvements = [];
  if (complete && n <= 2) strengths.push(t.s.oneShot);
  if (flag('recap')) strengths.push(t.s.recap);
  if (turns.some((x) => (x.channels?.point || x.channels?.select) && (x.channels?.speech || x.channels?.text))) strengths.push(t.s.multi);
  if (flag('allergy_declared')) strengths.push(t.s.allergy);
  if (flag('safety_asked')) strengths.push(t.s.safety);
  if (politeness != null && politeness >= 90) strengths.push(t.s.polite);
  if ((used.point || used.select) && !verbalUsed && complete) strengths.push(t.s.aac);

  if (n > 3) improvements.push(t.i.efficiency);
  if (politeness != null && politeness < 80) improvements.push(t.i.polite);
  if (clarity != null && clarity < 70) improvements.push(t.i.clarity);
  if ((used.point || used.select) && !verbalUsed) improvements.push(t.i.speak);
  if (profile.some((a) => !order.allergies.includes(a)) || flag('risk')) improvements.push(t.i.declare);
  if (safety != null && !flag('safety_asked')) improvements.push(t.i.safety);
  if (complete && sc.id !== 'cafe' && !flag('recap')) improvements.push(t.i.recap);
  if (mission && complete && goal < 100) improvements.push(t.i.mission);

  return {
    overall, stars, scores, checks,
    notes: {
      goal: goalNote,
      efficiency: t.turns(n, clarifications),
      channels: `${t.channels}: ${Object.keys(used).filter((k) => used[k]).map((k) => t.ch[k]).join(', ') || '-'}`,
      safety: safetyNote,
    },
    order_summary: order.item ? describeOrder(sc, order, lang) : '-',
    mission_brief: mission ? mission.brief[lang] : null,
    strengths, improvements,
  };
}
