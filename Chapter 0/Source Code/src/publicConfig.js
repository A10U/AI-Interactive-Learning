// ข้อมูลตั้งต้นสำหรับหน้าเว็บ (/api/config) — ใช้ร่วมกันระหว่าง server.js และโหมด static (GitHub Pages)
// ไฟล์นี้ต้องไม่ import อะไรที่ใช้ได้เฉพาะ Node เพราะถูกโหลดในเบราว์เซอร์ด้วย
import { MENU, TEMPS, SWEETNESS, SIZES, MILKS, MISSIONS } from './menu.js';
import { openingLine } from './ruleEngine.js';

export function publicConfig(engine = 'offline', canSetKey = false) {
  return {
    engine,
    can_set_key: canSetKey,
    menu: MENU.map(({ keywords, ...m }) => m),
    temps: TEMPS, sweetness: SWEETNESS, sizes: SIZES, milks: MILKS, missions: MISSIONS,
    opening: { th: openingLine('th'), en: openingLine('en') },
  };
}
