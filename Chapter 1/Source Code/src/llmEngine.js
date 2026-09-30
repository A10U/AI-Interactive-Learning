// Intelligence Layer ด้วย Claude (ตัวเลือก): Actor Agent + Coach Agent เรียกแบบขนาน พร้อม Structured Output (JSON Schema)
// เปิดใช้เมื่อมี ANTHROPIC_API_KEY — ถ้าเรียกไม่สำเร็จ server จะถอยกลับไปใช้ Offline engine
// หลัง Claude ตอบ server ตรวจซ้ำเสมอ: ความถูกต้องของ Slot, ราคา, ลำดับ ทวน→ยืนยัน และ Safety Guard เรื่องอาการแพ้ (ไม่พึ่ง LLM)
import Anthropic from '@anthropic-ai/sdk';
import { GROUPS, INGREDIENTS, ALLERGENS, MODIFIERS, getScenario } from './scenarios.js';
import {
  normalizeOrder, itemById, setItem, applicableModifiers, allModifierIds, scenarioGroups, missingSlots,
  totalPrice, prepMinutes, modifierDef, removableOf, cardPrice, cardName,
} from './order.js';
import { enforceSafety, readbackLine } from './actorEngine.js';
import { RATING_LABELS, allergyRisk } from './coachEngine.js';

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5';
const client = new Anthropic();

const nullableEnum = (values) => ({ anyOf: [{ type: 'string', enum: values }, { type: 'null' }] });

function actorSchema(sc) {
  const groups = scenarioGroups(sc);
  return {
    type: 'object',
    additionalProperties: false,
    required: ['actor_reply', 'action_state', 'order_state'],
    properties: {
      actor_reply: { type: 'string' },
      action_state: { type: 'string', enum: ['asking', 'looking', 'confused', 'warning', 'confirming', 'making'] },
      order_state: {
        type: 'object',
        additionalProperties: false,
        required: ['item', 'options', 'modifiers', 'allergies', 'quantity', 'phase'],
        properties: {
          item: nullableEnum(sc.menu.map((m) => m.id)),
          options: {
            type: 'object',
            additionalProperties: false,
            required: groups,
            properties: Object.fromEntries(groups.map((g) => [g, nullableEnum(Object.keys(GROUPS[g].values))])),
          },
          modifiers: { type: 'array', items: { type: 'string', enum: allModifierIds(sc) } },
          allergies: { type: 'array', items: { type: 'string', enum: Object.keys(ALLERGENS) } },
          quantity: { type: 'integer' },
          phase: { type: 'string', enum: ['ordering', 'confirming', 'complete'] },
        },
      },
    },
  };
}

const COACH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['rating', 'notes', 'tip', 'politeness', 'clarity', 'recap', 'safety_asked'],
  properties: {
    rating: { type: 'string', enum: ['excellent', 'good', 'improve'] },
    notes: { type: 'array', items: { type: 'string' } },
    tip: { type: 'string' },
    politeness: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    clarity: { type: 'integer' },
    recap: { type: 'boolean' },
    safety_asked: { type: 'boolean' },
  },
};

function menuText(sc) {
  const lines = sc.menu.map((it) => {
    const opts = it.groups.map((g) => {
      const vals = it.values?.[g] || Object.keys(GROUPS[g].values);
      return `${g}${GROUPS[g].required ? '*' : ''}=[${vals.map((v) => `${v}${GROUPS[g].values[v].extra ? ` +${GROUPS[g].values[v].extra}` : ''}`).join(', ')}]`;
    }).join('; ');
    const rem = removableOf(sc, it).map((i) => `${i}${INGREDIENTS[i].allergen ? `(${INGREDIENTS[i].allergen})` : ''}`).join(', ');
    const fixed = (it.fixed || []).map((i) => `${i}${INGREDIENTS[i].allergen ? `(${INGREDIENTS[i].allergen})` : ''}`).join(', ');
    return `- ${it.id}: ${cardName(it, 'th')} / ${cardName(it, 'en')} — ${cardPrice(it)} บาท | ${opts}${it.defaults ? ` | default ${JSON.stringify(it.defaults)}` : ''} | เอาออกได้: ${rem || '-'} | เอาออกไม่ได้: ${fixed || '-'} | modifiers: ${applicableModifiers(sc, it).join(', ')}`;
  });
  const mods = sc.modifiers.map((id) => `- ${id}: ${MODIFIERS[id].th} / ${MODIFIERS[id].en}${MODIFIERS[id].extra ? ` +${MODIFIERS[id].extra}` : ''}${MODIFIERS[id].allergens ? ` (มี ${MODIFIERS[id].allergens.join(', ')})` : ''}`);
  return `${lines.join('\n')}\n\nคำขอพิเศษ/ของเพิ่ม:\n${mods.join('\n')}\n(* = ต้องได้ข้อมูลก่อนทวนออเดอร์, modifier "no_<ingredient>" = ไม่ใส่วัตถุดิบนั้น, ค่าอาหารทะเลของ protein: shrimp, squid, salmon, saba)`;
}

function actorSystem(sc) {
  return `คุณคือ "${sc.staff.th}" (${sc.staff.en}) ในระบบจำลองสถานการณ์เพื่อการเรียนรู้การสื่อสาร — สถานการณ์ ${sc.code}: ${sc.th}
จุดเน้นของสถานการณ์นี้: ${sc.focus.th}

เมนูและตัวเลือก:
${menuText(sc)}

บริบทอินพุต (Context Aggregator รวมมาให้แล้วใน current_turn):
- user_speech = พูด, user_text = พิมพ์, user_action (type=point) = ชี้/แตะเมนู (target_id อาจมีตัวเลือกนำหน้า เช่น iced_latte),
  user_selection = ตัวเลือกที่ติ๊กบนหน้าจอ { options: slot ที่เลือก, modifiers: ชุด checkbox ทั้งหมดที่ติ๊กไว้, allergies: การ์ด AAC แจ้งอาการแพ้ }
- หากผู้เรียนชี้เมนู ให้ถือว่าสนใจเมนูนั้นแม้ไม่ได้เอ่ยชื่อ; ถ้าสิ่งที่ชี้กับสิ่งที่พูดขัดกัน ให้ถามยืนยัน
- ถ้า environment noise_level = loud และผู้เรียนพูดอย่างเดียว คุณอาจได้ยินไม่ชัดบ้างตามความสมจริง

กฎการตอบสนอง:
1. สุภาพ กระชับ เป็นธรรมชาติเหมือนพนักงานจริง (1-3 ประโยค) ตอบเป็นภาษาตาม field "language" (th ใช้ "ครับ", en = English)
2. ถามทีละเรื่องเมื่อข้อมูลยังไม่ครบหรือกำกวม — ห้ามเดาหรือเลือกแทนผู้เรียน (ยกเว้นค่า default ของเมนู)
3. เมื่อข้อมูลครบ ให้ "ทวนออเดอร์" พร้อมยอดเงิน แล้วถามว่าถูกต้องไหม → phase = "confirming"
4. เมื่อ order_state.phase เดิมเป็น "confirming" และผู้เรียนยืนยัน (หรือทวนออเดอร์ถูกต้อง) → phase = "complete", action_state = "making",
   แจ้งยอดชำระและเวลาเตรียมอาหารโดยประมาณ ถ้าผู้เรียนขอแก้ ให้แก้แล้วทวนใหม่
5. ความปลอดภัยเรื่องอาการแพ้ (สำคัญที่สุด): ใส่อาการแพ้ที่ผู้เรียนแจ้งใน allergies; ถ้าเมนูมีวัตถุดิบที่แพ้และเอาออกได้ ให้เพิ่ม no_<ingredient> และบอกลูกค้า;
   ถ้าเอาออกไม่ได้ ให้ปฏิเสธอย่างสุภาพและแนะนำเมนูที่ปลอดภัย; ตอบคำถามเรื่องส่วนผสมตามข้อมูลเมนูเท่านั้น ห้ามแต่งเพิ่ม
6. order_state: ส่งสถานะล่าสุดทั้งหมด (คงค่าเดิมที่ไม่เปลี่ยน, option ที่ยังไม่รู้ = null) — action_state ใช้ warning เมื่อเตือนเรื่องอาการแพ้`;
}

function coachSystem(sc) {
  return `คุณคือ "โค้ช" เบื้องหลังที่ประเมินการสื่อสารของผู้เรียนในสถานการณ์ ${sc.code}: ${sc.th} (จุดเน้น: ${sc.focus.th})
ประเมินเฉพาะเทิร์นล่าสุด (current_turn) โดยดู order_state ก่อนหน้าและ dialogue_history ประกอบ เขียน notes/tip เป็นภาษาตาม field "language"
- rating: excellent (ชัดเจน/ใช้หลายช่องทางช่วยกันดี/แจ้งอาการแพ้หรือทวนออเดอร์ได้ดี), good (สำเร็จบางส่วน หรือชี้/เลือกอย่างเดียวแบบ AAC), improve (กำกวม ขัดแย้ง หรือเสี่ยงต่อความปลอดภัย)
- วิเคราะห์ประสิทธิภาพของช่องทางที่เลือกใช้ (ชี้อย่างเดียว vs พูดประกอบการชี้ vs ติ๊กตัวเลือก)
- learner_profile.allergies คืออาการแพ้จริงของผู้เรียน (พนักงานไม่รู้จนกว่าผู้เรียนจะบอก) ถ้าผู้เรียนสั่งของที่แพ้โดยยังไม่ได้แจ้ง ให้ rating = improve และเตือนใน tip
- notes: สิ่งที่สังเกตได้ 1-2 ข้อ, tip: คำแนะนำที่ดีกว่า 1 ข้อ
- politeness 0-100 (null ถ้าไม่ได้พูด/พิมพ์เลย), clarity 0-100
- recap = true เมื่อผู้เรียนทวนรายละเอียดออเดอร์ด้วยตัวเอง, safety_asked = true เมื่อถามส่วนผสม/ยืนยันความปลอดภัย`;
}

async function callJson(system, schema, content) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new Error('refusal');
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error(`no text output (stop_reason: ${response.stop_reason})`);
  return JSON.parse(text);
}

export async function processTurnLLM(payload) {
  const sc = getScenario(payload.scenario);
  const lang = payload.language === 'en' ? 'en' : 'th';
  const prev = normalizeOrder(payload.order_state);
  const { learner_profile, ...actorPayload } = payload; // พนักงานไม่รู้โปรไฟล์ผู้เรียน

  const [actor, coachOut] = await Promise.all([
    callJson(actorSystem(sc), actorSchema(sc), JSON.stringify(actorPayload)),
    callJson(coachSystem(sc), COACH_SCHEMA, JSON.stringify(payload)),
  ]);

  // ---- ตรวจสอบฝั่ง server ----
  const out = actor.order_state;
  const order = normalizeOrder({
    ...prev,
    options: Object.fromEntries(Object.entries(out.options || {}).filter(([, v]) => v)),
    modifiers: [...new Set(out.modifiers || [])].filter((m) => modifierDef(m)),
    allergies: [...new Set([...prev.allergies, ...(out.allergies || [])])],
    quantity: Math.min(10, Math.max(1, out.quantity || 1)),
    item: itemById(sc, out.item) ? out.item : null,
  });
  if (order.item) {
    setItem(sc, order, order.item);
    const ok = applicableModifiers(sc, itemById(sc, order.item));
    order.modifiers = order.modifiers.filter((m) => ok.includes(m));
  }

  let reply = actor.actor_reply;
  let actionState = actor.action_state;
  const guard = enforceSafety(sc, order, lang);
  if (guard.messages.length) {
    reply = `${guard.messages.join(' ')} ${reply}`;
    actionState = 'warning';
  }

  // ลำดับ: ต้องทวนออเดอร์ (confirming) ก่อนเสมอ จึงจะปิดออเดอร์ได้
  const missing = missingSlots(sc, order);
  let phase = out.phase;
  if (missing.length) phase = 'ordering';
  else if (phase === 'complete' && (prev.phase !== 'confirming' || guard.changed)) {
    phase = 'confirming';
    reply = `${reply} ${readbackLine(sc, order, lang)}`;
    actionState = 'confirming';
  }
  order.phase = phase;
  order.is_complete = phase === 'complete';
  if (order.is_complete) actionState = 'making';

  const declaredNow = order.allergies.filter((a) => !prev.allergies.includes(a));
  const { risky } = allergyRisk(sc, order, learner_profile);
  return {
    actor_reply: reply,
    action_state: actionState,
    order_state: order,
    total_price: totalPrice(sc, order),
    prep_minutes: order.is_complete ? prepMinutes(sc, order) : null,
    coach: {
      ...coachOut,
      rating: risky.length ? 'improve' : coachOut.rating,
      label: RATING_LABELS[lang][risky.length ? 'improve' : coachOut.rating],
      flags: { recap: coachOut.recap, allergy_declared: declaredNow, safety_asked: coachOut.safety_asked, risk: risky },
    },
    engine: `claude (${MODEL})`,
  };
}
