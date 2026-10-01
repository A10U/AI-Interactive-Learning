// ทดสอบ Chapter 2: 4 สถานการณ์ (โหมดลูกค้า) + โหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTurn } from '../src/actorEngine.js';
import { buildDebrief } from '../src/debrief.js';
import { startCustomer, customerTurn, buildStaffDebrief } from '../src/customerEngine.js';
import { emptyOrder } from '../src/order.js';
import { buildAssist } from '../src/assistEngine.js';
import { SCENARIO_LIST } from '../src/scenarios.js';

function play(scenario, lang, turns, { profile = null } = {}) {
  let order = null;
  const history = [];
  const log = [];
  for (const current_turn of turns) {
    const r = processTurn({ scenario, language: lang, order_state: order, dialogue_history: history, current_turn, learner_profile: profile }, { rng: () => 1 });
    order = r.order_state;
    history.push({ role: 'user', content: 'x' }, { role: 'actor', content: r.actor_reply });
    log.push(r);
  }
  return log;
}

const debrief = (scenario, log, mission_id) => buildDebrief({
  language: 'th', scenario, mission_id, order_state: log.at(-1).order_state,
  turns: log.map((r) => ({ channels: { text: true }, coach: r.coach })),
});

// ---------------------------------------------------------------- 2.1 เบเกอรี
test('2.1 ครัวซองต์อัลมอนด์ อุ่น ทานที่ร้าน + ไอศกรีม → ภารกิจ b1 สำเร็จ, พนักงานพูด "ค่ะ"', () => {
  const log = play('bakery', 'th', [{ user_text: 'ขอครัวซองต์อัลมอนด์ อุ่นให้หน่อย ทานที่ร้าน เพิ่มไอศกรีมด้วยค่ะ' }, { user_text: 'ถูกต้องค่ะ' }]);
  assert.match(log[0].actor_reply, /นะคะ/);
  assert.doesNotMatch(log[0].actor_reply, /ครับ/);
  assert.equal(log[0].total_price, 85 + 35);
  assert.ok(log[1].order_state.is_complete);
  assert.equal(debrief('bakery', log, 'b1').scores.goal, 100);
});

test('2.1 เค้กทั้งปอนด์ใช้ราคาเฉพาะเมนู + เทียน + กล่องของขวัญ', () => {
  const [a] = play('bakery', 'th', [{ user_text: 'ขอเค้กช็อกโกแลตทั้งปอนด์ กลับบ้าน ขอเทียนกับกล่องของขวัญด้วยครับ' }]);
  assert.equal(a.order_state.options.slice, 'whole');
  assert.equal(a.total_price, 120 + 880 + 10 + 25);
});

test('2.1 แพ้ถั่วเปลือกแข็ง + ครัวซองต์อัลมอนด์ → ปฏิเสธและแนะนำเมนูอื่น', () => {
  const [a] = play('bakery', 'en', [{ user_text: "I'm allergic to tree nuts. Can I get the almond croissant?" }], { profile: { allergies: ['tree_nut'] } });
  assert.equal(a.order_state.item, null);
  assert.equal(a.action_state, 'warning');
  assert.match(a.actor_reply, /can't remove/);
});

// ---------------------------------------------------------------- 2.2 อาหารนานาชาติ
test('2.2 ราเมงทงคตสึ เส้นแข็ง + ไข่ + ไม่ใส่ต้นหอม → ทวนกลับครบ = recap', () => {
  const log = play('international', 'th', [
    { user_text: 'ราเมงซุปทงคตสึ เส้นแข็ง เพิ่มไข่ยางมะตูม ไม่ใส่ต้นหอมครับ' },
    { user_text: 'ราเมงทงคตสึ เส้นแข็ง เพิ่มไข่ยางมะตูม ไม่ใส่ต้นหอม ถูกต้องครับ' },
  ]);
  assert.deepEqual(log[0].order_state.options, { broth: 'tonkotsu', firmness: 'firm' });
  assert.ok(log[1].order_state.is_complete);
  assert.equal(log[1].coach.flags.recap, true);
});

test('2.2 English steak: medium rare, pepper sauce on the side, salad — one shot', () => {
  const [a] = play('international', 'en', [{ user_text: 'Ribeye medium rare with black pepper sauce on the side and a salad please' }]);
  assert.equal(a.order_state.phase, 'confirming');
  assert.equal(a.order_state.options.doneness, 'medium_rare');
  assert.ok(a.order_state.modifiers.includes('sauce_side'));
});

test('2.2 แพ้กลูเตน + ขอแป้งนาน → พนักงานเตือน และเสนอข้าวแทน', () => {
  const log = play('international', 'th', [{ user_text: 'แพ้กลูเตนครับ ขอบัตเตอร์ชิคเก้นกับแป้งนาน เผ็ดกลาง' }, { user_text: 'ข้าวครับ' }, { user_text: 'ใช่ครับ' }], { profile: { allergies: ['gluten'] } });
  assert.equal(log[0].order_state.options.carb, undefined);
  assert.match(log[0].actor_reply, /ข้าวบาสมาติ/);
  assert.equal(debrief('international', log, 'i4').scores.goal, 100);
});

// ---------------------------------------------------------------- 2.3 น้ำผลไม้ / มัทฉะ
test('2.3 มัทฉะลาเต้เย็น นมโอ๊ต หวานน้อย เข้มข้น → ราคา 95+15+20', () => {
  const [a] = play('juice', 'th', [{ user_text: 'มัทฉะลาเต้เย็น นมโอ๊ต หวานน้อย เข้มข้นครับ' }]);
  assert.equal(a.order_state.options.matcha_level, 'strong');
  assert.equal(a.total_price, 95 + 15 + 20);
});

test('2.3 ตอบสั้น "น้อย" ตอนถูกถามเรื่องน้ำแข็ง = น้ำแข็งน้อย (ไม่ใช่หวานน้อย)', () => {
  const log = play('juice', 'th', [{ user_text: 'น้ำส้มคั้น หวานปกติ ไซส์ใหญ่ครับ' }, { user_text: 'น้อยครับ' }]);
  assert.equal(log[1].order_state.options.ice, 'less');
  assert.equal(log[1].order_state.options.sweetness, 'normal');
});

// ---------------------------------------------------------------- 2.4 ค็อกเทล / ม็อกเทล
test('2.4 โมจิโต้มีแอลกอฮอล์ → ต้องแสดงบัตรก่อนทวนออเดอร์ (อายุ 25)', () => {
  const log = play('bar', 'th', [
    { user_text: 'ขอโมจิโต้แบบมีแอลกอฮอล์ หวานน้อยครับ' },
    { user_text: 'นี่ครับบัตรประชาชน' },
    { user_text: 'ถูกต้องครับ' },
  ], { profile: { age: 25 } });
  assert.match(log[0].actor_reply, /บัตรประชาชน/);
  assert.equal(log[0].order_state.phase, 'ordering');
  assert.equal(log[1].order_state.id_status, 'verified');
  assert.ok(log[2].order_state.is_complete);
  assert.equal(debrief('bar', log, 'k1').scores.goal, 100);
});

test('2.4 อายุ 18 ยื่นบัตร (การ์ด AAC) → มาร์การิต้าเปลี่ยนเป็นเวอร์จิ้นอัตโนมัติ', () => {
  const log = play('bar', 'th', [
    { user_text: 'ขอมาร์การิต้าแบบมีแอลกอฮอล์ ปั่น ขอบเกลือครับ' },
    { user_selection: { show_id: true } },
  ], { profile: { age: 18 } });
  assert.equal(log[0].coach.rating, 'improve');
  assert.equal(log[1].order_state.id_status, 'refused');
  assert.equal(log[1].order_state.options.alcohol, 'virgin');
  assert.match(log[1].actor_reply, /กฎหมาย/);
});

test('2.4 โกหกอายุ 25 แต่บัตรบอก 18 → โค้ชจับได้ และไม่ขายจินโทนิค', () => {
  const log = play('bar', 'en', [{ user_text: "I'm 25, a gin and tonic with cucumber please" }, { user_text: "here's my id" }], { profile: { age: 18 } });
  assert.equal(log[0].coach.flags.lied, true);
  assert.equal(log[1].order_state.item, null);
  assert.equal(log[1].order_state.id_status, 'refused');
});

test('2.4 ม็อกเทลไม่ต้องตรวจบัตร และ debrief ภารกิจคนขับรถได้คะแนนความรับผิดชอบเต็ม', () => {
  const log = play('bar', 'th', [{ user_text: 'อัญชันมะนาวโซดา หวานน้อย น้ำแข็งน้อย ไม่รับหลอดครับ' }, { user_text: 'ใช่ครับ' }], { profile: { age: 30, driving: true } });
  assert.ok(log[1].order_state.is_complete);
  const d = debrief('bar', log, 'k3');
  assert.equal(d.scores.safety, 100);
  assert.equal(d.scores.goal, 100);
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

test('Role swap: ถาม → ทวน → บอกราคาถูก = ขายสำเร็จ 3 ดาว', () => {
  const st = customer('juice', { item: 'jm_05', options: { temperature: 'iced', milk: 'oat', sweetness: 'less', matcha_level: 'strong' }, quantity: 1 });
  const log = serve('juice', st, [
    'สวัสดีครับ ยินดีต้อนรับครับ รับร้อนหรือเย็น นมอะไร ความหวานเท่าไหร่ ความเข้มแบบไหนครับ',
    'มัทฉะลาเต้เย็น นมโอ๊ต หวานน้อย มัทฉะเข้มข้น ทั้งหมด 130 บาทครับ',
  ]);
  assert.equal(log[0].coach.rating, 'excellent');
  assert.equal(log[0].coach.flags.new_info.length, 4);
  assert.equal(log[1].customer_state.phase, 'done');
  const d = buildStaffDebrief({ language: 'th', scenario: 'juice', turns: log.map((r) => ({ coach: r.coach })), customer_state: log[1].customer_state });
  assert.equal(d.stars, 3);
});

test('Role swap: ทวนผิด → ลูกค้าแก้ให้, ราคาผิด → ลูกค้าให้เช็คใหม่', () => {
  const st = customer('juice', { item: 'jm_01', options: { ice: 'none', sweetness: 'none', size: 'large' }, quantity: 1 });
  const log = serve('juice', st, ['น้ำส้มคั้นสด น้ำแข็งน้อย ไม่หวาน ไซส์ใหญ่ครับ', 'ทั้งหมด 65 บาทครับ']);
  assert.match(log[0].customer_reply, /ไม่ใช่ครับ ไม่ใส่น้ำแข็ง/);
  assert.equal(log[0].coach.rating, 'improve');
  assert.match(log[1].customer_reply, /เช็คราคา/);
  assert.equal(log[1].coach.flags.price_bad, true);
});

test('Role swap บาร์: ลูกค้าอายุ 18 → ต้องตรวจบัตรและเสนอเวอร์จิ้น', () => {
  const st = customer('bar', { item: 'bar_01', options: { alcohol: 'with', sweetness: 'less' }, quantity: 1 }, { age: 18 });
  const log = serve('bar', st, [
    'ขอดูบัตรประชาชนหน่อยครับ',
    'ขอโทษครับ อายุไม่ถึง 20 ขายแอลกอฮอล์ให้ไม่ได้ ทำเป็นเวอร์จิ้นได้ไหมครับ',
    'โมจิโต้ เวอร์จิ้น หวานน้อย ทั้งหมด 150 บาทครับ',
  ]);
  assert.match(log[0].customer_reply, /18 ปี/);
  assert.equal(log[1].customer_state.target.options.alcohol, 'virgin');
  assert.equal(log[2].customer_state.phase, 'done');
  const d = buildStaffDebrief({ language: 'th', scenario: 'bar', turns: log.map((r) => ({ coach: r.coach })), customer_state: log[2].customer_state });
  assert.equal(d.scores.safety, 100);
});

test('Role swap: ลูกค้าแพ้นม — พนักงานต้องยืนยันว่าไม่ใส่ชีส', () => {
  const st = customer('international', { item: 'in_04', options: { doneness: 'medium', side: 'fries' }, modifiers: ['no_cheese'], quantity: 1, safety_mods: ['no_cheese'] }, { allergies: ['dairy'] });
  const log = serve('international', st, ['ได้ครับ ทางครัวจะไม่ใส่ชีสให้นะครับ', 'เบอร์เกอร์เนื้อ มีเดียม เฟรนช์ฟรายส์ ไม่ใส่ชีส ทั้งหมด 249 บาทครับ']);
  assert.equal(log[0].coach.flags.allergy_ok, true);
  assert.equal(log[1].customer_state.phase, 'done');
});

// ---------------------------------------------------------------- ตัวช่วย (Assist Bot)
// ทำตามประโยคที่ตัวช่วยแนะนำ (⭐ ก่อน) แล้วต้องสั่ง/ขายได้สำเร็จ
function followAssist(scenario, lang, mission) {
  let order = null;
  const history = [];
  for (let i = 0; i < 12; i++) {
    const a = buildAssist({ scenario, language: lang, order_state: order, dialogue_history: history, mission_id: mission?.id, learner_profile: mission?.profile || null });
    const say = (a.suggestions.find((x) => x.star) || a.suggestions[0]).text;
    const r = processTurn({ scenario, language: lang, current_turn: { user_text: say }, dialogue_history: history, order_state: order, learner_profile: mission?.profile || null }, { rng: () => 1 });
    history.push({ role: 'user', content: say }, { role: 'actor', content: r.actor_reply });
    order = r.order_state;
    if (order.is_complete) return order;
  }
  return order;
}

test('Assist: ทำตามตัวช่วยครบทุกภารกิจ ทุกสถานการณ์ ทั้งไทย/อังกฤษ → สั่งสำเร็จและผ่านภารกิจ', () => {
  for (const lang of ['th', 'en']) {
    for (const sc of SCENARIO_LIST) {
      for (const m of sc.missions) {
        const order = followAssist(sc.id, lang, m);
        assert.ok(order.is_complete, `${lang} ${sc.id} ${m.id}`);
        const d = buildDebrief({ language: lang, scenario: sc.id, mission_id: m.id, order_state: order, turns: [] });
        assert.ok(d.checks.every((c) => c.ok), `${lang} ${sc.id} ${m.id}: ${JSON.stringify(d.checks)}`);
      }
    }
  }
});

test('Assist: ถูกถามเรื่องความสุก → อธิบายศัพท์ มีเดียมแรร์ และเสนอคำตอบ ⭐ ตามภารกิจ', () => {
  const [a] = play('international', 'th', [{ user_text: 'ขอสเต๊กริบอายครับ' }]);
  const h = buildAssist({ scenario: 'international', language: 'th', polite: 'ค่ะ', mission_id: 'i2', order_state: a.order_state, dialogue_history: [{ role: 'user', content: 'x' }, { role: 'actor', content: a.actor_reply }] });
  assert.equal(h.slot, 'doneness');
  assert.ok(h.glossary.some((g) => g.term === 'มีเดียมแรร์' && /ชมพู/.test(g.meaning)));
  assert.ok(h.suggestions.every((x) => !/ครับ/.test(x.text)), 'ใช้คำลงท้าย ค่ะ');
});

test('Assist: บาร์ ภารกิจอายุไม่ถึง → เตือน และไม่เสนอแบบมีแอลกอฮอล์', () => {
  const sc = SCENARIO_LIST.find((x) => x.id === 'bar');
  const m = sc.missions.find((x) => x.profile?.age < 20 || x.profile?.driving);
  const h = buildAssist({ scenario: 'bar', language: 'th', mission_id: m.id, learner_profile: m.profile, order_state: null, dialogue_history: [] });
  assert.ok(h.warnings.some((w) => /แอลกอฮอล์/.test(w)));
});

test('Assist โหมดพนักงาน: ทำตามตัวช่วย → ขายสำเร็จทุกสถานการณ์ (สุ่มลูกค้า 15 คน/สถานการณ์)', () => {
  for (const lang of ['th', 'en']) {
    for (const sc of SCENARIO_LIST) {
      for (let seed = 1; seed <= 15; seed++) {
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

test('Role swap: คำถามที่เอ่ยชื่อเมนู ("ขนมปังต้องการให้สไลซ์ไหม") ไม่ถูกนับเป็นการทวน', () => {
  const st = customer('bakery', { item: 'bk_08', options: { slicing: 'sliced', dining: 'takeaway' }, quantity: 1 });
  const [r] = serve('bakery', st, ['ขนมปังซาวร์โดว์ต้องการให้สไลซ์เป็นแผ่นไหมครับ?']);
  assert.equal(r.coach.flags.readback_bad, false);
  assert.ok(r.customer_state.revealed.options.slicing);
});
