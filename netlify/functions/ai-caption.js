exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'API key yok' }) };
  try {
    const { imageUrl, category } = JSON.parse(event.body);
    const prompt = `Sen Pastacihanı adlı İstanbul butik pasta markasının sosyal medya uzmanısın. Bu ${category||'pasta'} fotoğrafına bak, Instagram için Türkçe, samimi, iştah açıcı bir caption yaz. 2-3 cümle, emoji kullan, sonuna "Sipariş: 0554 810 63 01" ekle, EN FAZLA 5 hashtag. Sadece caption yaz.`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }] }],
        max_tokens: 300
      })
    });
    const data = await res.json();
    const caption = data.choices?.[0]?.message?.content;
    if (caption) return { statusCode: 200, body: JSON.stringify({ caption }) };
    return { statusCode: 400, body: JSON.stringify({ error: 'Caption üretilemedi', detail: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
