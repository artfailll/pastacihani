import { getStore } from '@netlify/blobs';

const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function response(status, body) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export default async (request) => {
  if (request.method !== 'GET') return response(405, { error: 'Yalnızca GET desteklenir' });
  const jobId = new URL(request.url).searchParams.get('id') || '';
  if (!JOB_ID_RE.test(jobId)) return response(400, { error: 'Geçersiz iş kimliği' });

  try {
    const store = getStore({ name: 'realistic-cake-jobs', consistency: 'strong' });
    const job = await store.get(jobId, { type: 'json' });
    if (!job) return response(404, { error: 'Görsel işi bulunamadı' });
    if (job.status === 'completed') return response(200, { status: 'completed', imageUrl: job.imageUrl });
    if (job.status === 'failed') return response(200, { status: 'failed', error: job.error || 'Görsel üretilemedi' });
    return response(200, { status: job.status === 'processing' ? 'processing' : 'queued' });
  } catch (error) {
    console.error('realistic-cake status:', error?.message || error);
    return response(500, { error: 'Görsel durumu alınamadı' });
  }
};

export const config = {
  path: ['/api/realistic-cake-status', '/.netlify/functions/realistic-cake-status'],
  rateLimit: {
    windowLimit: 90,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
