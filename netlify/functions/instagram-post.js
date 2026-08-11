const { json, requireAdmin } = require('../lib/auth');
const GRAPH_VERSION = 'v25.0';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Yalnızca POST desteklenir' });
  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) return json(503, { error: 'Instagram bağlantısı yapılandırılmadı' });

  try {
    const { imageUrl, caption, category } = JSON.parse(event.body || '{}');
    if (!/^https:\/\/res\.cloudinary\.com\/do7gjdvb0\//.test(imageUrl || '')) {
      return json(400, { error: 'Geçersiz görsel adresi' });
    }

    // 1) Sayfa + Instagram hesap ID al
    const pagesRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?access_token=${token}`);
    const pagesData = await pagesRes.json();
    if (!pagesData.data?.[0]) return { statusCode: 400, body: JSON.stringify({ error: 'Sayfa bulunamadı', d: pagesData }) };
    const pageToken = pagesData.data[0].access_token;
    const pageId = pagesData.data[0].id;

    const igRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
    const igData = await igRes.json();
    if (!igData.instagram_business_account) return { statusCode: 400, body: JSON.stringify({ error: 'IG hesabı bağlı değil', d: igData }) };
    const igId = igData.instagram_business_account.id;

    const results = {};

    // 2) NORMAL POST
    const postContainer = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption: caption || '', access_token: pageToken })
    });
    const postContainerData = await postContainer.json();
    if (postContainerData.id) {
      const publish = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}/media_publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: postContainerData.id, access_token: pageToken })
      });
      const publishData = await publish.json();
      results.post = publishData.id ? { success: true, id: publishData.id } : { success: false, error: publishData };
    }

    // 3) STORY
    const storyImageUrl = imageUrl.replace(
      '/image/upload/',
      '/image/upload/w_1080,h_1920,c_pad,g_center,b_rgb:FBF4EC,q_auto:good,f_jpg/'
    );
    const storyContainer = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: storyImageUrl, media_type: 'STORIES', access_token: pageToken })
    });
    const storyContainerData = await storyContainer.json();
    if (storyContainerData.id) {
      const storyPublish = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}/media_publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: storyContainerData.id, access_token: pageToken })
      });
      const storyData = await storyPublish.json();
      results.story = storyData.id ? { success: true, id: storyData.id } : { success: false, error: storyData };
    }

    const success = Boolean(results.post?.success || results.story?.success);
    return json(success ? 200 : 502, { success, results });

  } catch (err) {
    console.error('instagram-post:', err);
    return json(500, { error: 'Instagram paylaşımı sırasında bir hata oluştu' });
  }
};
