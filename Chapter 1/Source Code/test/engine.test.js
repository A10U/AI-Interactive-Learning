// ทดสอบสถานการณ์ตาม Master Plan หัวข้อ 3 (Scenario 1.1 - 1.3 และ Interaction Workflow 3.2) ทั้งภาษาไทยและอังกฤษ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTurn } from '../src/actorEngine.js';
import { buildDebrief } from '../src/debrief.js';
import { parseUtterance } from '../src/nlu.js';
import { getScenario, SCENARIO_LIST } from '../src/scenarios.js';
import { startCustomer, customerTurn, buildStaffDebrief } from '../src/customerEngine.js';
import { buildAssist } from '../src/assistEngine.js';
import { emptyOrder } from '../src/order.js';

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

// ---------------------------------------------------------------- โหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน)
function customer(scenario, target, profile = {}) {
  const st = startCustomer({ scenario, language: 'th' }, () => 0.99).customer_state;
  st.target = { ...emptyOrder(), ...target };
  st.profile = profile;
  st.safety_mods = target.safety_mods || [];
  st.revealed = { item: true, quantity: (target.quantity || 1) === 1, options: {}, modifiers: [], allergies: !!profile.allergies };
  return st;
}
function serve(scenario, st, lines) {
  const log = [];
  for (const l of lines) {
    const r = customerTurn({ scenario, language: 'th', customer_state: st, current_turn: { user_text: l } });
    st = r.customer_state;
    log.push(r);
  }
  return log;
}

test('Role swap คาเฟ่: ถามรวดเดียว → ทวน → บอกราคาถูก = ขายสำเร็จ', () => {
  const st = customer('cafe', { item: 'latte', options: { temperature: 'iced', milk: 'oat', sweetness: 'less', size: 'regular' }, quantity: 1 });
  const log = serve('cafe', st, [
    'สวัสดีครับ รับร้อนหรือเย็น นมอะไร หวานระดับไหน ไซส์ไหนดีครับ?',
    'ลาเต้เย็น นมโอ๊ต หวานน้อย ไซส์ปกตินะครับ',
    'ทั้งหมด 75 บาทครับ',
  ]);
  assert.equal(log[0].coach.rating, 'excellent');
  assert.equal(log[2].customer_state.phase, 'done');
  const d = buildStaffDebrief({ language: 'th', scenario: 'cafe', turns: log.map((r) => ({ coach: r.coach })), customer_state: log[2].customer_state });
  assert.equal(d.stars, 3);
});

test('Role swap ร้านตามสั่ง: ลูกค้าอยากได้ไข่ดาวสุก — ต้องถาม "รับอะไรเพิ่มไหม" และทวนให้ครบ', () => {
  const st = customer('restaurant', { item: 'food_01', options: { protein: 'minced_pork', spice: 'mild', egg: 'fried_well' }, quantity: 1 });
  const early = serve('restaurant', st, ['ข้าวกะเพราหมูสับ เผ็ดน้อยนะครับ']);
  assert.match(early[0].customer_reply, /ไข่ดาวสุก/); // ทวนขาด → ลูกค้าเติมให้
  const log = serve('restaurant', st, ['รับเนื้อสัตว์อะไร เผ็ดระดับไหนดีครับ?', 'รับอะไรเพิ่มไหมครับ?', 'ข้าวกะเพราหมูสับ เผ็ดน้อย ไข่ดาวสุกนะครับ', 'ทั้งหมด 60 บาทครับ']);
  assert.match(log[1].customer_reply, /ไข่ดาวสุก/);
  assert.equal(log[2].coach.flags.readback_ok, true);
  assert.equal(log[3].customer_state.phase, 'done');
});

test('Role swap: ถามเรื่องไข่ แต่ลูกค้าไม่เอาไข่ → "ไม่เอาครับ" (ไม่ error)', () => {
  const st = customer('restaurant', { item: 'food_07', options: { spice: 'hot' }, quantity: 1 });
  const [r] = serve('restaurant', st, ['รับไข่ดาวด้วยไหมครับ?']);
  assert.ok(r.customer_reply.length > 0);
});

// ---------------------------------------------------------------- ตัวช่วย (Assist Bot)
test('Assist: ทำตามตัวช่วยครบทุกภารกิจ ทุกสถานการณ์ ทั้งไทย/อังกฤษ → สั่งสำเร็จและผ่านภารกิจ', () => {
  for (const lang of ['th', 'en']) {
    for (const sc of SCENARIO_LIST) {
      for (const m of sc.missions) {
        let order = null;
        const history = [];
        for (let i = 0; i < 12 && !order?.is_complete; i++) {
          const a = buildAssist({ scenario: sc.id, language: lang, order_state: order, dialogue_history: history, mission_id: m.id, learner_profile: m.profile || null });
          const say = (a.suggestions.find((x) => x.star) || a.suggestions[0]).text;
          const r = processTurn({ scenario: sc.id, language: lang, current_turn: { user_text: say }, dialogue_history: history, order_state: order, learner_profile: m.profile || null }, { rng: () => 1 });
          history.push({ role: 'user', content: say }, { role: 'actor', content: r.actor_reply });
          order = r.order_state;
        }
        assert.ok(order.is_complete, `${lang} ${sc.id} ${m.id}`);
        const d = buildDebrief({ language: lang, scenario: sc.id, mission_id: m.id, order_state: order, turns: [] });
        assert.ok(d.checks.every((c) => c.ok), `${lang} ${sc.id} ${m.id}: ${JSON.stringify(d.checks)}`);
      }
    }
  }
});

test('Assist โหมดพนักงาน: ทำตามตัวช่วย → ขายสำเร็จทุกสถานการณ์ (สุ่มลูกค้า 25 คน/สถานการณ์)', () => {
  for (const lang of ['th', 'en']) {
    for (const sc of SCENARIO_LIST) {
      for (let seed = 1; seed <= 25; seed++) {
        let x = seed * 7919;
        const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647);
        const r0 = startCustomer({ scenario: sc.id, language: lang }, rng);
        let st = r0.customer_state;
        const history = [{ role: 'customer', content: r0.customer_reply }];
        for (let i = 0; i < 12 && st.phase !== 'done'; i++) {
          const a = buildAssist({ mode: 'staff', scenario: sc.id, language: lang, customer_state: st, dialogue_history: history });
          const say = (a.suggestions.find((y) => y.star) || a.suggestions[0]).text;
          const r = customerTurn({ scenario: sc.id, language: lang, current_turn: { user_text: say }, dialogue_history: history, customer_state: st });
          history.push({ role: 'staff', content: say }, { role: 'customer', content: r.customer_reply });
          st = r.customer_state;
        }
        assert.equal(st.phase, 'done', `${lang} ${sc.id} seed ${seed}`);
      }
    }
  }
});
