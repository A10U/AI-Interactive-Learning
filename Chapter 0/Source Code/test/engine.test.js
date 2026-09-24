// ทดสอบสถานการณ์ตามตารางในเอกสารแผนงาน (หัวข้อ 4) ทั้งภาษาไทยและอังกฤษ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTurn } from '../src/ruleEngine.js';
import { buildDebrief } from '../src/debrief.js';

function play(lang, turns, noise = 'quiet') {
  let order = null;
  const history = [];
  const log = [];
  for (const current_turn of turns) {
    const r = processTurn({ language: lang, order_state: order, dialogue_history: history, current_turn, environment_factors: { noise_level: noise } }, { rng: () => 0 });
    order = r.order_state;
    history.push({ role: 'user', content: 'x' }, { role: 'barista', content: r.barista_reply });
    log.push(r);
  }
  return log;
}

test('ชี้ลาเต้เย็น + พูด "หวานน้อยแก้วหนึ่งครับ" → ดีเยี่ยม และราคา 60 บาทเมื่อได้ไซส์', () => {
  const [a, b] = play('th', [
    { user_speech: 'หวานน้อยแก้วหนึ่งครับ', user_action: { type: 'point', target_id: 'menu_iced_latte' } },
    { user_speech: 'ไซส์ปกติครับ' },
  ]);
  assert.equal(a.coach.rating, 'excellent');
  assert.equal(a.order_state.item, 'latte');
  assert.equal(a.order_state.temperature, 'iced');
  assert.equal(a.order_state.sweetness, 'less');
  assert.ok(b.order_state.is_complete);
  assert.equal(b.total_price, 60);
});

test('ชี้อย่างเดียว → บาริสต้ามองตามมือและถามต่อ, โค้ชให้ "ดี" (AAC)', () => {
  const [a] = play('th', [{ user_action: { type: 'point', target_id: 'hot_americano' } }]);
  assert.match(a.barista_reply, /อเมริกาโน่ร้อนตัวนี้/);
  assert.equal(a.coach.rating, 'good');
  assert.equal(a.coach.politeness, null);
});

test('พูดกำกวม "เอากาแฟแก้วนึง" → ถามชนิดกาแฟ, ต้องปรับปรุง', () => {
  const [a] = play('th', [{ user_speech: 'เอากาแฟแก้วนึง' }]);
  assert.match(a.barista_reply, /กาแฟตัวไหน/);
  assert.equal(a.coach.rating, 'improve');
  assert.equal(a.order_state.item, null);
});

test('พิมพ์ "แพ้นมวัว ใช้นมโอ๊ตแทนได้ไหม" → นมโอ๊ต +15 และถามเมนู', () => {
  const [a, b] = play('th', [
    { user_text: 'แพ้นมวัว ใช้นมโอ๊ตแทนได้ไหม' },
    { user_text: 'คาปูชิโน่เย็น หวานน้อย ไซส์ปกติค่ะ' },
  ]);
  assert.match(a.barista_reply, /นมโอ๊ต/);
  assert.equal(a.order_state.milk, 'oat');
  assert.equal(a.coach.rating, 'excellent');
  assert.equal(b.total_price, 55 + 5 + 15);
});

test('English one-shot order with plural and quantity', () => {
  const [a] = play('en', [{ user_speech: 'Hi, could I get two large iced lattes, less sweet please?' }]);
  assert.ok(a.order_state.is_complete);
  assert.equal(a.order_state.quantity, 2);
  assert.equal(a.total_price, (55 + 5 + 10) * 2);
  assert.match(a.barista_reply, /2 iced lattes/);
});

test('English: "regular" answers whichever slot the barista asked about', () => {
  const log = play('en', [{ user_text: 'mocha' }, { user_text: 'hot' }, { user_text: 'regular' }, { user_text: 'regular please' }]);
  assert.equal(log[2].order_state.sweetness, 'normal');
  assert.equal(log[2].order_state.size, null);
  assert.equal(log[3].order_state.size, 'regular');
  assert.ok(log[3].order_state.is_complete);
});

test("\"I'm\" / \"it's\" do not trigger size M/S", () => {
  const [a] = play('en', [{ user_text: "I'm thinking, it's a latte" }]);
  assert.equal(a.order_state.size, null);
});

test('ชี้กับพูดขัดกัน → บาริสต้าถามยืนยัน', () => {
  const [a] = play('en', [{ user_speech: 'latte', user_action: { type: 'point', target_id: 'mocha' } }]);
  assert.equal(a.action_state, 'confused');
  assert.equal(a.order_state.item, null);
});

test('ร้านเสียงดัง + พูดอย่างเดียว → ฟังไม่ชัด', () => {
  const [a] = play('th', [{ user_speech: 'ลาเต้เย็นครับ' }], 'loud');
  assert.match(a.barista_reply, /เสียงดัง/);
});

test('เอสเปรสโซ่เย็นไม่มี → แจ้งและตั้งเป็นร้อน', () => {
  const [a] = play('th', [{ user_speech: 'เอสเปรสโซ่เย็นครับ' }]);
  assert.equal(a.order_state.temperature, 'hot');
  assert.match(a.barista_reply, /แค่แบบร้อน/);
});

test('debrief: ภารกิจสำเร็จในเทิร์นเดียวได้ 3 ดาว', () => {
  const log = play('th', [{ user_speech: 'ขอลาเต้เย็น หวานน้อย ไซส์ปกติ 1 แก้วครับ' }]);
  const d = buildDebrief({
    language: 'th', mission_id: 'm1', order_state: log[0].order_state,
    turns: log.map((r) => ({ channels: { speech: true }, coach: r.coach })),
  });
  assert.equal(d.scores.goal, 100);
  assert.equal(d.stars, 3);
});
