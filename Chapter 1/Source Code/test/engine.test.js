// ทดสอบสถานการณ์ตาม Master Plan หัวข้อ 3 (Scenario 1.1 - 1.3 และ Interaction Workflow 3.2) ทั้งภาษาไทยและอังกฤษ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTurn } from '../src/actorEngine.js';
import { buildDebrief } from '../src/debrief.js';
import { parseUtterance } from '../src/nlu.js';
import { getScenario } from '../src/scenarios.js';

function play(scenario, lang, turns, { noise = 'quiet', profile = null } = {}) {
  let order = null;
  const history = [];
  const log = [];
  for (const current_turn of turns) {
    const r = processTurn({
      scenario, language: lang, order_state: order, dialogue_history: history, current_turn,
      environment_factors: { noise_level: noise }, learner_profile: profile,
    }, { rng: () => 0 });
    order = r.order_state;
    history.push({ role: 'user', content: 'x' }, { role: 'actor', content: r.actor_reply });
    log.push(r);
  }
  return log;
}

const debrief = (scenario, log, turns, mission_id, lang = 'th') => buildDebrief({
  language: lang, scenario, mission_id, order_state: log.at(-1).order_state,
  turns: log.map((r, i) => ({ channels: turns[i], coach: r.coach })),
});

// ---------------------------------------------------------------- NLU
test('NLU: "ไม่ใส่ถั่วฝักยาว" = ไม่ใส่ ไม่ใช่แพ้ถั่ว และ "เผ็ดน้อย" ที่ตามมาไม่ถูกปฏิเสธ', () => {
  const p = parseUtterance('กะเพราหมูสับ ไม่ใส่ถั่วฝักยาว เผ็ดน้อย พิเศษไข่ดาวสุกๆ', getScenario('restaurant'));
  assert.equal(p.item, 'food_01');
  assert.deepEqual(p.exclude, ['long_bean']);
  assert.deepEqual(p.allergies, []);
  assert.equal(p.options.spice, 'mild');
  assert.equal(p.options.egg, 'fried_well');
  assert.equal(p.options.protein, 'minced_pork');
});

test('NLU: รายการต่อกัน "ไม่ใส่ต้นหอม ผักชี" และ "แพ้กุ้ง" = แพ้อาหารทะเล (ไม่ใช่สั่งกุ้ง)', () => {
  const sc = getScenario('allergy');
  assert.deepEqual(parseUtterance('ไม่ใส่ต้นหอม ผักชี', sc).exclude, ['spring_onion', 'coriander']);
  const p = parseUtterance('ผมแพ้กุ้งครับ', sc);
  assert.deepEqual(p.allergies, ['seafood']);
  assert.equal(p.options.protein, undefined);
});

test('NLU: "ไม่ใช่" เป็นการปฏิเสธ ไม่ใช่การยืนยัน', () => {
  const p = parseUtterance('ไม่ใช่ครับ', getScenario('restaurant'));
  assert.equal(p.no, true);
  assert.equal(p.yes, false);
});

// ---------------------------------------------------------------- Scenario 1.1 คาเฟ่
test('1.1 ชี้ลาเต้เย็น + พูด "หวานน้อยแก้วหนึ่งครับ" → ดีเยี่ยม แล้วถามนม/ไซส์ ทวน และยืนยัน', () => {
  const turns = [
    { user_speech: 'หวานน้อยแก้วหนึ่งครับ', user_action: { type: 'point', target_id: 'iced_latte' } },
    { user_speech: 'นมโอ๊ตครับ' },
    { user_speech: 'ไซส์ปกติครับ' },
    { user_speech: 'ถูกต้องครับ' },
  ];
  const log = play('cafe', 'th', turns);
  assert.equal(log[0].coach.rating, 'excellent');
  assert.match(log[0].actor_reply, /นมโอ๊ต/);
  assert.equal(log[2].order_state.phase, 'confirming');
  assert.match(log[2].actor_reply, /ทวนออเดอร์/);
  assert.ok(log[3].order_state.is_complete);
  assert.equal(log[3].total_price, 55 + 5 + 15);
  assert.ok(log[3].prep_minutes > 0);
});

test('1.1 English: dairy allergy removes the croissant and keeps oat milk', () => {
  const [a] = play('cafe', 'en', [{ user_speech: "I'm allergic to dairy. Could I get two large iced cappuccinos, less sweet, with oat milk and a croissant please?" }]);
  assert.deepEqual(a.order_state.allergies, ['dairy']);
  assert.ok(!a.order_state.modifiers.includes('croissant'));
  assert.equal(a.order_state.options.milk, 'oat');
  assert.equal(a.order_state.quantity, 2);
  assert.match(a.actor_reply, /2 iced cappuccinos/);
});

test('1.1 พูดกำกวม "เอากาแฟแก้วนึง" → ถามชนิดกาแฟ, ต้องปรับปรุง', () => {
  const [a] = play('cafe', 'th', [{ user_speech: 'เอากาแฟแก้วนึง' }]);
  assert.match(a.actor_reply, /ลาเต้/);
  assert.equal(a.coach.rating, 'improve');
});

test('1.1 ชี้กับพูดขัดกัน → พนักงานถามยืนยัน', () => {
  const [a] = play('cafe', 'en', [{ user_speech: 'latte', user_action: { type: 'point', target_id: 'mocha' } }]);
  assert.equal(a.action_state, 'confused');
  assert.equal(a.order_state.item, null);
});

test('1.1 ร้านเสียงดัง + พูดอย่างเดียว → ฟังไม่ชัด', () => {
  const [a] = play('cafe', 'th', [{ user_speech: 'ลาเต้เย็นครับ' }], { noise: 'loud' });
  assert.match(a.actor_reply, /เสียงดัง/);
});

// ---------------------------------------------------------------- Scenario 1.2 ร้านอาหารตามสั่ง
test('1.2 "กะเพราหมูสับ ไม่ใส่ถั่วฝักยาว เผ็ดน้อย พิเศษไข่ดาวสุกๆ" → ทวนออเดอร์ → ผู้เรียนทวนกลับ = สำเร็จ + recap', () => {
  const turns = [
    { user_speech: 'กะเพราหมูสับ ไม่ใส่ถั่วฝักยาว เผ็ดน้อย พิเศษไข่ดาวสุกๆ ครับ' },
    { user_speech: 'กะเพราหมูสับ เผ็ดน้อย ไข่ดาวสุก ไม่ใส่ถั่วฝักยาว ถูกต้องครับ' },
  ];
  const log = play('restaurant', 'th', turns);
  assert.equal(log[0].order_state.phase, 'confirming');
  assert.deepEqual(log[0].order_state.modifiers, ['no_long_bean']);
  assert.equal(log[0].total_price, 50 + 10);
  assert.ok(log[1].order_state.is_complete);
  assert.equal(log[1].coach.flags.recap, true);
  const d = debrief('restaurant', log, [{ speech: true }, { speech: true }], 'r1');
  assert.equal(d.scores.goal, 100);
  assert.equal(d.stars, 3);
});

test('1.2 ไข่ดาวไม่ระบุความสุก → พนักงานถาม "สุกหรือไม่สุก" และตีความคำตอบสั้น', () => {
  const log = play('restaurant', 'en', [{ user_text: 'kaprao with chicken, mild, fried egg please' }, { user_text: 'runny' }]);
  assert.match(log[0].actor_reply, /well done or runny/);
  assert.equal(log[1].order_state.options.egg, 'fried_runny');
  assert.equal(log[1].order_state.phase, 'confirming');
});

test('1.2 Checkbox modifiers แทนการพูด + ขอแก้ตอนทวน', () => {
  const log = play('restaurant', 'th', [
    { user_action: { type: 'point', target_id: 'food_02' }, user_selection: { options: { protein: 'shrimp' }, modifiers: ['no_spring_onion', 'takeaway'] } },
    { user_text: 'ไม่ใช่ครับ' },
    { user_text: 'ขอเป็นจานพิเศษครับ' },
  ]);
  assert.equal(log[0].order_state.phase, 'confirming');
  assert.deepEqual(log[0].order_state.modifiers, ['no_spring_onion', 'takeaway']);
  assert.equal(log[1].order_state.phase, 'ordering');
  assert.match(log[1].actor_reply, /แก้ไข/);
  assert.equal(log[2].order_state.options.portion, 'large');
  assert.equal(log[2].order_state.phase, 'confirming');
});

test('1.2 ขอไม่ใส่วัตถุดิบที่ไม่มีในจาน / เอาออกไม่ได้ → พนักงานอธิบาย', () => {
  const [a] = play('restaurant', 'th', [{ user_text: 'ข้าวผัดกระเทียมแซลมอน ไม่ใส่กระเทียม' }]);
  assert.match(a.actor_reply, /ส่วนผสมหลัก/);
  assert.ok(!a.order_state.modifiers.includes('no_garlic'));
});

// ---------------------------------------------------------------- Scenario 1.3 แพ้อาหาร
test('1.3 ตัวอย่าง Workflow: ชี้ food_04 + พูดเปลี่ยนเป็นซาบะ ไม่ใส่ต้นหอม + ติ๊กแยกน้ำจิ้ม/ไม่ใส่ผักชี', () => {
  const [a] = play('allergy', 'th', [{
    user_action: { type: 'point', target_id: 'food_04', target_label: 'ข้าวผัดกระเทียมแซลมอน' },
    user_speech: 'ขอเปลี่ยนเป็นปลาซาบะย่างแทนได้ไหมครับ แล้วก็ไม่ใส่ต้นหอม',
    user_selection: { modifiers: ['sauce_side', 'no_coriander'] },
  }]);
  assert.equal(a.order_state.item, 'food_04');
  assert.equal(a.order_state.options.protein, 'saba');
  assert.deepEqual([...a.order_state.modifiers].sort(), ['no_coriander', 'no_spring_onion', 'sauce_side']);
  assert.match(a.actor_reply, /ข้าวผัดกระเทียมปลาซาบะย่าง/);
  assert.equal(a.coach.rating, 'excellent');
});

test('1.3 แพ้ถั่วลิสง → ผัดไทยไม่ใส่ถั่วอัตโนมัติ, ถามส่วนผสมได้คะแนน, debrief มีคะแนนความปลอดภัย', () => {
  const turns = [{ text: true }, { text: true }, { text: true }];
  const log = play('allergy', 'th', [
    { user_text: 'ผมแพ้ถั่วลิสงครับ ขอผัดไทยกุ้ง' },
    { user_text: 'แน่ใจนะครับว่าไม่มีถั่ว' },
    { user_text: 'ถูกต้องครับ' },
  ], { profile: { allergies: ['peanut'] } });
  assert.ok(log[0].order_state.modifiers.includes('no_peanut'));
  assert.match(log[0].actor_reply, /ไม่ใส่/);
  assert.equal(log[1].coach.flags.safety_asked, true);
  assert.match(log[1].actor_reply, /มั่นใจได้/);
  assert.ok(log[2].order_state.is_complete);
  const d = debrief('allergy', log, turns, 'a1');
  assert.equal(d.scores.safety, 100);
  assert.equal(d.scores.goal, 100);
});

test('1.3 แพ้อาหารทะเลแต่สั่งต้มยำกุ้ง → ปฏิเสธและแนะนำเมนูที่ปลอดภัย', () => {
  const [a] = play('allergy', 'th', [{ user_text: 'แพ้อาหารทะเลครับ ขอต้มยำกุ้ง' }], { profile: { allergies: ['seafood'] } });
  assert.equal(a.order_state.item, null);
  assert.equal(a.action_state, 'warning');
  assert.match(a.actor_reply, /เอาออกไม่ได้/);
});

test('1.3 สั่งกะเพรากุ้งโดยยังไม่แจ้งว่าแพ้ → โค้ชเตือน, แจ้งทีหลัง → เปลี่ยนเนื้อสัตว์ + งดซอสหอยนางรม', () => {
  const log = play('allergy', 'th', [
    { user_text: 'ขอกะเพรากุ้ง เผ็ดกลาง' },
    { user_text: 'ผมแพ้อาหารทะเลครับ' },
    { user_text: 'หมูสับครับ' },
  ], { profile: { allergies: ['seafood'] } });
  assert.equal(log[0].coach.rating, 'improve');
  assert.deepEqual(log[0].coach.flags.risk, ['seafood']);
  assert.equal(log[1].order_state.options.protein, undefined);
  assert.ok(log[1].order_state.modifiers.includes('no_oyster_sauce'));
  assert.equal(log[2].order_state.options.protein, 'minced_pork');
  assert.equal(log[2].order_state.phase, 'confirming');
});

test('1.3 การ์ด AAC แจ้งแพ้ไข่ + ชี้ข้าวผัด → งดไข่อัตโนมัติ และเอาติ๊กออกไม่ได้', () => {
  const log = play('allergy', 'en', [
    { user_action: { type: 'point', target_id: 'food_02' }, user_selection: { allergies: ['egg'], options: { protein: 'chicken' } } },
    { user_selection: { modifiers: [] } },
  ]);
  assert.deepEqual(log[0].order_state.allergies, ['egg']);
  assert.ok(log[0].order_state.modifiers.includes('no_egg'));
  assert.ok(log[1].order_state.modifiers.includes('no_egg'));
});

test('debrief: ภารกิจแพ้ถั่วแต่ไม่แจ้ง → ความปลอดภัยต่ำ, goal ถูกจำกัด', () => {
  const log = play('allergy', 'th', [{ user_text: 'ขอผัดไทยกุ้งครับ' }, { user_text: 'ถูกต้องครับ' }], { profile: { allergies: ['peanut'] } });
  const d = debrief('allergy', log, [{ text: true }, { text: true }], 'a1');
  assert.ok(log[1].order_state.is_complete);
  assert.equal(d.scores.safety, 0);
  assert.ok(d.scores.goal <= 20);
  assert.ok(d.improvements.length > 0);
});
