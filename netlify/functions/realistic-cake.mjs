import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const MAX_BODY_BYTES = 4_500_000;
const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function response(status, body) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch (_) { return false; }
}

function validateImage(dataUrl) {
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Görsel biçimi desteklenmiyor');
  const bytes = Buffer.from(match[2], 'base64').length;
  if (!bytes || bytes > 3_200_000) throw new Error('Görsel boyutu geçersiz');
}

export default async (request) => {
  if (request.method !== 'POST') return response(405, { error: 'Yalnızca POST desteklenir' });
  if (!isSameOrigin(request)) return response(403, { error: 'Geçersiz istek kaynağı' });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return response(413, { error: 'Tasarım görseli çok büyük' });
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    return response(503, { error: 'Yapay zekâ servisi yapılandırılmadı' });
  }

  const store = getStore({ name: 'realistic-cake-jobs', consistency: 'strong' });
  let jobId = '';
  try {
    const body = await request.json();
    validateImage(body.imageDataUrl);
    const designSummary = String(body.designSummary || '').replace(/[\r\n<>]/g, ' ').slice(0, 500);
    jobId = crypto.randomUUID();
    if (!JOB_ID_RE.test(jobId)) throw new Error('İş kimliği oluşturulamadı');

    await store.setJSON(jobId, {
      status: 'queued',
      imageDataUrl: body.imageDataUrl,
      designSummary,
      createdAt: Date.now()
    }, { metadata: { createdAt: Date.now() } });

    const workerUrl = new URL('/api/realistic-cake-worker', request.url);
    const queued = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: new URL(request.url).origin },
      body: JSON.stringify({ jobId }),
      signal: AbortSignal.timeout(8_000)
    });
    if (queued.status !== 202) {
      await store.delete(jobId);
      console.error('realistic-cake queue:', queued.status);
      return response(502, { error: 'Görsel üretimi başlatılamadı. Lütfen tekrar deneyin.' });
    }

    return response(202, { jobId });
  } catch (error) {
    if (jobId) await store.delete(jobId).catch(() => {});
    if (/Görsel/.test(error?.message || '')) return response(400, { error: error.message });
    console.error('realistic-cake start:', error?.message || error);
    return response(500, { error: 'Görsel üretimi başlatılamadı. Lütfen tekrar deneyin.' });
  }
};

export const config = {
  path: ['/api/realistic-cake', '/.netlify/functions/realistic-cake'],
  rateLimit: {
    windowLimit: 2,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
