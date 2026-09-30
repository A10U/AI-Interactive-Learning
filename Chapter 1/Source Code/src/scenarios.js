// Domain Ontology ของ Chapter 1: การสั่งอาหารทั่วไป (General Food Ordering)
// 3 สถานการณ์ตามเอกสาร Master Plan หัวข้อ 3.1 — คาเฟ่ / ร้านอาหารตามสั่ง / ร้านอาหารที่มีข้อจำกัดด้านสุขภาพ
// ทุกค่ารองรับ 2 ภาษา (th / en) และมี keywords (kw) ให้ตัวแยกความหมายแบบ Offline ใช้

// ---------------------------------------------------------------- สารก่อภูมิแพ้
export const ALLERGENS = {
  peanut:  { th: 'ถั่วลิสง',  en: 'peanuts', icon: '🥜', kw: ['ถั่วลิสง', 'ถั่ว', 'peanut', 'nut'] },
  seafood: { th: 'อาหารทะเล', en: 'seafood', icon: '🦐', kw: ['อาหารทะเล', 'ซีฟู้ด', 'ทะเล', 'ปลา', 'หอย', 'ปู', 'seafood', 'shellfish', 'fish'] },
  dairy:   { th: 'นมวัว',     en: 'dairy',   icon: '🥛', kw: ['นมวัว', 'นม', 'แลคโตส', 'dairy', 'milk', 'lactose'] },
  egg:     { th: 'ไข่',       en: 'eggs',    icon: '🥚', kw: ['ไข่', 'egg'] },
  gluten:  { th: 'กลูเตน',    en: 'gluten',  icon: '🌾', kw: ['กลูเตน', 'แป้งสาลี', 'gluten', 'wheat'] },
};

// ---------------------------------------------------------------- วัตถุดิบ (ใช้กับคำสั่ง "ไม่ใส่..." และการตรวจสารก่อภูมิแพ้)
export const INGREDIENTS = {
  peanut:        { th: 'ถั่วลิสง',        en: 'peanuts',         allergen: 'peanut',  kw: ['ถั่วลิสง', 'ถั่วคั่ว', 'peanut'] },
  dried_shrimp:  { th: 'กุ้งแห้ง',        en: 'dried shrimp',    allergen: 'seafood', kw: ['กุ้งแห้ง', 'dried shrimp'] },
  oyster_sauce:  { th: 'ซอสหอยนางรม',    en: 'oyster sauce',    allergen: 'seafood', kw: ['ซอสหอยนางรม', 'ซอสหอย', 'หอยนางรม', 'oyster sauce'] },
  shrimp_meat:   { th: 'กุ้ง',            en: 'shrimp',          allergen: 'seafood', kw: [] },
  egg:           { th: 'ไข่',             en: 'egg',             allergen: 'egg',     kw: ['ไข่', 'egg'] },
  soybean_sauce: { th: 'น้ำจิ้มเต้าเจี้ยว', en: 'soybean sauce',   allergen: 'gluten',  kw: ['น้ำจิ้มเต้าเจี้ยว', 'เต้าเจี้ยว', 'soybean sauce', 'soybean paste'] },
  long_bean:     { th: 'ถั่วฝักยาว',      en: 'long beans',      kw: ['ถั่วฝักยาว', 'long bean', 'green bean'] },
  bean_sprout:   { th: 'ถั่วงอก',         en: 'bean sprouts',    kw: ['ถั่วงอก', 'bean sprout'] },
  spring_onion:  { th: 'ต้นหอม',          en: 'spring onion',    kw: ['ต้นหอม', 'spring onion', 'green onion', 'scallion'] },
  coriander:     { th: 'ผักชี',           en: 'coriander',       kw: ['ผักชี', 'coriander', 'cilantro'] },
  onion:         { th: 'หอมใหญ่',         en: 'onion',           kw: ['หอมใหญ่', 'หัวหอม', 'onion'] },
  garlic:        { th: 'กระเทียม',        en: 'garlic',          kw: ['กระเทียมเจียว', 'กระเทียม', 'garlic'] },
  msg:           { th: 'ผงชูรส',          en: 'MSG',             kw: ['ผงชูรส', 'msg'] },
};

// ---------------------------------------------------------------- ตัวเลือกแบบเลือกได้ 1 ค่า (Slot)
// required = ต้องได้ข้อมูลก่อนทวนออเดอร์, partial = ยังต้องถามรายละเอียดเพิ่ม (refine),
// short = คำตอบสั้นๆ ที่ตีความได้เฉพาะตอนพนักงานกำลังถามเรื่องนั้นอยู่
export const GROUPS = {
  temperature: { th: 'ร้อน/เย็น/ปั่น', en: 'Hot/iced/frappé', required: true, values: {
    hot:    { th: 'ร้อน', en: 'hot',    extra: 0,  kw: ['ร้อน', 'อุ่น', 'hot', 'warm'] },
    iced:   { th: 'เย็น', en: 'iced',   extra: 5,  kw: ['เย็น', 'ไอซ์', 'iced', 'ice', 'cold'] },
    frappe: { th: 'ปั่น', en: 'frappé', extra: 10, kw: ['ปั่น', 'frappe', 'frappé', 'blended', 'smoothie'] },
  } },
  milk: { th: 'นม', en: 'Milk', required: true, values: {
    dairy: { th: 'นมวัว',        en: 'dairy milk', extra: 0,  allergen: 'dairy',
      kw: ['นมวัว', 'นมสด', 'นมจืด', 'dairy milk', 'whole milk', 'fresh milk', 'cow milk', 'regular milk'], short: ['ปกติ', 'ธรรมดา', 'normal', 'regular', 'dairy'] },
    oat:   { th: 'นมโอ๊ต',       en: 'oat milk',   extra: 15, kw: ['นมโอ๊ต', 'นมโอ๊ท', 'นมโอต', 'โอ๊ต', 'โอ๊ท', 'oat milk', 'oat'] },
    soy:   { th: 'นมถั่วเหลือง', en: 'soy milk',   extra: 10, kw: ['นมถั่วเหลือง', 'ถั่วเหลือง', 'โซย่า', 'soy milk', 'soya', 'soy'] },
  } },
  sweetness: { th: 'ความหวาน', en: 'Sweetness', required: true, values: {
    none:   { th: 'ไม่หวาน',  en: 'no sugar', extra: 0,
      kw: ['ไม่หวาน', 'หวาน 0', 'หวาน0', 'หวานศูนย์', 'ไม่ใส่น้ำตาล', 'no sugar', 'unsweetened', 'sugar free', 'sugar-free', 'without sugar', 'not sweet'], short: ['ศูนย์', 'no', 'none', 'zero'] },
    less:   { th: 'หวานน้อย', en: 'less sweet', extra: 0,
      kw: ['หวานน้อย', 'หวาน 25', 'หวาน 50', 'หวานครึ่ง', 'หวานนิด', 'less sweet', 'less sugar', 'half sweet', 'half sugar', 'little sugar', 'slightly sweet'], short: ['น้อย', 'นิดเดียว', 'ครึ่ง', 'less', 'half', 'a little'] },
    normal: { th: 'หวานปกติ', en: 'normal sweetness', extra: 0,
      kw: ['หวานปกติ', 'หวานกลาง', 'หวาน 100', 'หวานธรรมดา', 'normal sweet', 'regular sweet', 'normal sugar', 'regular sugar'], short: ['ปกติ', 'ธรรมดา', 'กลาง', 'หวาน', 'normal', 'regular', 'standard', 'sweet'] },
    extra:  { th: 'หวานมาก',  en: 'extra sweet', extra: 0,
      kw: ['หวานมาก', 'หวานๆ', 'หวาน ๆ', 'หวานเพิ่ม', 'หวานจัด', 'extra sweet', 'extra sugar', 'more sugar', 'very sweet', 'sweeter'], short: ['มาก', 'เยอะ', 'extra', 'more', 'very'] },
  } },
  size: { th: 'ไซส์', en: 'Size', required: true, values: {
    regular: { th: 'ไซส์ปกติ', en: 'regular size', extra: 0,
      kw: ['ไซส์ปกติ', 'ขนาดปกติ', 'แก้วปกติ', 'ไซส์กลาง', 'ไซส์เล็ก', 'แก้วเล็ก', 'ไซส์ m', 'size m', '16 ออนซ์', '16 oz', 'regular size', 'normal size', 'medium', 'small', 'tall'],
      short: ['ปกติ', 'ธรรมดา', 'กลาง', 'เล็ก', 'm', 'regular', 'normal'] },
    large:   { th: 'ไซส์ใหญ่', en: 'large size', extra: 10,
      kw: ['ไซส์ใหญ่', 'แก้วใหญ่', 'ขนาดใหญ่', 'ใหญ่', 'ไซส์แอล', 'ไซส์ l', 'size l', '22 ออนซ์', '22 oz', 'large', 'big', 'grande', 'venti'], short: ['l'] },
  } },
  protein: { th: 'เนื้อสัตว์', en: 'Protein', required: true, values: {
    minced_pork: { th: 'หมูสับ',      en: 'minced pork',  extra: 0,  kw: ['หมูสับ', 'หมูบด', 'หมู', 'minced pork', 'ground pork', 'pork'] },
    crispy_pork: { th: 'หมูกรอบ',     en: 'crispy pork',  extra: 15, kw: ['หมูกรอบ', 'crispy pork', 'pork belly'] },
    chicken:     { th: 'ไก่',          en: 'chicken',      extra: 0,  kw: ['อกไก่', 'ไก่', 'chicken'] },
    shrimp:      { th: 'กุ้ง',         en: 'shrimp',       extra: 20, allergen: 'seafood', kw: ['กุ้งสด', 'กุ้ง', 'shrimp', 'prawn'] },
    squid:       { th: 'ปลาหมึก',      en: 'squid',        extra: 15, allergen: 'seafood', kw: ['ปลาหมึก', 'หมึก', 'squid', 'calamari'] },
    salmon:      { th: 'แซลมอน',       en: 'salmon',       extra: 60, allergen: 'seafood', kw: ['ปลาแซลมอน', 'แซลมอน', 'salmon'] },
    saba:        { th: 'ปลาซาบะย่าง',  en: 'grilled saba', extra: 40, allergen: 'seafood', kw: ['ปลาซาบะย่าง', 'ปลาซาบะ', 'ซาบะ', 'saba', 'mackerel'] },
    tofu:        { th: 'เต้าหู้',       en: 'tofu',         extra: 0,  kw: ['เต้าหู้', 'tofu'] },
  } },
  spice: { th: 'ความเผ็ด', en: 'Spice level', required: true, values: {
    none:   { th: 'ไม่เผ็ด',  en: 'not spicy', extra: 0,
      kw: ['ไม่เผ็ด', 'ไม่ใส่พริก', 'ไม่เอาพริก', 'ไม่เอาเผ็ด', 'not spicy', 'no chili', 'no chilli', 'no spice', 'non-spicy', 'non spicy'], short: ['none', 'ไม่เลย', 'not at all'] },
    mild:   { th: 'เผ็ดน้อย', en: 'mild', extra: 0,
      kw: ['เผ็ดน้อย', 'เผ็ดนิดหน่อย', 'เผ็ดนิดนึง', 'เผ็ดนิดเดียว', 'เผ็ดนิด', 'พริกน้อย', 'a little spicy', 'a bit spicy', 'slightly spicy', 'mildly spicy', 'less spicy', 'mild'],
      short: ['น้อย', 'นิดหน่อย', 'นิดเดียว', 'a little', 'a bit', 'little'] },
    medium: { th: 'เผ็ดกลาง', en: 'medium spicy', extra: 0,
      kw: ['เผ็ดกลาง', 'เผ็ดปกติ', 'เผ็ดธรรมดา', 'พริกปกติ', 'medium spicy', 'normal spicy', 'regular spicy'], short: ['กลาง', 'ปกติ', 'ธรรมดา', 'เผ็ด', 'medium', 'normal', 'regular', 'spicy'] },
    hot:    { th: 'เผ็ดมาก',  en: 'very spicy', extra: 0,
      kw: ['เผ็ดมาก', 'เผ็ดๆ', 'เผ็ด ๆ', 'เผ็ดจัด', 'เผ็ดสุด', 'very spicy', 'extra spicy', 'really spicy', 'super spicy'], short: ['มาก', 'เยอะ', 'จัด', 'very', 'extra'] },
  } },
  egg: { th: 'ไข่', en: 'Egg', required: false, values: {
    fried:       { th: 'ไข่ดาว',        en: 'fried egg', extra: 10, allergen: 'egg', partial: true, refine: ['fried_well', 'fried_runny'],
      kw: ['ไข่ดาว', 'fried egg'] },
    fried_well:  { th: 'ไข่ดาวสุก',     en: 'fried egg (well done)', extra: 10, allergen: 'egg',
      kw: ['ไข่ดาวสุกๆ', 'ไข่ดาวสุก ๆ', 'ไข่ดาวสุก', 'ไข่ดาวไม่เยิ้ม', 'well-done fried egg', 'well done fried egg', 'fried egg well done', 'fried egg, well done', 'well-done egg', 'well done egg'],
      short: ['สุกๆ', 'สุก ๆ', 'สุก', 'well done', 'well-done', 'cooked through', 'fully cooked', 'hard'] },
    fried_runny: { th: 'ไข่ดาวไม่สุก',  en: 'fried egg (runny)', extra: 10, allergen: 'egg',
      kw: ['ไข่ดาวไม่สุก', 'ไข่ดาวยางมะตูม', 'ไข่ดาวเยิ้ม', 'runny fried egg', 'fried egg runny', 'fried egg, runny', 'runny egg', 'sunny side up', 'sunny-side up'],
      short: ['ไม่สุก', 'ยางมะตูม', 'เยิ้ม', 'runny', 'soft'] },
    omelette:    { th: 'ไข่เจียว',      en: 'omelette', extra: 15, allergen: 'egg', kw: ['ไข่เจียว', 'omelette', 'omelet'] },
  } },
  portion: { th: 'ขนาดจาน', en: 'Portion', required: false, default: 'regular', values: {
    regular: { th: 'ธรรมดา', en: 'regular portion', extra: 0,  kw: ['จานธรรมดา', 'regular portion', 'normal portion', 'standard portion'] },
    large:   { th: 'พิเศษ',  en: 'large portion',   extra: 10,
      kw: ['จานพิเศษ', 'จานใหญ่', 'large portion', 'big portion', 'extra portion', 'large plate', { w: 'พิเศษ', standalone: true }, { w: 'large', standalone: true }] },
  } },
};

// ---------------------------------------------------------------- ตัวเลือกเสริมแบบ Checkbox (เลือกได้หลายอย่าง)
// "ไม่ใส่<วัตถุดิบ>" สร้างอัตโนมัติจากวัตถุดิบที่เอาออกได้ของแต่ละเมนู (id = no_<ingredient>)
export const MODIFIERS = {
  sauce_side:  { type: 'request', th: 'แยกน้ำจิ้ม',   en: 'sauce on the side', extra: 0,
    kw: ['แยกน้ำจิ้ม', 'น้ำจิ้มแยก', 'แยกซอส', 'sauce on the side', 'sauce separately', 'separate sauce', 'dressing on the side'], applies: (it) => !!it.sauce },
  less_oil:    { type: 'request', th: 'น้ำมันน้อย',   en: 'less oil', extra: 0,
    kw: ['น้ำมันน้อย', 'มันน้อย', 'ไม่มัน', 'less oil', 'less oily', 'not too oily'], applies: (it) => !!it.fried },
  less_ice:    { type: 'request', th: 'น้ำแข็งน้อย',  en: 'less ice', extra: 0,
    kw: ['น้ำแข็งน้อย', 'น้ำแข็งนิดเดียว', 'less ice', 'light ice'], applies: (it) => !!it.values?.temperature?.includes('iced') },
  takeaway:    { type: 'request', th: 'สั่งกลับบ้าน', en: 'takeaway', extra: 5,
    kw: ['ใส่กล่อง', 'กลับบ้าน', 'ห่อกลับ', 'take away', 'takeaway', 'take-away', 'to go'], applies: () => true },
  extra_shot:  { type: 'addon', th: 'เพิ่มช็อตกาแฟ', en: 'extra shot', extra: 15,
    kw: ['เพิ่มช็อต', 'เพิ่มชอต', 'ช็อตพิเศษ', 'ดับเบิ้ลช็อต', 'extra shot', 'double shot', 'add a shot'], applies: (it) => it.category === 'coffee' },
  whipped:     { type: 'addon', th: 'วิปครีม',       en: 'whipped cream', extra: 10, allergens: ['dairy'],
    kw: ['วิปครีม', 'วิป', 'whipped cream', 'whip'], applies: (it) => it.kind === 'drink' && it.id !== 'espresso' },
  croissant:   { type: 'addon', bakery: true, emoji: '🥐', th: 'ครัวซองต์',     en: 'croissant', extra: 45, allergens: ['dairy', 'gluten', 'egg'],
    kw: ['ครัวซองต์', 'ครัวซองท์', 'ครัวซอง', 'croissant'], applies: (it) => it.kind === 'drink' },
  banana_cake: { type: 'addon', bakery: true, emoji: '🍌', th: 'เค้กกล้วยหอม',  en: 'banana cake', extra: 40, allergens: ['egg', 'dairy', 'gluten'],
    kw: ['เค้กกล้วยหอม', 'เค้กกล้วย', 'ขนมปังกล้วย', 'banana cake', 'banana bread'], applies: (it) => it.kind === 'drink' },
  pb_cookie:   { type: 'addon', bakery: true, emoji: '🍪', th: 'คุกกี้เนยถั่ว',  en: 'peanut butter cookie', extra: 35, allergens: ['peanut', 'dairy', 'gluten', 'egg'],
    kw: ['คุกกี้เนยถั่ว', 'คุกกี้', 'peanut butter cookie', 'cookie'], applies: (it) => it.kind === 'drink' },
};

// ---------------------------------------------------------------- เมนู
const drink = (id, th, en, emoji, category, price, temps, milk, keywords) => ({
  id, th, en, emoji, kind: 'drink', category, price, prep: 4, keywords,
  groups: ['temperature', ...(milk ? ['milk'] : []), 'sweetness', 'size'],
  values: { temperature: temps },
});

const CAFE_MENU = [
  drink('espresso',   'เอสเปรสโซ่', 'Espresso',       '☕', 'coffee', 45, ['hot'], false, ['เอสเปรสโซ่', 'เอสเปรสโซ', 'เอสเพรสโซ', 'espresso', 'expresso']),
  drink('americano',  'อเมริกาโน่', 'Americano',      '🖤', 'coffee', 50, ['hot', 'iced'], false, ['อเมริกาโน่', 'อเมริกาโน', 'americano', 'black coffee', 'กาแฟดำ']),
  drink('latte',      'ลาเต้',      'Latte',          '🥛', 'coffee', 55, ['hot', 'iced', 'frappe'], true, ['ลาเต้', 'ลาเต', 'ลาเท่', 'latte']),
  drink('cappuccino', 'คาปูชิโน่',   'Cappuccino',     '☁️', 'coffee', 55, ['hot', 'iced', 'frappe'], true, ['คาปูชิโน่', 'คาปูชิโน', 'คาปู', 'cappuccino', 'capuccino', 'cappucino']),
  drink('mocha',      'มอคค่า',     'Mocha',          '🍫', 'coffee', 60, ['hot', 'iced', 'frappe'], true, ['มอคค่า', 'มอคคา', 'ม็อคค่า', 'mocha', 'mocca']),
  drink('thai_tea',   'ชาไทย',      'Thai Milk Tea',  '🧡', 'tea',    50, ['hot', 'iced', 'frappe'], true, ['ชาไทย', 'ชาเย็น', 'ชานมเย็น', 'thai tea', 'thai milk tea']),
  drink('green_tea',  'ชาเขียวนม',  'Green Milk Tea', '🍵', 'tea',    55, ['hot', 'iced', 'frappe'], true, ['ชาเขียวนม', 'ชาเขียว', 'มัทฉะ', 'matcha', 'green tea']),
  drink('cocoa',      'โกโก้',      'Cocoa',          '🍪', 'other',  50, ['hot', 'iced', 'frappe'], true, ['โกโก้', 'โกโก', 'ช็อกโกแลต', 'ช็อคโกแลต', 'cocoa', 'hot chocolate', 'chocolate']),
];

// id รูปแบบ food_XX ตามตัวอย่างในเอกสาร (ข้าวผัดกระเทียมแซลมอน = food_04)
// removable = วัตถุดิบที่ขอไม่ใส่ได้, fixed = ส่วนผสมหลักที่เอาออกไม่ได้
const FOOD_MENU = [
  { id: 'food_01', th: 'ข้าวกะเพรา', en: 'Kaprao Rice', emoji: '🌿', kind: 'food', price: 50, prep: 7, fried: true,
    keywords: ['ข้าวกะเพรา', 'ข้าวกระเพรา', 'ผัดกะเพรา', 'ผัดกระเพรา', 'กะเพรา', 'กระเพรา', 'pad kra pao', 'kra pao', 'kaprao', 'krapao', 'holy basil', 'basil'],
    groups: ['protein', 'spice', 'egg', 'portion'], values: { protein: ['minced_pork', 'chicken', 'crispy_pork', 'shrimp', 'squid'] },
    removable: ['long_bean', 'onion', 'oyster_sauce', 'garlic'] },
  { id: 'food_02', th: 'ข้าวผัด', en: 'Fried Rice', emoji: '🍳', kind: 'food', price: 50, prep: 6, fried: true,
    keywords: ['ข้าวผัด', 'fried rice'],
    groups: ['protein', 'egg', 'portion'], values: { protein: ['minced_pork', 'chicken', 'crispy_pork', 'shrimp'] },
    removable: ['egg', 'spring_onion', 'onion'] },
  { id: 'food_03', th: 'ผัดไทย', en: 'Pad Thai', emoji: '🍜', kind: 'food', price: 60, prep: 8, fried: true,
    keywords: ['ผัดไทย', 'ผัดไท', 'pad thai', 'phad thai'],
    groups: ['protein', 'portion'], values: { protein: ['shrimp', 'chicken', 'tofu'] },
    removable: ['peanut', 'egg', 'dried_shrimp', 'bean_sprout'] },
  { id: 'food_04', th: 'ข้าวผัดกระเทียม', en: 'Garlic Fried Rice', emoji: '🐟', kind: 'food', price: 60, prep: 10, fried: true, sauce: true,
    keywords: ['ข้าวผัดกระเทียม', 'ข้าวกระเทียม', 'garlic fried rice', 'garlic rice'],
    groups: ['protein', 'portion'], values: { protein: ['salmon', 'saba', 'chicken', 'minced_pork'] }, defaults: { protein: 'salmon' },
    removable: ['spring_onion', 'coriander'], fixed: ['garlic'] },
  { id: 'food_05', th: 'ต้มยำกุ้ง', en: 'Tom Yum Goong', emoji: '🦐', kind: 'food', price: 90, prep: 10,
    keywords: ['ต้มยำกุ้ง', 'ต้มยำ', 'tom yum goong', 'tom yum kung', 'tom yum'],
    groups: ['spice'], removable: ['coriander'], fixed: ['shrimp_meat'] },
  { id: 'food_06', th: 'ข้าวมันไก่', en: 'Hainanese Chicken Rice', emoji: '🍗', kind: 'food', price: 50, prep: 5, sauce: true,
    keywords: ['ข้าวมันไก่', 'hainanese chicken rice', 'chicken rice', 'hainanese chicken'],
    groups: ['portion'], removable: ['soybean_sauce', 'coriander'] },
  { id: 'food_07', th: 'ส้มตำไทย', en: 'Som Tam', emoji: '🥗', kind: 'food', price: 50, prep: 6,
    keywords: ['ส้มตำไทย', 'ส้มตำ', 'ตำไทย', 'som tam', 'papaya salad'],
    groups: ['spice'], removable: ['peanut', 'dried_shrimp', 'long_bean'] },
];

const FOOD_MODS = ['sauce_side', 'less_oil', 'takeaway'];
const FOOD_GENERIC = [{ key: 'food', th: 'อาหาร', en: 'food', kw: ['กับข้าว', 'อาหาร', 'ข้าว', 'อะไรก็ได้', 'something to eat', 'food', 'rice'], filter: () => true }];

// ---------------------------------------------------------------- สถานการณ์ (Scenario 1.1 - 1.3)
export const SCENARIOS = {
  cafe: {
    id: 'cafe', code: '1.1', icon: '☕', th: 'คาเฟ่และเบเกอรี', en: 'Café & Bakery',
    staff: { th: 'บาริสต้า', en: 'Barista', emoji: '🧑‍🍳' },
    unit: { th: 'แก้ว', en: 'cup' },
    decor: '☕ 🥐 🍰 🧁 🍪 ☕',
    focus: { th: 'ชี้เลือกเมนูบนแท็บเล็ต + พูดบอกระดับความหวาน', en: 'Point at the menu on the tablet + say the sweetness level' },
    menu: CAFE_MENU,
    modifiers: ['extra_shot', 'whipped', 'less_ice', 'takeaway', 'croissant', 'banana_cake', 'pb_cookie'],
    generic: [
      { key: 'coffee', th: 'กาแฟ', en: 'coffee', kw: ['กาแฟ', 'coffee'], filter: (it) => it.category === 'coffee' },
      { key: 'tea', th: 'ชา', en: 'tea', kw: ['ชา', 'tea'], filter: (it) => it.category === 'tea' },
    ],
    opening: {
      th: 'สวัสดีครับ ยินดีต้อนรับครับ วันนี้รับเครื่องดื่มหรือเบเกอรีอะไรดีครับ?',
      en: 'Hi there, welcome! What can I get for you today — a drink, maybe something from the bakery?',
    },
    askItem: { th: 'รับเครื่องดื่มตัวไหนดีครับ?', en: 'Which drink would you like?' },
    recommend: { th: 'ถ้าชอบรสเข้มแนะนำอเมริกาโน่ ถ้าชอบนุ่มๆ แนะนำลาเต้ ทานคู่กับครัวซองต์อบใหม่ก็เข้ากันครับ', en: 'If you like it strong, try the americano; for something smooth, the latte goes great with a fresh croissant.' },
    missions: [
      { id: 'c1', th: 'ลาเต้เย็นนมโอ๊ต', en: 'Iced Oat Latte',
        brief: { th: 'สั่งลาเต้เย็น ใช้นมโอ๊ต หวานน้อย ไซส์ปกติ 1 แก้ว', en: 'Order one regular iced latte with oat milk, less sweet' },
        target: { item: 'latte', options: { temperature: 'iced', milk: 'oat', sweetness: 'less', size: 'regular' }, quantity: 1 } },
      { id: 'c2', th: 'กาแฟดำกับครัวซองต์', en: 'Americano & Croissant',
        brief: { th: 'สั่งอเมริกาโน่ร้อน ไม่หวาน ไซส์ใหญ่ และขอครัวซองต์ 1 ชิ้น', en: 'Order a large hot americano, no sugar, plus a croissant' },
        target: { item: 'americano', options: { temperature: 'hot', sweetness: 'none', size: 'large' }, modifiers: ['croissant'], quantity: 1 } },
      { id: 'c3', th: 'แพ้นมวัว!', en: 'Dairy Allergy!', profile: { allergies: ['dairy'] },
        brief: { th: 'คุณแพ้นมวัว อยากได้คาปูชิโน่เย็น หวานน้อย ไซส์ปกติ — ต้องแจ้งพนักงานและเลือกนมที่ปลอดภัย', en: 'You are allergic to dairy. Get a regular iced cappuccino, less sweet — tell the barista and pick a safe milk' },
        target: { item: 'cappuccino', options: { temperature: 'iced', sweetness: 'less', size: 'regular', milk: ['oat', 'soy'] }, quantity: 1 } },
      { id: 'c4', th: 'ชาไทยปั่นให้เพื่อน', en: 'Thai Tea for a Friend',
        brief: { th: 'สั่งชาไทยปั่น นมวัว หวานปกติ ไซส์ปกติ 2 แก้ว', en: 'Order two regular Thai tea frappés with dairy milk, normal sweetness' },
        target: { item: 'thai_tea', options: { temperature: 'frappe', milk: 'dairy', sweetness: 'normal', size: 'regular' }, quantity: 2 } },
    ],
  },

  restaurant: {
    id: 'restaurant', code: '1.2', icon: '🍳', th: 'ร้านอาหารตามสั่ง', en: 'Made-to-order Restaurant',
    staff: { th: 'พนักงานร้าน', en: 'Server', emoji: '👨‍🍳' },
    unit: { th: 'จาน', en: 'plate' },
    decor: '🍳 🌶️ 🧄 🥢 🍚 🍳',
    focus: { th: 'พิมพ์หรือเลือกตัวเลือกย่อย (Checkbox) + พูดทวนออเดอร์', en: 'Type or tick the modifier checkboxes + read the order back' },
    menu: FOOD_MENU, commonRemovable: ['msg'], modifiers: FOOD_MODS, generic: FOOD_GENERIC,
    opening: { th: 'สวัสดีครับ เชิญครับ วันนี้รับเมนูอะไรดีครับ? ทุกจานทำตามสั่งครับ', en: 'Hi, welcome! What would you like today? Everything is cooked to order.' },
    askItem: { th: 'รับเมนูไหนดีครับ?', en: 'Which dish would you like?' },
    recommend: { th: 'ขายดีสุดคือข้าวกะเพรา ใส่ไข่ดาวเพิ่มได้ครับ', en: 'Our best seller is kaprao rice — you can add a fried egg on top.' },
    missions: [
      { id: 'r1', th: 'กะเพราสูตรเด็ด', en: 'The Perfect Kaprao',
        brief: { th: 'สั่งข้าวกะเพราหมูสับ ไม่ใส่ถั่วฝักยาว เผ็ดน้อย พิเศษไข่ดาวสุกๆ แล้วทวนออเดอร์ให้ถูก', en: 'Order kaprao rice with minced pork, no long beans, mild, plus a well-done fried egg — then confirm the order' },
        target: { item: 'food_01', options: { protein: 'minced_pork', spice: 'mild', egg: 'fried_well' }, modifiers: ['no_long_bean'], quantity: 1 } },
      { id: 'r2', th: 'ข้าวผัดกุ้งจานพิเศษ', en: 'Large Shrimp Fried Rice ×2',
        brief: { th: 'สั่งข้าวผัดกุ้ง จานพิเศษ ไม่ใส่ต้นหอม 2 จาน', en: 'Order two large shrimp fried rice, no spring onion' },
        target: { item: 'food_02', options: { protein: 'shrimp', portion: 'large' }, modifiers: ['no_spring_onion'], quantity: 2 } },
      { id: 'r3', th: 'ผัดไทยกลับบ้าน', en: 'Pad Thai to Go',
        brief: { th: 'สั่งผัดไทยไก่ ไม่ใส่ถั่วงอก ใส่กล่องกลับบ้าน', en: 'Order chicken pad Thai, no bean sprouts, as takeaway' },
        target: { item: 'food_03', options: { protein: 'chicken' }, modifiers: ['no_bean_sprout', 'takeaway'], quantity: 1 } },
      { id: 'r4', th: 'ส้มตำไม่ใส่ผงชูรส', en: 'Som Tam, No MSG',
        brief: { th: 'สั่งส้มตำไทย เผ็ดน้อย ไม่ใส่ผงชูรส', en: 'Order som tam, mild, no MSG' },
        target: { item: 'food_07', options: { spice: 'mild' }, modifiers: ['no_msg'], quantity: 1 } },
    ],
  },

  allergy: {
    id: 'allergy', code: '1.3', icon: '🩺', th: 'แพ้อาหาร / ข้อจำกัดด้านสุขภาพ', en: 'Dietary Restrictions & Allergies',
    staff: { th: 'พนักงานเสิร์ฟ', en: 'Server', emoji: '👩‍🍳' },
    unit: { th: 'จาน', en: 'plate' },
    decor: '🩺 🥗 🍲 🥢 🍚 🩺',
    focus: { th: 'แจ้งอาการแพ้อาหาร ถามส่วนผสม และยืนยันความปลอดภัยกับพนักงาน', en: 'Declare allergies, ask about ingredients and confirm safety with the staff' },
    menu: FOOD_MENU, commonRemovable: ['msg'], modifiers: FOOD_MODS, generic: FOOD_GENERIC, allergyPanel: true,
    opening: { th: 'สวัสดีครับ ยินดีต้อนรับครับ ดูเมนูได้เลยครับ รับอะไรดีครับ?', en: 'Hello and welcome! Have a look at the menu — what would you like?' },
    askItem: { th: 'รับเมนูไหนดีครับ?', en: 'Which dish would you like?' },
    recommend: { th: 'ถ้าต้องการเลี่ยงอาหารทะเลและถั่ว ข้าวมันไก่กับข้าวผัดไก่ปลอดภัยครับ', en: 'If you need to avoid seafood and nuts, the chicken rice or chicken fried rice are safe choices.' },
    missions: [
      { id: 'a1', th: 'แพ้ถั่วลิสง', en: 'Peanut Allergy', profile: { allergies: ['peanut'] },
        brief: { th: 'คุณแพ้ถั่วลิสง อยากกินผัดไทยกุ้ง — แจ้งพนักงานและยืนยันว่าไม่มีถั่ว', en: 'You are allergic to peanuts and want shrimp pad Thai — tell the server and make sure it is peanut-free' },
        target: { item: 'food_03', options: { protein: 'shrimp' }, quantity: 1 } },
      { id: 'a2', th: 'แพ้อาหารทะเล', en: 'Seafood Allergy', profile: { allergies: ['seafood'] },
        brief: { th: 'คุณแพ้อาหารทะเล อยากกินข้าวกะเพรา เผ็ดกลาง — ระวังซอสหอยนางรม!', en: 'You are allergic to seafood and want kaprao rice, medium spicy — watch out for the oyster sauce!' },
        target: { item: 'food_01', options: { protein: ['minced_pork', 'chicken', 'crispy_pork'], spice: 'medium' }, quantity: 1 } },
      { id: 'a3', th: 'อยากกินต้มยำ แต่แพ้กุ้ง', en: 'Craving Tom Yum, Allergic to Shrimp', profile: { allergies: ['seafood'] },
        brief: { th: 'คุณแพ้อาหารทะเลแต่อยากกินต้มยำกุ้ง — แจ้งพนักงาน แล้วให้พนักงานช่วยแนะนำเมนูที่ปลอดภัยแทน', en: 'You are allergic to seafood but want tom yum goong — tell the server and let them suggest a safe dish instead' },
        target: { quantity: 1 } },
      { id: 'a4', th: 'ขอเปลี่ยนวัตถุดิบ', en: 'Ingredient Swap',
        brief: { th: 'สั่งข้าวผัดกระเทียมแซลมอน แต่ขอเปลี่ยนเป็นปลาซาบะย่าง ไม่ใส่ต้นหอม ไม่ใส่ผักชี และแยกน้ำจิ้ม', en: 'Order the salmon garlic fried rice but swap to grilled saba, no spring onion, no coriander, sauce on the side' },
        target: { item: 'food_04', options: { protein: 'saba' }, modifiers: ['no_spring_onion', 'no_coriander', 'sauce_side'], quantity: 1 } },
      { id: 'a5', th: 'แพ้ไข่', en: 'Egg Allergy', profile: { allergies: ['egg'] },
        brief: { th: 'คุณแพ้ไข่ อยากกินข้าวผัดไก่ — ข้าวผัดปกติใส่ไข่นะ!', en: 'You are allergic to eggs and want chicken fried rice — it normally has egg in it!' },
        target: { item: 'food_02', options: { protein: 'chicken' }, quantity: 1 } },
    ],
  },
};

export const SCENARIO_LIST = Object.values(SCENARIOS);
export const getScenario = (id) => SCENARIOS[id] || SCENARIOS.cafe;
