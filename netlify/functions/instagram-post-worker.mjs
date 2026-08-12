import { getStore } from '@netlify/blobs';

const GRAPH_VERSION = 'v26.0';
const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function normalizeCaption(value) {
  const input = String(value || '').replace(/\u0000/g, '').trim();
  const foundTags = input.match(/#[\p{L}\p{N}_]+/gu) || [];
  const body = input.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const tags = ['#pastacihani'];
  for (const tag of foundTags) {
    const normalized = tag.toLocaleLowerCase('tr-TR');
    if (normalized === '#pastacihani') continue;
    if (!tags.some((existing) => existing.toLocaleLowerCase('tr-TR') === normalized)) tags.push(tag);
    if (tags.length === 5) break;
  }
  for (const fallback of ['#silivripasta', '#butikpasta', '#ozeltasarimpasta', '#pastatasarimi']) {
    if (tags.length === 5) break;
    if (!tags.some((existing) => existing.toLocaleLowerCase('tr-TR') === fallback)) tags.push(fallback);
  }
  const tagLine = tags.join(' '), maxBodyLength = 2200 - tagLine.length - 2;
  let safeBody = body.slice(0, maxBodyLength).trim();
  if (body.length > maxBodyLength) safeBody = safeBody.replace(/\s+\S*$/, '').trimEnd() + '…';
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
  await waitForCloudinaryVideo(job.videoUrl);

  const pages = await graph(`me/accounts?access_token=${encodeURIComponent(token)}`);
  if (!pages.data?.[0]) throw new Error('Meta:no_page');
  const pageToken = pages.data[0].access_token, pageId = pages.data[0].id;
  const page = await graph(`${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`);
  const igId = page.instagram_business_account?.id;
  if (!igId) throw new Error('Meta:no_instagram_account');

  const reel = await graph(`${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: job.videoUrl,
      caption: normalizeCaption(job.caption),
      share_to_feed: true,
      access_token: pageToken
    })
  });
  if (!reel.id) throw new Error('Meta:reel_container_no_id');
  await waitForContainer(reel.id, pageToken);
  const reelId = await publishContainer(igId, reel.id, pageToken);

  const storyImageUrl = job.imageUrl.replace(
    '/image/upload/',
    '/image/upload/w_1080,h_1920,c_pad,g_center,b_rgb:FBF4EC,e_vignette:12,q_auto:good,f_jpg/'
  );
  const story = await graph(`${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: storyImageUrl, media_type: 'STORIES', access_token: pageToken })
  });
  if (!story.id) throw new Error('Meta:story_container_no_id');
  const storyId = await publishContainer(igId, story.id, pageToken);

  await store.setJSON(jobId, {
    status: 'completed', reelId, storyId,
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
