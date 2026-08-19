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
    const job = await getStore({ name: 'instagram-artwork-jobs', consistency: 'strong' }).get(jobId, { type: 'json' });
    if (!job) return response(404, { error: 'AI rötuş işi bulunamadı' });
    if (job.status === 'completed') return response(200, { status: 'completed', imageUrl: job.imageUrl });
    if (job.status === 'failed') return response(200, { status: 'failed', error: job.error || 'AI rötuş yapılamadı' });
    return response(200, { status: job.status === 'processing' ? 'processing' : 'queued' });
  } catch (error) {
    console.error('instagram artwork status:', error?.message || error);
    return response(500, { error: 'AI rötuş durumu alınamadı' });
  }
};

export const config = {
  path: ['/api/instagram-artwork-status', '/.netlify/functions/instagram-artwork-status'],
  rateLimit: { windowLimit: 150, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
