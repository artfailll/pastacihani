import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import auth from '../lib/auth.js';

const { requireAdmin } = auth;
const IMAGE_URL_RE = /^https:\/\/res\.cloudinary\.com\/do7gjdvb0\/image\/upload\//;

function response(status, body) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export default async (request) => {
  if (request.method !== 'POST') return response(405, { error: 'Yalnızca POST desteklenir' });
  const unauthorized = requireAdmin({ headers: Object.fromEntries(request.headers.entries()) });
  if (unauthorized) return new Response(unauthorized.body, { status: unauthorized.statusCode, headers: unauthorized.headers });
  if (!process.env.OPENAI_API_KEY) return response(503, { error: 'OpenAI bağlantısı yapılandırılmadı' });
  let jobId = '';
  const store = getStore({ name: 'instagram-artwork-jobs', consistency: 'strong' });
  try {
    const body = await request.json();
    if (!IMAGE_URL_RE.test(body.imageUrl || '')) return response(400, { error: 'Geçersiz görsel adresi' });
    jobId = crypto.randomUUID();
    await store.setJSON(jobId, {
      status: 'queued', imageUrl: body.imageUrl,
      category: String(body.category || 'özel tasarım pasta').replace(/[\r\n<>]/g, ' ').slice(0, 80),
      createdAt: Date.now()
    });
    const queued = await fetch(new URL('/api/instagram-artwork-worker', request.url), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }),
      signal: AbortSignal.timeout(8_000)
    });
    if (queued.status !== 202) throw new Error(`queue:${queued.status}`);
    return response(202, { jobId });
  } catch (error) {
    if (jobId) await store.delete(jobId).catch(() => {});
    console.error('instagram artwork start:', error?.message || error);
    return response(500, { error: 'AI rötuş başlatılamadı' });
  }
};

export const config = {
  path: ['/api/instagram-artwork', '/.netlify/functions/instagram-artwork'],
  rateLimit: { windowLimit: 4, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
