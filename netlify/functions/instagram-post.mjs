import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import auth from '../lib/auth.js';

const { requireAdmin } = auth;
const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const IMAGE_URL_RE = /^https:\/\/res\.cloudinary\.com\/do7gjdvb0\/image\/upload\//;
const VIDEO_URL_RE = /^https:\/\/res\.cloudinary\.com\/do7gjdvb0\/video\/upload\/[^?#]+\.mp4$/;

function response(status, body) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function legacyEvent(request) {
  return { headers: Object.fromEntries(request.headers.entries()) };
}

export default async (request) => {
  if (request.method !== 'POST') return response(405, { error: 'Yalnızca POST desteklenir' });
  const unauthorized = requireAdmin(legacyEvent(request));
  if (unauthorized) return new Response(unauthorized.body, { status: unauthorized.statusCode, headers: unauthorized.headers });
  if (!process.env.INSTAGRAM_TOKEN) return response(503, { error: 'Instagram bağlantısı yapılandırılmadı' });

  const store = getStore({ name: 'instagram-publish-jobs', consistency: 'strong' });
  let jobId = '';
  try {
    const body = await request.json();
    if (!IMAGE_URL_RE.test(body.imageUrl || '')) return response(400, { error: 'Geçersiz görsel adresi' });
    if (!VIDEO_URL_RE.test(body.videoUrl || '')) return response(400, { error: 'Geçersiz Reel video adresi' });
    jobId = crypto.randomUUID();
    if (!JOB_ID_RE.test(jobId)) throw new Error('İş kimliği oluşturulamadı');
    await store.setJSON(jobId, {
      status: 'queued',
      imageUrl: body.imageUrl,
      videoUrl: body.videoUrl,
      caption: String(body.caption || '').slice(0, 5000),
      createdAt: Date.now()
    });

    const queued = await fetch(new URL('/api/instagram-post-worker', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
      signal: AbortSignal.timeout(8_000)
    });
    if (queued.status !== 202) {
      await store.delete(jobId);
      console.error('instagram queue:', queued.status);
      return response(502, { error: 'Instagram paylaşımı başlatılamadı' });
    }
    return response(202, { jobId });
  } catch (error) {
    if (jobId) await store.delete(jobId).catch(() => {});
    console.error('instagram start:', error?.message || error);
    return response(500, { error: 'Instagram paylaşımı başlatılamadı' });
  }
};

export const config = {
  path: ['/api/instagram-post', '/.netlify/functions/instagram-post'],
  rateLimit: { windowLimit: 2, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
