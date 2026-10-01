// โหมด static (เช่น GitHub Pages): ไม่มีเซิร์ฟเวอร์ Node → จำลอง /api/* ในเบราว์เซอร์ด้วย Offline engine
// app.js จะโหลดไฟล์นี้เฉพาะเมื่อเรียก /api/config ไม่สำเร็จ (ตอนรัน node server.js จะไม่ถูกใช้)
// ไฟล์ใน src/ ถูกก๊อปมาไว้ข้าง ๆ ตอน build (ดู .github/workflows/pages.yml)
import { processTurn } from './src/ruleEngine.js';
import { buildDebrief } from './src/debrief.js';
import { startCustomer, customerTurn, buildStaffDebrief } from './src/customerEngine.js';
import { buildAssist } from './src/assistEngine.js';
import { publicConfig } from './src/publicConfig.js';

const ROUTES = {
  'GET /api/config': () => publicConfig('offline'),
  'POST /api/turn': (body) => processTurn(body),
  'POST /api/debrief': (body) => (body.mode === 'staff' ? buildStaffDebrief(body) : buildDebrief(body)),
  'POST /api/assist': (body) => buildAssist(body),
  'POST /api/customer/start': (body) => startCustomer(body),
  'POST /api/customer/turn': (body) => customerTurn(body),
};

export function installStaticApi() {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    const handler = ROUTES[`${(init.method || 'GET').toUpperCase()} ${url.pathname}`];
    if (!url.pathname.startsWith('/api/') || !handler) return realFetch(input, init);
    try {
      const result = await handler(init.body ? JSON.parse(init.body) : {});
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  };
}
