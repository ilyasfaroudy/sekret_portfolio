'use strict';
const services = ["Брендинг","Веб-дизайн","Графический дизайн","3D / Motion","Другое"];
const budgets = ["Не определён","до 30 000 ₽","30 000–60 000 ₽","60 000 ₽+"];
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ok:false}); }
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ok:false});
  // Browser submissions must originate on this deployment; no arbitrary destinations.
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ok:false}); }
    catch (_) { return res.status(403).json({ok:false}); }
  }
  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > 8192) return res.status(413).json({ok:false});
    try { body = JSON.parse(body); } catch (_) { return res.status(400).json({ok:false}); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ok:false});
  if (Buffer.byteLength(JSON.stringify(body)) > 8192) return res.status(413).json({ok:false});
  const limits = {name:100,email:254,telegram:64,service:40,message:800,budget:40,deadline:120};
  const data = {}, errors = {};
  for (const [key,max] of Object.entries(limits)) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > max) { errors[key] = 'Недопустимое значение или превышена длина.'; data[key] = ''; continue; }
    data[key] = value.trim();
    if ((key !== 'message' && /[\r\n\x00-\x1f\x7f]/.test(value)) || (key === 'message' && /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))) errors[key] = 'Удалите управляющие символы.';
  }
  if (data.name.length < 2) errors.name = 'Введите имя: минимум 2 символа.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Введите корректный email.';
  if (!services.includes(data.service)) errors.service = 'Выберите направление.';
  if (data.message.length < 20) errors.message = 'Опишите проект: от 20 до 800 символов.';
  if (data.budget && !budgets.includes(data.budget)) errors.budget = 'Выберите бюджет из списка.';
  if (Object.keys(errors).length) return res.status(400).json({ok:false,errors});
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ok:false});
  const text = ['NEW PROJECT / SEKRET®','','Имя: '+data.name,'Email: '+data.email,'Telegram: '+(data.telegram || '—'),'','Направление: '+data.service,'Бюджет: '+(data.budget || 'Не определён'),'Сроки: '+(data.deadline || '—'),'','Проект:',data.message].join('\n');
  try {
    const response = await fetch('https://api.telegram.org/bot'+token+'/sendMessage', {
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:chatId,text,link_preview_options:{is_disabled:true}}),
      signal:AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) return res.status(502).json({ok:false});
    return res.status(200).json({ok:true});
  } catch (_) { return res.status(502).json({ok:false}); }
};
