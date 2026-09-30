import { processTurn } from './src/actorEngine.js';
function play(scenario, lang, turns, profile=null) {
  let order=null; const history=[];
  for (const t of turns) {
    const r = processTurn({ scenario, language: lang, order_state: order, dialogue_history: history, current_turn: t, learner_profile: profile }, { rng: () => 1 });
    order = r.order_state; history.push({role:'user',content:'x'},{role:'actor',content:r.actor_reply});
    console.log('>', JSON.stringify(t)); console.log('<', r.actor_reply, '|', r.action_state, r.total_price, JSON.stringify({o:order.options,m:order.modifiers,a:order.allergies,p:order.phase}), '| coach:', r.coach.rating, r.coach.notes.join('; '));
  }
  console.log('---');
}
play('restaurant','th',[{user_speech:'กะเพราหมูสับ ไม่ใส่ถั่วฝักยาว เผ็ดน้อย พิเศษไข่ดาวสุกๆ ครับ'},{user_speech:'กะเพราหมูสับ เผ็ดน้อย ไข่ดาวสุก ไม่ใส่ถั่วฝักยาวนะครับ'}]);
play('allergy','th',[{user_action:{type:'point',target_id:'food_04'}, user_speech:'ขอเปลี่ยนเป็นปลาซาบะย่างแทนได้ไหมครับ แล้วก็ไม่ใส่ต้นหอม', user_selection:{modifiers:['sauce_side','no_coriander']}},{user_text:'ใช่ครับ'}]);
play('allergy','th',[{user_text:'ผมแพ้ถั่วลิสงครับ'},{user_text:'ผัดไทยมีถั่วไหมครับ'},{user_text:'ขอผัดไทยกุ้งครับ'},{user_text:'ถูกต้องครับ'}],{allergies:['peanut']});
play('allergy','th',[{user_text:'แพ้อาหารทะเลครับ ขอต้มยำกุ้ง'}],{allergies:['seafood']});
play('allergy','th',[{user_text:'ขอกะเพรากุ้ง เผ็ดกลาง'},{user_text:'แพ้อาหารทะเลครับ'},{user_text:'หมูสับครับ'}],{allergies:['seafood']});
play('cafe','th',[{user_speech:'หวานน้อยแก้วหนึ่งครับ', user_action:{type:'point',target_id:'iced_latte'}},{user_speech:'นมโอ๊ตครับ'},{user_speech:'ไซส์ปกติ'},{user_speech:'ครับ'}]);
play('cafe','en',[{user_speech:"Hi, I'm allergic to dairy. Could I get two large iced cappuccinos, less sweet, with oat milk and a croissant please?"},{user_text:'yes'}]);
play('restaurant','en',[{user_text:'kaprao with chicken, mild, fried egg'},{user_text:'runny please'},{user_text:'no, no onion please'},{user_text:'correct'}]);
play('cafe','th',[{user_speech:'เอากาแฟแก้วนึง'}]);
