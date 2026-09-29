# ☕ AI Café — AI Interactive Learning (ต้นแบบ)

ฝึกสื่อสารในชีวิตประจำวันผ่านสถานการณ์ **สั่งเครื่องดื่มในร้านกาแฟ** กับบาริสต้า AI
รองรับ **ภาษาไทย / English** และสื่อสารได้ 3 ช่องทาง (Multimodal): **พูด 🎤 · พิมพ์ ⌨️ · ชี้เมนู 👉**
สร้างตามเอกสารใน `../Documents` (แผนงาน + System Prompt/JSON Schema)

## วิธีเล่น (เร็วที่สุด)

1. ดับเบิลคลิก **`start.bat`**, หรือเปิด terminal ในโฟลเดอร์นี้แล้วรัน `node server.js`
2. เปิด **http://localhost:3000** ด้วย Chrome หรือ Edge (ปุ่มไมค์ใช้ได้เฉพาะเบราว์เซอร์ที่รองรับ Web Speech API)
3. สั่งเครื่องดื่มได้เลย เช่น
   - แตะ **ลาเต้ → เย็น** แล้วพูดว่า *"หวานน้อยแก้วหนึ่งครับ"*
   - พิมพ์ *"แพ้นมวัว ใช้นมโอ๊ตแทนได้ไหม"*
   - *"Could I get two large iced lattes, less sweet please?"*

ไม่ต้องติดตั้งอะไรเพิ่มและไม่ต้องมี API key (ใช้ Offline engine แบบ rule-based)

### ตัวเลือกบนหน้าจอ
| ตัวเลือก | ทำอะไร |
|---|---|
| ไทย / English | ภาษาที่ใช้ฝึก (บาริสต้า, โค้ช, ไมค์, เสียงพูด) |
| โหมด อิสระ / ภารกิจ | โหมดภารกิจจะสุ่มโจทย์ให้สั่งให้ตรง แล้วคิดคะแนน Goal Completion |
| เสียงในร้าน | ถ้าเลือก "ดังมาก" บาริสต้าอาจฟังไม่ชัดเมื่อพูดอย่างเดียว ให้ลองชี้หรือพิมพ์ช่วย |
| ดู JSON payload | ดูข้อมูลที่ Context Aggregator รวมจาก คำพูด + ข้อความ + การชี้ ก่อนส่งเข้า AI |

## ใช้ Claude เป็นสมองของบาริสต้า (ไม่บังคับ)

```bash
npm install
set ANTHROPIC_API_KEY=sk-ant-...      # PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
node server.js
```
ตั้ง key ได้ 3 ทาง: environment variable ข้างบน · ไฟล์ **`.env`** ในโฟลเดอร์นี้ (`ANTHROPIC_API_KEY=sk-ant-...` — ถูก git ignore แล้ว) · หรือกดปุ่ม **🔑** บนหน้าเว็บ (เฉพาะเปิดจาก localhost, เก็บใน memory ไม่บันทึกลงไฟล์)

ค่าเริ่มต้นใช้โมเดล `claude-opus-5` (เปลี่ยนได้ด้วย `CLAUDE_MODEL`) ถ้าเรียก API ไม่สำเร็จ ระบบจะใช้ Offline engine แทนโดยอัตโนมัติ

## โครงสร้างโปรเจกต์

```
server.js            Orchestrator Backend (Node.js, ไม่มี dependency) — /api/config, /api/turn, /api/debrief
src/menu.js          Domain Ontology: เมนู ราคา ตัวเลือก ภารกิจ
src/nlu.js           ตัวแยกความหมายภาษาไทย/อังกฤษ (Offline)
src/ruleEngine.js    Barista Persona + Coach Evaluator แบบ rule-based (Slot Filling State Machine)
src/llmEngine.js     Barista + Coach ด้วย Claude (Structured Output / JSON Schema)
src/debrief.js       สรุปผลหลังจบสถานการณ์: Goal Completion, Efficiency, Politeness, Clarity
public/              หน้าเว็บ: เคาน์เตอร์ร้าน, ป้ายเมนูแตะได้, ไมค์ (STT), เสียงบาริสต้า (TTS)
test/                ทดสอบสถานการณ์ตามตารางในเอกสาร — รัน `npm test`
```

## ตรงกับแผนงานในเอกสารแค่ไหน

- ✅ เฟส 1: Ontology ร้านกาแฟ, State Machine (Slot Filling), แยก Barista / Coach
- ✅ เฟส 2: UI เคาน์เตอร์ + Interactive Menu Board, STT/TTS (Web Speech API), รวม Event ชี้ + เสียง
- ✅ เฟส 3: คะแนนรายเทิร์น + หน้าสรุปผล, ระดับความยาก (เสียงรบกวน), โหมดภารกิจ
- ⏳ ยังไม่ทำ: ฐานข้อมูลเก็บประวัติผู้เรียน (PostgreSQL), สถานการณ์อื่น (ร้านสะดวกซื้อ, รถไฟฟ้า, โรงพยาบาล)
  และเทคโนโลยีตามแผน (Next.js/Tailwind, FastAPI) — ต้นแบบนี้ใช้ Node.js + HTML ล้วน เพื่อให้เปิดเล่นได้ทันที
