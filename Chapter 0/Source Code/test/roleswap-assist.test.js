// ทดสอบโหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน) และตัวช่วย (Assist Bot)
// เทคนิคหลัก: "ทำตามตัวช่วย" — เลือกประโยค ⭐ (หรือประโยคแรก) ทุกเทิร์น แล้วต้องสั่ง/ขายได้สำเร็จ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTurn } from '../src/ruleEngine.js';
import { buildDebrief } from '../src/debrief.js';
import { MENU, MISSIONS, emptyOrder, totalPrice } from '../src/menu.js';
import { parseUtterance } from '../src/nlu.js';
import { generateCustomer, customerTurn, startCustomer, buildStaffDebrief } from '../src/customerEngine.js';
import { buildAssist } from '../src/assistEngine.js';

function play(lang, turns) {
  let order = null;
  const history = [];
  const log = [];
  for (const current_turn of turns) {
    const r = processTurn({ language: lang, order_state: order, dialogue_history: history, current_turn }, { rng: () => 1 });
    order = r.order_state;
    history.push({ role: 'user', content: 'x' }, { role: 'barista', content: r.barista_reply });
    log.push(r);
  }
  return log;
}

// ลูกค้าที่กำหนดออเดอร์ในใจเอง (ไม่สุ่ม)
function customer(target, profile = {}, revealed = {}) {
  const st = generateCustomer(() => 0.99);
  st.target = { ...emptyOrder(), ...target, allergy: !!profile.allergy };
  st.profile = { allergy: false, pref_milk: false, ...profile };
  st.revealed = { item: true, quantity: (target.quantity || 1) === 1, options: {}, allergy: false, ...revealed };
  return st;
}

function serve(lang, st, lines) {
  const history = [];
  const log = [];
  for (const line of lines) {
    const r = customerTurn({ language: lang, current_turn: { user_text: line }, dialogue_history: history, customer_state: st });
    history.push({ role: 'staff', content: line }, { role: 'customer', content: r.customer_reply });
    st = r.customer_state;
    log.push(r);
  }
  return log;
}

const seeded = (seed) => {
  let x = seed * 7919;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
};

// ================================================================ โหมดสลับบทบาท
test('Role swap: ถามหลายเรื่องในประโยคเดียว → ดีเยี่ยม, ทวนถูก + ราคาถูก → ขายสำเร็จ 3 ดาว', () => {
  const st = customer({ item: 'latte', temperature: 'iced', sweetness: 'less', size: 'large', quantity: 1 });
  const log = serve('th', st, [
    'สวัสดีครับ ยินดีต้อนรับครับ รับร้อน เย็น หรือปั่น ความหวานระดับไหน ไซส์ปกติหรือไซส์ใหญ่ดีครับ?',
    'ขอทวนออเดอร์นะครับ ลาเต้เย็น หวานน้อย ไซส์ใหญ่ 1 แก้ว ทั้งหมด 70 บาทครับ',
  ]);
  assert.equal(log[0].coach.rating, 'excellent');
  assert.deepEqual(log[0].coach.flags.new_info, ['temperature', 'sweetness', 'size']);
  assert.match(log[0].customer_reply, /เย็นครับ หวานน้อยครับ ไซส์ใหญ่ครับ/);
  assert.equal(log[1].customer_state.phase, 'done');
  assert.equal(log[1].total_price, 55 + 5 + 10);
  const d = buildStaffDebrief({ language: 'th', turns: log.map((r) => ({ coach: r.coach })), customer_state: log[1].customer_state });
  assert.equal(d.stars, 3);
});

test('Role swap: ทวนผิด → ลูกค้าแก้ให้, ราคาผิด 2 ครั้ง → ลูกค้าบอกราคาที่ถูก', () => {
  const st = customer({ item: 'mocha', temperature: 'frappe', sweetness: 'none', size: 'regular', quantity: 2 }, {}, { quantity: true });
  const log = serve('th', st, ['มอคค่าปั่น หวานน้อย ไซส์ปกติ 2 แก้วนะครับ', 'ทั้งหมด 100 บาทครับ', 'ทั้งหมด 120 บาทครับ']);
  assert.match(log[0].customer_reply, /ไม่ใช่ครับ ไม่หวานครับ/);
  assert.equal(log[0].coach.rating, 'improve');
  assert.match(log[1].customer_reply, /เช็คราคา/);
  assert.equal(log[1].coach.flags.price_bad, true);
  assert.match(log[2].customer_reply, /140 บาท/);
});

test('Role swap: ลูกค้าแพ้นมวัว — ยืนยันและเสนอนมโอ๊ต/ถั่วเหลือง แล้วทวนให้มีนมทางเลือก', () => {
  const st = customer({ item: 'cappuccino', temperature: 'hot', sweetness: 'normal', size: 'regular', milk: 'soy', quantity: 1 }, { allergy: true }, { allergy: true });
  const log = serve('en', st, [
    'Of course, we will not use dairy. Would you like oat milk or soy milk?',
    'Hot or iced? How sweet would you like it? Regular or large size?',
    'Let me read that back: one hot cappuccino, with soy milk, normal sweetness, regular size. Is that correct?',
    'That is 65 baht, please.',
  ]);
  assert.equal(log[0].coach.flags.allergy_ok, true);
  assert.match(log[0].customer_reply, /Soy milk/);
  assert.ok(log[2].coach.flags.readback_ok, log[2].customer_reply);
  assert.equal(log[3].customer_state.phase, 'done');
  const d = buildStaffDebrief({ language: 'en', turns: log.map((r) => ({ coach: r.coach })), customer_state: log[3].customer_state });
  assert.equal(d.scores.safety, 100);
});

test('Role swap: ทวนแต่ลืมนมทางเลือกของลูกค้าที่แพ้นม → ลูกค้าเตือนเรื่องแพ้', () => {
  const st = customer({ item: 'latte', temperature: 'hot', sweetness: 'less', size: 'regular', milk: 'oat', quantity: 1 }, { allergy: true });
  const [r] = serve('th', st, ['ลาเต้ร้อน หวานน้อย ไซส์ปกติ 1 แก้ว ถูกต้องไหมครับ?']);
  assert.match(r.customer_reply, /แพ้นมวัว/);
  assert.ok(r.customer_state.revealed.allergy);
  assert.equal(r.coach.flags.readback_bad, true);
});

test('Role swap: คำถามที่เอ่ยชื่อเมนู / คำถามให้เลือก ไม่ถูกนับเป็นการทวน', () => {
  const st = customer({ item: 'thai_tea', temperature: 'iced', sweetness: 'extra', size: 'regular', quantity: 1 }, {}, { options: { temperature: true } });
  const [a, b] = serve('th', st, ['ชาไทยเย็นรับหวานระดับไหนดีครับ?', 'ชาไทยรับไซส์ปกติหรือไซส์ใหญ่ครับ?']);
  assert.equal(a.coach.flags.readback_bad, false);
  assert.equal(a.coach.flags.repeats, 0, 'เอ่ยค่าที่รู้แล้วเพื่อยืนยัน ไม่ใช่ถามซ้ำ');
  assert.ok(a.customer_state.revealed.options.sweetness);
  assert.equal(b.coach.flags.readback_bad, false);
  assert.ok(b.customer_state.revealed.options.size);
});

test('Role swap: ถามซ้ำเรื่องที่บอกแล้ว → ต้องปรับปรุง, ถามนมกับอเมริกาโน่ → ไม่เกี่ยว', () => {
  const st = customer({ item: 'americano', temperature: 'hot', sweetness: 'none', size: 'large', quantity: 1 }, {}, { options: { temperature: true } });
  const [a, b] = serve('th', st, ['รับร้อนหรือเย็นครับ?', 'รับนมอะไรดีครับ?']);
  assert.equal(a.coach.rating, 'improve');
  assert.match(a.customer_reply, /บอกไปแล้ว/);
  assert.match(b.customer_reply, /ต้องเลือกเรื่องนั้นด้วยเหรอ/);
});

test('Role swap: "Anything else?" → ลูกค้าที่ชอบนมโอ๊ตบอกเพิ่ม และนับในการทวน', () => {
  const st = customer({ item: 'green_tea', temperature: 'iced', sweetness: 'normal', size: 'regular', milk: 'oat', quantity: 1 }, { pref_milk: true }, { options: { temperature: true, sweetness: true, size: true } });
  const log = serve('en', st, ['Anything else?', 'Let me read that back: one iced green milk tea, with oat milk, normal sweetness, regular size. Is that correct?']);
  assert.match(log[0].customer_reply, /oat milk/);
  assert.ok(log[1].coach.flags.readback_ok, log[1].customer_reply);
});

test('Role swap: startCustomer สุ่มลูกค้าได้ และประโยคเปิดเอ่ยชื่อเมนูที่สั่ง (NLU อ่านออก)', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const rng = seeded(seed);
    for (const lang of ['th', 'en']) {
      const r = startCustomer({ language: lang }, rng);
      assert.equal(parseUtterance(r.customer_reply).item, r.customer_state.target.item, r.customer_reply);
      assert.ok(totalPrice(r.customer_state.target) > 0);
      assert.ok(MENU.some((m) => m.id === r.customer_state.target.item));
    }
  }
});

// ================================================================ ตัวช่วย (Assist Bot) — โหมดลูกค้า
function followAssist(lang, mission, polite = 'ครับ') {
  let order = null;
  const history = [];
  for (let i = 0; i < 10; i++) {
    const a = buildAssist({ language: lang, polite, order_state: order, dialogue_history: history, mission_id: mission?.id });
    const say = (a.suggestions.find((x) => x.star) || a.suggestions[0]).text;
    const r = processTurn({ language: lang, current_turn: { user_text: say }, dialogue_history: history, order_state: order }, { rng: () => 1 });
    history.push({ role: 'user', content: say }, { role: 'barista', content: r.barista_reply });
    order = r.order_state;
    if (order.is_complete) return order;
  }
  return order;
}

test('Assist: ทำตามตัวช่วยครบทุกภารกิจ ทั้งไทย/อังกฤษ (ครับ/ค่ะ) → สั่งสำเร็จและผ่านภารกิจ 100%', () => {
  for (const lang of ['th', 'en']) {
    for (const polite of ['ครับ', 'ค่ะ']) {
      for (const m of MISSIONS) {
        const order = followAssist(lang, m, polite);
        assert.ok(order.is_complete, `${lang} ${m.id} ${JSON.stringify(order)}`);
        const d = buildDebrief({ language: lang, mission_id: m.id, order_state: order, turns: [] });
        assert.equal(d.scores.goal, 100, `${lang} ${m.id}: ${JSON.stringify(order)}`);
      }
    }
  }
});

test('Assist: สั่งผิดภารกิจ → เตือน และเสนอประโยคแก้ไข ⭐ ที่บาริสต้าเข้าใจ', () => {
  const [a] = play('th', [{ user_text: 'ขอลาเต้ร้อนครับ' }]);
  const h = buildAssist({ language: 'th', mission_id: 'm1', order_state: a.order_state, dialogue_history: [{ role: 'user', content: 'x' }, { role: 'barista', content: a.barista_reply }] });
  assert.ok(h.warnings.some((w) => /ยังไม่ตรง/.test(w)));
  const fix = h.suggestions.find((s) => s.star);
  assert.match(fix.text, /เย็น/);
  const b = play('th', [{ user_text: 'ขอลาเต้ร้อนครับ' }, { user_text: fix.text }])[1];
  assert.equal(b.order_state.temperature, 'iced');
});

test('Assist: ถูกถามเรื่องอุณหภูมิ → อธิบายศัพท์ "ปั่น" และใช้คำลงท้าย ค่ะ', () => {
  const [a] = play('th', [{ user_text: 'ขอมอคค่าค่ะ' }]);
  const h = buildAssist({ language: 'th', polite: 'ค่ะ', order_state: a.order_state, dialogue_history: [{ role: 'user', content: 'x' }, { role: 'barista', content: a.barista_reply }] });
  assert.equal(h.slot, 'temperature');
  assert.ok(h.glossary.some((g) => g.term === 'ปั่น' && /น้ำแข็ง/.test(g.meaning)), JSON.stringify(h.glossary));
  assert.ok(h.suggestions.every((x) => !/ครับ/.test(x.text)));
  assert.equal(h.last_line, a.barista_reply);
});

test('Assist: ทุกประโยคตัวช่วย (โหมดลูกค้า) บาริสต้าเข้าใจ — ทุกเมนู ทุกสล็อต', () => {
  for (const lang of ['th', 'en']) {
    for (const it of MENU) {
      const states = [null, { ...emptyOrder(), item: it.id }, { ...emptyOrder(), item: it.id, allergy: true }];
      for (const temperature of it.temps) {
        states.push({ ...emptyOrder(), item: it.id, temperature }, { ...emptyOrder(), item: it.id, temperature, sweetness: 'less' });
      }
      for (const order of states) {
        const history = order ? [{ role: 'user', content: 'x' }, { role: 'barista', content: 'y' }] : [];
        const a = buildAssist({ language: lang, order_state: order, dialogue_history: history });
        assert.ok(a.suggestions.length > 0);
        for (const s of a.suggestions) {
          if (/แนะนำ|recommend/i.test(s.text)) continue;
          const r = processTurn({ language: lang, current_turn: { user_text: s.text }, dialogue_history: history, order_state: order }, { rng: () => 1 });
          assert.ok(r.coach.slots_filled.length > 0, `${lang} ${it.id} ${a.slot}: "${s.text}" → ${r.barista_reply}`);
        }
      }
    }
  }
});

// ================================================================ ตัวช่วย (Assist Bot) — โหมดพนักงาน
test('Assist โหมดพนักงาน: ทำตามตัวช่วย → ขายสำเร็จ (สุ่มลูกค้า 60 คน × ไทย/อังกฤษ) และทุกประโยคลูกค้าเข้าใจ', () => {
  const confused = { th: 'ลูกค้าไม่เข้าใจสิ่งที่พูด', en: "The customer didn't understand" };
  for (const lang of ['th', 'en']) {
    for (let seed = 1; seed <= 60; seed++) {
      const r0 = startCustomer({ language: lang }, seeded(seed));
      let st = r0.customer_state;
      const history = [{ role: 'customer', content: r0.customer_reply }];
      const turns = [];
      for (let i = 0; i < 12 && st.phase !== 'done'; i++) {
        const a = buildAssist({ mode: 'staff', language: lang, customer_state: st, dialogue_history: history });
        assert.ok(a.suggestions.length > 0, `${lang} seed ${seed}: no suggestions`);
        // ทุกประโยคที่ตัวช่วยเสนอ ลูกค้าต้องไม่งง
        for (const s of a.suggestions) {
          const probe = customerTurn({ language: lang, current_turn: { user_text: s.text }, dialogue_history: history, customer_state: st });
          assert.ok(!probe.coach.notes.includes(confused[lang]), `${lang} seed ${seed}: "${s.text}" → ${probe.customer_reply}`);
        }
        const say = (a.suggestions.find((y) => y.star) || a.suggestions[0]).text;
        const r = customerTurn({ language: lang, current_turn: { user_text: say }, dialogue_history: history, customer_state: st });
        history.push({ role: 'staff', content: say }, { role: 'customer', content: r.customer_reply });
        turns.push({ coach: r.coach });
        assert.equal(r.coach.flags.readback_bad, false, `${lang} seed ${seed}: "${say}" → ${r.customer_reply}`);
        assert.equal(r.coach.flags.repeats, 0, `${lang} seed ${seed}: "${say}" → ${r.customer_reply}`);
        assert.equal(r.coach.flags.irrelevant, false, `${lang} seed ${seed}: "${say}" → ${r.customer_reply}`);
        assert.equal(r.coach.flags.price_bad, false, `${lang} seed ${seed}: "${say}" → ${r.customer_reply}`);
        st = r.customer_state;
      }
      assert.equal(st.phase, 'done', `${lang} seed ${seed}: ${JSON.stringify(st.target)} ${JSON.stringify(history)}`);
      const d = buildStaffDebrief({ language: lang, turns, customer_state: st });
      assert.ok(d.stars >= 2, `${lang} seed ${seed}: ${d.overall}`);
      if (st.profile.allergy) assert.equal(d.scores.safety, 100, `${lang} seed ${seed}`);
    }
  }
});

test('Assist โหมดพนักงาน: หลังทวนถูก → แสดงวิธีคิดราคาที่รวมแล้วตรงกับราคาจริง', () => {
  const st = customer({ item: 'cappuccino', temperature: 'frappe', sweetness: 'less', size: 'large', milk: 'oat', quantity: 2 }, { allergy: true }, { quantity: true, allergy: true, options: { temperature: true, sweetness: true, size: true, milk: true } });
  st.readback_ok = true;
  st.allergy_ack = true;
  st.greeted = true;
  const a = buildAssist({ mode: 'staff', language: 'th', customer_state: st, dialogue_history: [] });
  assert.equal(a.price.at(-1), `= 90 × 2 = ${totalPrice(st.target)}`);
  assert.match(a.suggestions.find((s) => s.star).text, /180 บาท/);
});
