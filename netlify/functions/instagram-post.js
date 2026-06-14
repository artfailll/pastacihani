exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: 'Token yok' }) };
  try {
    const { imageUrl, caption, category } = JSON.parse(event.body);
    const pRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
    const pData = await pRes.json();
    if (!pData.data?.[0]) return { statusCode: 400, body: JSON.stringify({ error: 'Sayfa bulunamadı', d: pData }) };
    const pt = pData.data[0].access_token, pid = pData.data[0].id;
    const igRes = await fetch(`https://graph.facebook.com/v19.0/${pid}?fields=instagram_business_account&access_token=${pt}`);
    const igData = await igRes.json();
    if (!igData.instagram_business_account) return { statusCode: 400, body: JSON.stringify({ error: 'IG bağlı değil' }) };
    const igId = igData.instagram_business_account.id;
    const results = {};
    const cRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: imageUrl, caption: caption || '', access_token: pt }) });
    const cData = await cRes.json();
    if (cData.id) {
      const pub = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: cData.id, access_token: pt }) });
      results.post = await pub.json();
    }
    const sRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: imageUrl, media_type: 'STORIES', access_token: pt }) });
    const sData = await sRes.json();
    if (sData.id) {
      await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: sData.id, access_token: pt }) });
      results.story = { success: true };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true, results }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
