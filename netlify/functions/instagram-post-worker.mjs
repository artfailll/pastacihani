import { getStore } from '@netlify/blobs';

const GRAPH_VERSION = 'v26.0';
const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CLOUD_NAME = 'do7gjdvb0';
const REEL_TEMPLATE = 'v1787165692/system/reel-template-v2.mp4';
const BRAND_LOGO_LAYER = 'system:brand-logo-round-v1';

function cloudinaryPublicId(imageUrl) {
  const parsed = new URL(imageUrl);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') throw new Error('Cloudinary:invalid_image');
  const marker = `/${CLOUD_NAME}/image/upload/`;
  const start = parsed.pathname.indexOf(marker);
  if (start < 0) throw new Error('Cloudinary:invalid_image');
  const rest = parsed.pathname.slice(start + marker.length);
  const version = rest.match(/(?:^|\/)v\d+\/(.+)$/);
  if (!version?.[1]) throw new Error('Cloudinary:image_version_missing');
  const publicId = decodeURIComponent(version[1]).replace(/\.[a-z0-9]+$/i, '');
  if (!publicId || !/^[\p{L}\p{N}_./-]+$/u.test(publicId)) throw new Error('Cloudinary:invalid_public_id');
  return publicId.replaceAll('/', ':');
}

// Üst Seviye Montaj & Edit Motoru (Reels Video Generator)
function buildReelVideoUrl(imageUrl, montageStyle = 'cinematic', musicUrl = '') {
  const photoLayer = cloudinaryPublicId(imageUrl);

  let photoTransformation = 'c_fill,g_center,h_720,w_610,r_32';

  if (montageStyle === 'zoom') {
    // Odak & Yakınlaştırma Montajı
    photoTransformation = 'c_fill,g_center,h_750,w_630,r_38,e_sharpen:80';
  } else if (montageStyle === 'luxury_gold') {
    // Lüks Altın Çerçeve Montajı
    photoTransformation = 'c_fill,g_center,h_710,w_600,r_36,b_rgb:DDB977';
  } else if (montageStyle === 'split') {
    // Modern Çift Katman Montajı
    photoTransformation = 'c_fill,g_center,h_700,w_590,r_24';
  }

  const transformations = [
    'c_fill,g_center,h_1280,w_720',
    `l_${photoLayer}`,
    photoTransformation,
    'fl_layer_apply,g_center,y_-15',
    `l_${BRAND_LOGO_LAYER}`,
    'c_fill,g_center,h_118,w_118',
    'fl_layer_apply,g_north_west,x_40,y_40',
    'q_auto:good,vc_h264,ac_aac,f_mp4'
  ].join('/');

  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transformations}/${REEL_TEMPLATE}`;
}

// Instagram Story Görseli (Vinyet KARARTMASI KALDIRILDI + 4 Dinamik Şablon Rotasyonu)
function buildStoryImageUrl(imageUrl, seed = Date.now()) {
  const logo = `l_${BRAND_LOGO_LAYER}/c_thumb,g_center,h_150,w_150,r_max/fl_layer_apply,g_north_east,x_44,y_54`;

  const styles = [
    `w_1080,h_1920,c_pad,g_center,b_rgb:FBF6F2,q_auto:good,f_jpg/${logo}`,
    `w_1080,h_1920,c_pad,g_center,b_rgb:351421,q_auto:good,f_jpg/${logo}`,
    `w_1080,h_1920,c_pad,g_center,b_rgb:F5E9EC,q_auto:good,f_jpg/${logo}`,
    `w_1080,h_1920,c_pad,g_center,b_rgb:FAF3E6,q_auto:good,f_jpg/${logo}`
  ];

  const selectedStyle = styles[seed % styles.length];
  return imageUrl.replace('/image/upload/', `/image/upload/${selectedStyle}/`);
}

// Keşfet (Explore) Algoritması & Dinamik Hook Metinleri
function normalizeCaption(value, category = 'dogumgunu') {
  const input = String(value || '').replace(/\u0000/g, '').trim();
  const foundTags = input.match(/#[\p{L}\p{N}_]+/gu) || [];
  const body = input.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  const exploreHooks = [
    '✨ Silivri’nin en çok konuşulan özel tasarım pastası!',
    '🎂 Bu detaylara hazır mısınız? Özel sipariş tasarımımız.',
    '💎 Kişiye özel butik pasta sanatı · Pastacihanı',
    '🎉 Özel günleriniz için tatlı bir dokunuş!'
  ];

  const hook = exploreHooks[Math.floor(Math.random() * exploreHooks.length)];
  const formattedBody = body.startsWith('✨') || body.startsWith('🎂') ? body : `${hook}\n\n${body}`;

  const tagPool = [
    '#pastacihani',
    '#silivripasta',
    '#butikpasta',
    '#silivriozeltasarim',
    '#ozeltasarimpasta',
    '#silivri',
    '#kumburgazpasta',
    '#catalcapasta',
    '#pastagörseli',
    '#kesfet',
    '#kesfetteyiz',
    '#pastasiparisi'
  ];

  const tags = ['#pastacihani'];
  for (const tag of foundTags) {
    const normalized = tag.toLocaleLowerCase('tr-TR');
    if (normalized === '#pastacihani') continue;
    if (!tags.some((e) => e.toLocaleLowerCase('tr-TR') === normalized)) tags.push(tag);
    if (tags.length === 5) break;
  }

  const shuffledPool = [...tagPool].sort(() => 0.5 - Math.random());
  for (const fallback of shuffledPool) {
    if (tags.length >= 6) break;
    if (!tags.some((e) => e.toLocaleLowerCase('tr-TR') === fallback)) tags.push(fallback);
  }

  const tagLine = tags.join(' ');
  const maxBodyLength = 2200 - tagLine.length - 2;
  let safeBody = formattedBody.slice(0, maxBodyLength).trim();
  if (formattedBody.length > maxBodyLength) safeBody = safeBody.replace(/\s+\S*$/, '').trimEnd() + '…';

  return `${safeBody}${safeBody ? '\n\n' : ''}${tagLine}`;
}

async function graph(path, options = {}) {
  const result = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    ...options,
    signal: AbortSignal.timeout(30_000)
  });
  const data = await result.json();
  if (!result.ok || data.error) throw new Error(`Meta:${result.status}:${data?.error?.code || 'unknown'}`);
  return data;
}

async function waitForCloudinaryVideo(videoUrl) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await fetch(videoUrl, { method: 'HEAD', signal: AbortSignal.timeout(20_000) }).catch(() => null);
    if (result?.ok && /video\/mp4/i.test(result.headers.get('content-type') || '')) return;
    await new Promise((resolve) => setTimeout(resolve, 4_000));
  }
  throw new Error('Cloudinary:video_not_ready');
}

async function waitForContainer(containerId, pageToken) {
  for (let attempt = 0; attempt < 90; attempt++) {
    const status = await graph(`${containerId}?fields=status_code,status&access_token=${encodeURIComponent(pageToken)}`);
    if (status.status_code === 'FINISHED') return;
    if (['ERROR', 'EXPIRED'].includes(status.status_code)) throw new Error(`Meta:container_${status.status_code.toLowerCase()}`);
    await new Promise((resolve) => setTimeout(resolve, 4_000));
  }
  throw new Error('Meta:container_timeout');
}

async function publishContainer(igId, creationId, pageToken) {
  const published = await graph(`${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: pageToken })
  });
  if (!published.id) throw new Error('Meta:publish_no_id');
  return published.id;
}

async function runJob(jobId, store) {
  const job = await store.get(jobId, { type: 'json' });
  if (!job || !['queued', 'processing'].includes(job.status)) return;
  await store.setJSON(jobId, { status: 'processing', createdAt: job.createdAt || Date.now() });

  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) throw new Error('Instagram:missing_token');

  const videoUrl = buildReelVideoUrl(job.imageUrl, job.montageStyle || 'cinematic', job.musicUrl);
  await waitForCloudinaryVideo(videoUrl);

  const pages = await graph(`me/accounts?access_token=${encodeURIComponent(token)}`);
  if (!pages.data?.[0]) throw new Error('Meta:no_page');
  const pageToken = pages.data[0].access_token, pageId = pages.data[0].id;
  const page = await graph(`${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`);
  const igId = page.instagram_business_account?.id;
  if (!igId) throw new Error('Meta:no_instagram_account');

  // Reel Yayınlama
  const reel = await graph(`${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption: normalizeCaption(job.caption, job.category),
      share_to_feed: true,
      access_token: pageToken
    })
  });
  if (!reel.id) throw new Error('Meta:reel_container_no_id');
  await waitForContainer(reel.id, pageToken);
  const reelId = await publishContainer(igId, reel.id, pageToken);

  // Story Yayınlama (Vinyetsiz, 4 dinamik şablonlu)
  const storyImageUrl = buildStoryImageUrl(job.imageUrl, Date.now());
  const story = await graph(`${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: storyImageUrl, media_type: 'STORIES', access_token: pageToken })
  });
  if (!story.id) throw new Error('Meta:story_container_no_id');
  await waitForContainer(story.id, pageToken);
  const storyId = await publishContainer(igId, story.id, pageToken);

  await store.setJSON(jobId, {
    status: 'completed', reelId, storyId, videoUrl, storyImageUrl,
    createdAt: job.createdAt || Date.now(), completedAt: Date.now()
  });
  console.info('instagram Reel + Story completed', { jobId });
}

export default async (request) => {
  const store = getStore({ name: 'instagram-publish-jobs', consistency: 'strong' });
  let jobId = '';
  try {
    if (request.method !== 'POST') return;
    const body = await request.json();
    jobId = String(body.jobId || '');
    if (!JOB_ID_RE.test(jobId)) return;
    await runJob(jobId, store);
  } catch (error) {
    console.error('instagram worker:', jobId, error?.message || error);
    if (jobId) await store.setJSON(jobId, {
      status: 'failed', error: 'Reel veya Story yayınlanamadı. Lütfen tekrar deneyin.', failedAt: Date.now()
    }).catch(() => {});
  }
};

export const config = { path: '/api/instagram-post-worker', background: true };
