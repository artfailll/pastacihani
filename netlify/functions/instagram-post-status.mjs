import { getStore } from '@netlify/blobs';
import auth from '../lib/auth.js';

const { requireAdmin } = auth;
const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function response(status, body) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export default async (request) => {
  if (request.method !== 'POST') return response(405, { error: 'Yalnızca POST desteklenir' });
  const unauthorized = requireAdmin({ headers: Object.fromEntries(request.headers.entries()) });
  if (unauthorized) return new Response(unauthorized.body, { status: unauthorized.statusCode, headers: unauthorized.headers });
  const { jobId = '' } = await request.json().catch(() => ({}));
  if (!JOB_ID_RE.test(jobId)) return response(400, { error: 'Geçersiz iş kimliği' });
  try {
    const store = getStore({ name: 'instagram-publish-jobs', consistency: 'strong' });
    const job = await store.get(jobId, { type: 'json' });
    if (!job) return response(404, { error: 'Paylaşım işi bulunamadı' });
    if (job.status === 'completed') return response(200, { status: 'completed', reel: true, story: true });
    if (job.status === 'failed') return response(200, { status: 'failed', error: job.error || 'Reel yayınlanamadı' });
    return response(200, { status: job.status === 'processing' ? 'processing' : 'queued' });
  } catch (error) {
    console.error('instagram status:', error?.message || error);
    return response(500, { error: 'Paylaşım durumu alınamadı' });
  }
};

export const config = {
  path: ['/api/instagram-post-status', '/.netlify/functions/instagram-post-status'],
  rateLimit: { windowLimit: 150, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
