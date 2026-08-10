const express=require("express");
const path=require("path");
require("dotenv").config();
const app=express();
const PORT=Number(process.env.PORT||3000);
const TOKEN=(process.env.BOT_TOKEN||"").trim();
const CHAT=(process.env.CHAT_ID||"").trim();
app.use(express.json({limit:"200kb"}));
const clean=s=>String(s??"").replace(/[\r\n]+/g," ").trim();
async function telegram(method,body){
 const r=await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const text=await r.text();let j;try{j=JSON.parse(text)}catch{j={ok:false,description:text}}return {http:r.status,...j};
}
app.get("/api/telegram-test",async(req,res)=>{
 if(!TOKEN||!CHAT)return res.status(500).json({ok:false,error:"BOT_TOKEN yoki CHAT_ID sozlanmagan"});
 try{
  const me=await telegram("getMe",{});
  if(!me.ok)return res.status(502).json({ok:false,step:"getMe",error:me.description});
  const sent=await telegram("sendMessage",{chat_id:CHAT,text:"✅ Maktab Test: Telegram ulanishi muvaffaqiyatli."});
  if(!sent.ok)return res.status(502).json({ok:false,step:"sendMessage",error:sent.description});
  res.json({ok:true,bot:me.result.username});
 }catch(e){res.status(500).json({ok:false,error:e.message})}
});
app.post("/api/result",async(req,res)=>{
 try{
  const x=req.body;if(!x.student||!x.details)return res.status(400).json({ok:false,error:"Natija ma’lumotlari to‘liq emas."});
  let m="📝 MAKTAB TEST NATIJASI\n\n";
  m+=`👨‍🎓 O‘quvchi: ${clean(x.student)}\n`;
  m+=`📱 Telefon: ${clean(x.phone)||"Ko‘rsatilmagan"}\n`;
  m+=`🏫 Sinf: ${clean(x.className)}\n`;
  m+=`📚 Fan: ${clean(x.subject)}\n`;
  m+=`🔢 Jami: ${x.total} ta\n✅ To‘g‘ri: ${x.correct} ta\n❌ Xato: ${x.wrong} ta\n📊 Foiz: ${x.percent}%\n🏆 Baho: ${x.grade}\n\n📋 Savollar:\n`;
  for(const d of x.details){m+=`${d.isCorrect?"✅":"❌"} ${d.number}. ${clean(d.userAnswer)}${d.isCorrect?"":` → ${clean(d.correctAnswer)}`}\n`}
  if(m.length>4000)m=m.slice(0,3950)+"\n…";
  const j=await telegram("sendMessage",{chat_id:CHAT,text:m});
  if(!j.ok)return res.status(502).json({ok:false,error:j.description||"Telegram xatosi"});
  res.json({ok:true});
 }catch(e){console.error(e);res.status(500).json({ok:false,error:e.message})}
});
app.listen(PORT,()=>console.log(`Server started on port ${PORT}`));
