const { json, requireAdmin } = require('../lib/auth');

// AI Caption: OpenAI ile fotoğrafa bakıp Instagram caption üretir
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Yalnızca POST desteklenir' });
  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return json(503, { error: 'Yapay zekâ servisi yapılandırılmadı' });

  try {
    const { imageUrl, category } = JSON.parse(event.body || '{}');
    if (!/^https:\/\/res\.cloudinary\.com\/do7gjdvb0\//.test(imageUrl || '')) {
      return json(400, { error: 'Geçersiz görsel adresi' });
    }

    const prompt = `Sen Pastacihanı adlı Silivri'de (İstanbul) butik pasta yapan, yalnızca Silivri ve çevresine (Kumburgaz'a kadar) teslimat yapan bir markanın sosyal medya uzmanısın. Bu ${category||'pasta'} fotoğrafına bak ve Instagram için Türkçe, samimi, iştah açıcı bir caption yaz. Kurallar: 2-3 cümle olsun, emoji kullan, sonuna "Sipariş: 0554 810 63 01" ekle, EN FAZLA 5 hashtag koy (en az biri #silivripasta olsun, geneli pasta ile ilgili). İstanbul genelinde teslimat yapıyormuş gibi ima etme — yalnızca Silivri ve çevresi vurgusu yap. Sadece caption'ı yaz, başka açıklama yapma.`;

    const openaiBase = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
    const res = await fetch(`${openaiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 300
      })
    });
    const data = await res.json();
    const caption = data.choices?.[0]?.message?.content;
    if (caption) return json(200, { caption });
    return json(502, { error: 'Açıklama üretilemedi' });
  } catch (err) {
    console.error('ai-caption:', err);
    return json(500, { error: 'Açıklama üretilirken bir hata oluştu' });
  }
};
