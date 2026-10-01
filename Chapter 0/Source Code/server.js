// Orchestrator Backend: เสิร์ฟหน้าเว็บ + รับ Multimodal Payload แล้วส่งให้ engine (Offline หรือ Claude)
// + โหมดสลับบทบาท (ผู้เรียนเป็นพนักงาน, AI เป็นลูกค้า): /api/customer/start, /api/customer/turn
// + ตัวช่วย (Assist Bot) เมื่อผู้เรียนติด: /api/assist
// รัน: node server.js  แล้วเปิด http://localhost:3000
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processTurn } from './src/ruleEngine.js';
import { buildDebrief } from './src/debrief.js';
import { startCustomer, customerTurn, buildStaffDebrief } from './src/customerEngine.js';
import { buildAssist } from './src/assistEngine.js';
import { publicConfig } from './src/publicConfig.js';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

// อ่านไฟล์ .env (KEY=VALUE ต่อบรรทัด) โดยไม่ทับค่าที่ตั้งไว้ใน environment แล้ว
try {
  for (const line of (await readFile(new URL('./.env', import.meta.url), 'utf8')).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !line.trim().startsWith('#')) process.env[m[1]] ??= m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch { /* ไม่มี .env ก็ไม่เป็นไร */ }

// โหลด Claude engine เฉพาะเมื่อมี API key และติดตั้ง SDK แล้ว (npm install)
// llm != null แปลว่าใช้โหมด Claude ได้ (key มาจาก env/.env หรือกรอกผ่านหน้าตั้งค่า)
let llm = null;
let llmModule = null;
try {
  const mod = await import('./src/llmEngine.js');
  llmModule = mod;
  if (process.env.ANTHROPIC_API_KEY) llm = mod;
  
} catch (err) {
  if (process.env.ANTHROPIC_API_KEY) console.warn('⚠️  พบ ANTHROPIC_API_KEY แต่โหลด SDK ไม่ได้ (ลอง npm install) — ใช้ Offline engine แทน:', err.message);
}

const isLocal = (req) => {
  const ip = req.socket.remoteAddress || '';
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) && ['localhost', '127.0.0.1', '[::1]'].includes(host);
};

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

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return send(res, 200, publicConfig(llm ? 'claude' : 'offline', !!llmModule && isLocal(req)));
    }

    // ตั้ง/ล้าง API key จากหน้าเว็บ: เฉพาะเครื่องนี้ (localhost) และเก็บใน memory เท่านั้น ไม่เขียนลงดิสก์
    if (url.pathname === '/api/key' && (req.method === 'POST' || req.method === 'DELETE')) {
      if (!llmModule) return send(res, 503, { error: 'ยังไม่ได้ติดตั้ง SDK (รัน npm install)' });
      if (!isLocal(req)) return send(res, 403, { error: 'ตั้งค่า key ได้เฉพาะจาก localhost' });
      if (req.method === 'DELETE') {
        await llmModule.setApiKey(null);
        delete process.env.ANTHROPIC_API_KEY;
        llm = null;
        return send(res, 200, { engine: 'offline' });
      }
      const { key } = await readJson(req);
      if (typeof key !== 'string' || !key.trim()) return send(res, 400, { error: 'กรุณากรอก API key' });
      try {
        await llmModule.setApiKey(key.trim());
      } catch (err) {
        return send(res, 400, { error: `API key ใช้ไม่ได้: ${err.status === 401 ? 'ไม่ถูกต้อง' : err.message}` });
      }
      process.env.ANTHROPIC_API_KEY = key.trim();
      llm = llmModule;
      return send(res, 200, { engine: 'claude' });
    }

    if (req.method === 'POST' && url.pathname === '/api/turn') {
      const payload = await readJson(req);
      console.log(`[turn] ${payload.session_id} ${JSON.stringify(payload.current_turn)}`);
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
      const body = await readJson(req);
      return send(res, 200, body.mode === 'staff' ? buildStaffDebrief(body) : buildDebrief(body));
    }

    // ตัวช่วย (Assist Bot): บอกสถานการณ์ + คำศัพท์ + ประโยคตัวอย่าง — Offline เสมอ
    if (req.method === 'POST' && url.pathname === '/api/assist') {
      return send(res, 200, buildAssist(await readJson(req)));
    }

    // โหมดสลับบทบาท: ลูกค้า AI (Offline engine เสมอ)
    if (req.method === 'POST' && url.pathname === '/api/customer/start') {
      return send(res, 200, startCustomer(await readJson(req)));
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/turn') {
      const payload = await readJson(req);
      console.log(`[staff] ${payload.session_id} ${JSON.stringify(payload.current_turn)}`);
      return send(res, 200, customerTurn(payload));
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
  console.log(`\n☕  AI Café — Interactive Learning`);
  console.log(`   เปิดเบราว์เซอร์ (Chrome/Edge): http://localhost:${PORT}`);
  console.log(`   Engine: ${llm ? 'Claude (' + (process.env.CLAUDE_MODEL || 'claude-opus-5') + ')' : 'Offline rule-based (ไม่ต้องใช้ API key)'}\n`);
});
