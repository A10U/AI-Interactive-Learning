// LLM engine (ตัวเลือก): ใช้ Claude สวมบทบาทบาริสต้า + โค้ช พร้อม Structured Output (JSON Schema)
// เปิดใช้เมื่อมี ANTHROPIC_API_KEY — ถ้าเรียกไม่สำเร็จ server จะถอยกลับไปใช้ offline engine
import Anthropic from '@anthropic-ai/sdk';
import { MENU, TEMPS, SWEETNESS, SIZES, MILKS, emptyOrder, missingSlots, totalPrice } from './menu.js';

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5';
let client = null;
const getClient = () => (client ??= new Anthropic());

// ตั้ง/ล้าง API key ระหว่างรัน (ใช้จากหน้าตั้งค่า) — ตรวจว่า key ใช้ได้ก่อนเก็บ ถ้าไม่ผ่านจะ throw
export async function setApiKey(key) {
  if (!key) { client = null; return; }
  const candidate = new Anthropic({ apiKey: key });
  await candidate.models.list({ limit: 1 });
  client = candidate;
}

const nullableEnum = (values) => ({ anyOf: [{ type: 'string', enum: values }, { type: 'null' }] });

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['barista_reply', 'action_state', 'order_state', 'coach'],
  properties: {
    barista_reply: { type: 'string' },
    action_state: { type: 'string', enum: ['asking', 'looking', 'confused', 'making'] },
    order_state: {
      type: 'object',
      additionalProperties: false,
      required: ['item', 'temperature', 'sweetness', 'size', 'milk', 'allergy', 'quantity'],
      properties: {
        item: nullableEnum(MENU.map((m) => m.id)),
        temperature: nullableEnum(Object.keys(TEMPS)),
        sweetness: nullableEnum(Object.keys(SWEETNESS)),
        size: nullableEnum(Object.keys(SIZES)),
        milk: nullableEnum(Object.keys(MILKS)),
        allergy: { type: 'boolean' },
        quantity: { type: 'integer' },
      },
    },
    coach: {
      type: 'object',
      additionalProperties: false,
      required: ['rating', 'notes', 'tip', 'politeness', 'clarity'],
      properties: {
        rating: { type: 'string', enum: ['excellent', 'good', 'improve'] },
        notes: { type: 'array', items: { type: 'string' } },
        tip: { type: 'string' },
        politeness: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
        clarity: { type: 'integer' },
      },
    },
  },
};

const menuText = MENU.map((m) =>
  `- ${m.id}: ${m.th} / ${m.en} — ${m.price} บาท (ร้อน), รองรับ: ${m.temps.join(', ')}`).join('\n');

const SYSTEM = `คุณคือ "บาริสต้าประจำร้านกาแฟ" ในระบบจำลองสถานการณ์เพื่อการเรียนรู้การสื่อสาร (Cafe Ordering Simulation)
และในอีกบทบาทหนึ่งคุณคือ "โค้ช" เบื้องหลังที่ประเมินการสื่อสารของผู้เรียนในแต่ละเทิร์น

เมนูของร้าน (id: ชื่อ — ราคาเริ่มต้น):
${menuText}
ตัวเลือกบวกราคา: เย็น +${TEMPS.iced.extra}, ปั่น +${TEMPS.frappe.extra}, ไซส์ใหญ่ +${SIZES.large.extra}, นมโอ๊ต +${MILKS.oat.extra}, นมถั่วเหลือง +${MILKS.soy.extra}
ความหวาน: none (ไม่หวาน), less (หวานน้อย), normal (หวานปกติ), extra (หวานมาก). ไซส์: regular (16oz), large (22oz)

บทบาทบาริสต้า:
1. บริบทอินพุต: ผู้เรียนอาจพูด (user_speech), พิมพ์ (user_text) หรือชี้ที่ป้ายเมนู (user_action type=point)
   - หากผู้เรียนชี้เมนู ให้ถือว่าสนใจเมนูนั้นแม้ไม่ได้เอ่ยชื่อ (target_id อาจมีอุณหภูมินำหน้า เช่น iced_latte)
   - หากสิ่งที่ชี้กับสิ่งที่พูดขัดกัน ให้ถามยืนยันอย่างสุภาพ
   - หาก environment noise_level เป็น loud และผู้เรียนพูดอย่างเดียว คุณอาจได้ยินไม่ชัดบ้างตามความสมจริง
2. กฎการตอบสนอง: สุภาพ กระชับ เป็นมิตร เหมือนบาริสต้าตัวจริง (1-2 ประโยค)
   - ข้อมูลที่ต้องครบ: item, temperature, sweetness, size (และ milk ถ้าลูกค้าแพ้นมและเมนูมีนม)
   - หากข้อมูลไม่ครบหรือกำกวม (เช่น บอกแค่ "กาแฟ") ให้ถามเจาะจงทีละเรื่องอย่างสุภาพ
   - ห้ามเฉลยหรือเดาแทนผู้เรียน ให้ผู้เรียนได้คิดและตอบเอง
   - เมื่อข้อมูลครบ ให้สรุปออเดอร์และยอดเงิน แล้วตั้ง action_state = "making"
3. ภาษาที่ใช้ตอบ: ถ้า payload มี "conversation_language" เป็นรหัสภาษา (BCP-47/ISO 639-1 เช่น ja-JP, sw) ให้ตอบเป็นภาษานั้น (ค่า "auto" = ตามภาษาผู้เรียน)
   ถ้าเป็น null หรือ "auto" ให้ตอบตามภาษาที่ผู้เรียนพิมพ์/พูดล่าสุด หากไม่ชัดเจนให้ใช้ "language" (th = ไทย ใช้ "ครับ", en = English)
   ผู้เรียนอาจพูดหลายภาษา เมนูอาจถูกเรียกด้วยชื่อท้องถิ่น — ให้แมปเป็น id ในเมนูให้ถูกต้อง ค่า enum ใน order_state ต้องเป็นรหัสภาษาอังกฤษเสมอ
4. order_state: ส่งสถานะออเดอร์ล่าสุดทั้งหมด (คงค่าเดิมที่ยังไม่เปลี่ยน)

บทบาทโค้ช (coach) — เขียนเป็นภาษาเดียวกับ language (ภาษาของหน้าจอ ไม่ใช่ภาษาสนทนา):
- rating: excellent (ชัดเจน/ใช้หลายช่องทางช่วยกันดี/บอกเงื่อนไขเฉพาะตัวชัด), good (สื่อสารสำเร็จบางส่วน หรือชี้อย่างเดียวแบบ AAC), improve (กำกวม ต้องถามซ้ำ)
- notes: สิ่งที่สังเกตได้ 1-2 ข้อ, tip: คำแนะนำที่ดีกว่า 1 ข้อ
- politeness 0-100 (null ถ้าไม่ได้พูด/พิมพ์เลย), clarity 0-100`;

export async function processTurnLLM(payload) {
  const lang = payload.language === 'en' ? 'en' : 'th';
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
  });
  if (response.stop_reason === 'refusal') throw new Error('refusal');
  const text = response.content.find((b) => b.type === 'text')?.text;
  const out = JSON.parse(text);

  // ตรวจสอบฝั่ง server: ความครบของสล็อตและราคาคำนวณเอง ไม่พึ่งตัวเลขจาก LLM
  const order = { ...emptyOrder(), ...out.order_state };
  order.quantity = Math.min(10, Math.max(1, order.quantity || 1));
  order.is_complete = missingSlots(order).length === 0;
  const labels = { th: { excellent: 'ดีเยี่ยม', good: 'ดี', improve: 'ต้องปรับปรุง' }, en: { excellent: 'Excellent', good: 'Good', improve: 'Needs work' } };
  return {
    barista_reply: out.barista_reply,
    action_state: order.is_complete ? 'making' : out.action_state,
    order_state: order,
    total_price: totalPrice(order),
    coach: { ...out.coach, label: labels[lang][out.coach.rating] },
    engine: `claude (${MODEL})`,
  };
}
