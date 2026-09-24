// Post-Scenario Debrief (เฟสที่ 3): สรุปคะแนน Goal Completion / Efficiency / Politeness & Clarity
import { MISSIONS, describeOrder, emptyOrder } from './menu.js';

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

const T = {
  th: {
    goalDone: 'ได้เครื่องดื่มที่ต้องการครบถ้วน',
    goalMismatch: (n) => `สั่งสำเร็จ แต่ไม่ตรงภารกิจ ${n} จุด`,
    goalIncomplete: 'ยังสั่งไม่สำเร็จ',
    turns: (n, c) => `ใช้ ${n} เทิร์น (บาริสต้าต้องถามซ้ำ/ขอความชัดเจน ${c} ครั้ง)`,
    channels: 'ช่องทางที่ใช้',
    ch: { speech: 'พูด', text: 'พิมพ์', point: 'ชี้' },
    s: {
      oneShot: 'สั่งครบในประโยคเดียว ยอดเยี่ยมมาก!',
      multi: 'ใช้การชี้ผสมคำพูด/ข้อความได้อย่างมีประสิทธิภาพ',
      polite: 'ใช้ภาษาสุภาพสม่ำเสมอ',
      aac: 'สื่อสารด้วยการชี้ได้สำเร็จ',
    },
    i: {
      efficiency: 'ลองรวมข้อมูล (เมนู + ร้อน/เย็น + ความหวาน + ไซส์) ไว้ในประโยคเดียว',
      polite: 'เติม "ครับ/ค่ะ" หรือขึ้นต้นด้วย "ขอ..." ให้บ่อยขึ้น',
      clarity: 'ระบุชื่อเมนูให้เจาะจง แทนการพูดกว้างๆ เช่น "กาแฟ"',
      speak: 'ลองฝึกพูดหรือพิมพ์ชื่อเมนูควบคู่กับการชี้',
      mission: 'อ่านโจทย์ภารกิจอีกครั้ง แล้วตรวจออเดอร์ก่อนยืนยัน',
    },
  },
  en: {
    goalDone: 'Got exactly the drink you wanted',
    goalMismatch: (n) => `Order placed, but ${n} detail(s) didn't match the mission`,
    goalIncomplete: 'Order not completed yet',
    turns: (n, c) => `${n} turn(s) used (barista had to clarify ${c} time(s))`,
    channels: 'Channels used',
    ch: { speech: 'speech', text: 'text', point: 'pointing' },
    s: {
      oneShot: 'Ordered everything in a single sentence — outstanding!',
      multi: 'Combined pointing with words effectively',
      polite: 'Consistently polite language',
      aac: 'Communicated successfully by pointing',
    },
    i: {
      efficiency: 'Put the drink, hot/iced, sweetness and size in one sentence',
      polite: 'Use "please", "Could I get..." or "I\'d like..." more often',
      clarity: 'Name the specific drink rather than just "coffee"',
      speak: 'Practise saying or typing the drink name alongside pointing',
      mission: 'Re-read the mission card and check your order before finishing',
    },
  },
};

export function buildDebrief({ language = 'th', turns = [], order_state, mission_id = null }) {
  const t = T[language === 'en' ? 'en' : 'th'];
  const order = { ...emptyOrder(), ...(order_state || {}) };
  const mission = MISSIONS.find((m) => m.id === mission_id) || null;
  const n = turns.length;
  const clarifications = turns.filter((x) => x.coach?.rating === 'improve').length;

  // Goal Completion
  let goal = 0;
  let goalNote = t.goalIncomplete;
  if (order.is_complete) {
    if (mission) {
      const keys = Object.keys(mission.target);
      const miss = keys.filter((k) => (order[k] ?? (k === 'milk' ? 'dairy' : null)) !== mission.target[k]);
      goal = Math.round(100 * (keys.length - miss.length) / keys.length);
      goalNote = miss.length ? t.goalMismatch(miss.length) : t.goalDone;
    } else { goal = 100; goalNote = t.goalDone; }
  } else {
    const have = ['item', 'temperature', 'sweetness', 'size'].filter((k) => order[k]).length;
    goal = have * 15;
  }

  // Efficiency: 1 เทิร์นคือดีที่สุด แต่ละเทิร์นเพิ่มหัก 15 คะแนน
  const efficiency = n === 0 ? 0 : Math.max(10, 100 - (n - 1) * 15 - (order.is_complete ? 0 : 30));

  const politeness = avg(turns.map((x) => x.coach?.politeness).filter((v) => v != null));
  const clarity = avg(turns.map((x) => x.coach?.clarity).filter((v) => v != null));

  const scores = { goal, efficiency, politeness: politeness ?? 0, clarity: clarity ?? 0 };
  const overall = Math.round(goal * 0.35 + efficiency * 0.25 + (politeness ?? 60) * 0.2 + (clarity ?? 0) * 0.2);
  const stars = overall >= 90 ? 3 : overall >= 70 ? 2 : overall >= 40 ? 1 : 0;

  const used = { speech: false, text: false, point: false };
  turns.forEach((x) => Object.keys(used).forEach((k) => { if (x.channels?.[k]) used[k] = true; }));

  const strengths = [];
  const improvements = [];
  if (order.is_complete && n === 1) strengths.push(t.s.oneShot);
  if (turns.some((x) => x.channels?.point && (x.channels?.speech || x.channels?.text))) strengths.push(t.s.multi);
  if (politeness != null && politeness >= 90) strengths.push(t.s.polite);
  if (used.point && !used.speech && !used.text && order.is_complete) strengths.push(t.s.aac);
  if (n > 2) improvements.push(t.i.efficiency);
  if (politeness != null && politeness < 80) improvements.push(t.i.polite);
  if (clarity != null && clarity < 70) improvements.push(t.i.clarity);
  if (used.point && !used.speech && !used.text) improvements.push(t.i.speak);
  if (mission && order.is_complete && goal < 100) improvements.push(t.i.mission);

  return {
    overall, stars, scores,
    notes: {
      goal: goalNote,
      efficiency: t.turns(n, clarifications),
      channels: `${t.channels}: ${Object.keys(used).filter((k) => used[k]).map((k) => t.ch[k]).join(', ') || '-'}`,
    },
    order_summary: order.item ? describeOrder(order, language) : '-',
    mission_summary: mission ? describeOrder({ ...emptyOrder(), ...mission.target }, language) : null,
    strengths, improvements,
  };
}
