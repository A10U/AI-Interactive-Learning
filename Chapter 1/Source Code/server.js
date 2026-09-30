// Orchestrator Backend (Chapter 1): เสิร์ฟหน้าเว็บ + รับ Multimodal Payload แล้วส่งให้ engine (Offline หรือ Claude)
// รัน: node server.js  แล้วเปิด http://localhost:3000
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processTurn } from './src/actorEngine.js';
import { buildDebrief } from './src/debrief.js';
import { SCENARIO_LIST, GROUPS, ALLERGENS, INGREDIENTS } from './src/scenarios.js';
import { applicableModifiers, allModifierIds, modifierDef, cardName, cardPrice, removableOf } from './src/order.js';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

// โหลด Claude engine เฉพาะเมื่อมี API key และติดตั้ง SDK แล้ว (npm install)
let llm = null;
if (process.env.ANTHROPIC_API_KEY) {
  try {
    llm = await import('./src/llmEngine.js');
  } catch (err) {
    console.warn('⚠️  พบ ANTHROPIC_API_KEY แต่โหลด SDK ไม่ได้ (ลอง npm install) — ใช้ Offline engine แทน:', err.message);
  }
}

// ข้อมูลสำหรับหน้าเว็บ (ตัด keywords และฟังก์ชันออก)
function publicConfig() {
  const strip = ({ kw, short, ...v }) => v;
  return {
    engine: llm ? 'claude' : 'offline',
    groups: Object.fromEntries(Object.entries(GROUPS).map(([g, d]) => [g, {
      th: d.th, en: d.en, required: d.required,
      values: Object.fromEntries(Object.entries(d.values).map(([k, v]) => [k, strip(v)])),
    }])),
    allergens: Object.fromEntries(Object.entries(ALLERGENS).map(([k, { kw, ...v }]) => [k, v])),
    scenarios: SCENARIO_LIST.map((sc) => ({
      id: sc.id, code: sc.code, icon: sc.icon, th: sc.th, en: sc.en, staff: sc.staff, unit: sc.unit, decor: sc.decor,
      focus: sc.focus, opening: sc.opening, allergyPanel: !!sc.allergyPanel, missions: sc.missions,
      modifiers: Object.fromEntries(allModifierIds(sc).map((id) => {
        const { kw, applies, ...d } = modifierDef(id);
        return [id, d];
      })),
      menu: sc.menu.map((it) => ({
        id: it.id, emoji: it.emoji, kind: it.kind, groups: it.groups,
        th: cardName(it, 'th'), en: cardName(it, 'en'), price: cardPrice(it),
        values: Object.fromEntries(it.groups.map((g) => [g, it.values?.[g] || Object.keys(GROUPS[g].values)])),
        modifiers: applicableModifiers(sc, it),
        allergens: [...new Set([...removableOf(sc, it), ...(it.fixed || [])].map((i) => INGREDIENTS[i].allergen).filter(Boolean))],
      })),
    })),
  };
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error('payload too large');
  }
  return JSON.parse(raw || '{}');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/config') return send(res, 200, publicConfig());

    if (req.method === 'POST' && url.pathname === '/api/turn') {
      const payload = await readJson(req);
      console.log(`[turn] ${payload.scenario} ${payload.session_id} ${JSON.stringify(payload.current_turn)}`);
      let result;
      if (llm && payload.use_llm !== false) {
        try {
          result = await llm.processTurnLLM(payload);
        } catch (err) {
          console.warn('⚠️  Claude engine error — fallback to offline:', err.message);
          result = { ...processTurn(payload), engine: 'offline (fallback)' };
        }
      } else {
        result = processTurn(payload);
      }
      return send(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/debrief') {
      return send(res, 200, buildDebrief(await readJson(req)));
    }

    if (req.method === 'GET') {
      const path = normalize(join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname));
      if (!path.startsWith(PUBLIC)) return send(res, 403, 'forbidden', 'text/plain');
      try {
        return send(res, 200, await readFile(path), TYPES[extname(path)] || 'application/octet-stream');
      } catch {
        return send(res, 404, 'not found', 'text/plain');
      }
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (err) {
    console.error(err);
    send(res, 400, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log('\n🍽️  AI Interactive Learning — Chapter 1: การสั่งอาหารทั่วไป');
  console.log(`   เปิดเบราว์เซอร์ (Chrome/Edge): http://localhost:${PORT}`);
  console.log(`   Engine: ${llm ? `Claude (${process.env.CLAUDE_MODEL || 'claude-opus-5'})` : 'Offline rule-based (ไม่ต้องใช้ API key)'}\n`);
});
