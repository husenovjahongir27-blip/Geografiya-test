const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TOKEN = (process.env.BOT_TOKEN || '').trim();
const CHAT = (process.env.CHAT_ID || '').trim();

if (!TOKEN || !CHAT) {
  console.error('XATO: BOT_TOKEN va CHAT_ID .env faylida bo‘lishi kerak.');
  process.exit(1);
}

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const clean = s => String(s).replace(/[\r\n]+/g, ' ').trim();

async function telegram(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch { j = { ok: false, description: text }; }
  return { http: r.status, ...j };
}

app.get('/api/telegram-test', async (req, res) => {
  try {
    const me = await telegram('getMe', {});
    if (!me.ok) return res.status(502).json({ ok:false, step:'getMe', error:me.description, http:me.http });
    const sent = await telegram('sendMessage', {
      chat_id: CHAT,
      text: '✅ Geografiya Test Dasturi: Telegram ulanishi muvaffaqiyatli ishlayapti.'
    });
    if (!sent.ok) return res.status(502).json({ ok:false, step:'sendMessage', bot:me.result.username, error:sent.description, http:sent.http });
    res.json({ ok:true, bot:me.result.username, chat_id:CHAT });
  } catch (e) {
    res.status(500).json({ ok:false, step:'network', error:e.message });
  }
});

app.post('/api/result', async (req, res) => {
  try {
    const x = req.body;
    if (!x.student || !x.details) return res.status(400).json({ ok:false, error:'Natija ma’lumotlari to‘liq emas.' });

    let m = '📝 GEOGRAFIYA TEST NATIJASI\n\n';
    m += `👨‍🎓 O‘quvchi: ${clean(x.student)}\n🔢 Jami: ${x.total} ta\n✅ To‘g‘ri: ${x.correct} ta\n❌ Xato: ${x.wrong} ta\n📊 Foiz: ${x.percent}%\n🏆 Baho: ${x.grade}\n\n📋 Savollar:\n`;
    for (const d of x.details) {
      m += `${d.isCorrect ? '✅' : '❌'} ${d.number}. ${clean(d.userAnswer)}`;
      if (!d.isCorrect) m += ` → ${clean(d.correctAnswer)}`;
      m += '\n';
    }

    const j = await telegram('sendMessage', { chat_id: CHAT, text: m });
    if (!j.ok) {
      console.error('Telegram sendMessage xatosi:', j);
      return res.status(502).json({ ok:false, error:j.description || 'Telegram xatosi', step:'sendMessage', http:j.http });
    }
    res.json({ ok:true });
  } catch (e) {
    console.error('Server xatosi:', e);
    res.status(500).json({ ok:false, error:e.message, step:'server' });
  }
});

app.listen(PORT, async () => {
  console.log(`http://localhost:${PORT}`);
  try {
    const me = await telegram('getMe', {});
    if (me.ok) console.log(`Telegram bot ulandi: @${me.result.username}`);
    else console.error(`Telegram token xatosi: ${me.description}`);
  } catch (e) {
    console.error(`Telegramga ulanish xatosi: ${e.message}`);
  }
});
