import { getStore } from '@netlify/blobs';

const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CLOUD_NAME = 'do7gjdvb0';
const UPLOAD_PRESET = 'folder';

async function runJob(jobId, store) {
  const job = await store.get(jobId, { type: 'json' });
  if (!job || !['queued', 'processing'].includes(job.status)) return;
  await store.setJSON(jobId, { status: 'processing', createdAt: job.createdAt || Date.now() });

  const normalizedSourceUrl = job.imageUrl.replace(
    '/image/upload/',
    '/image/upload/w_1536,h_1536,c_limit,q_92,f_jpg/'
  );
  const source = await fetch(normalizedSourceUrl, { signal: AbortSignal.timeout(30_000) });
  if (!source.ok) throw new Error(`source:${source.status}`);
  const bytes = await source.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 16_000_000) throw new Error('source:size');
  const sourceType = 'image/jpeg';

  const prompt = [
    `Bu ${job.category || 'özel tasarım pasta'} fotoğrafını premium bir pastane Instagram paylaşımı için profesyonelce rötuşla.`,
    'Pastanın gerçek şeklini, kat sayısını, renklerini, süslerini, üzerindeki yazıyı ve özgün el işçiliğini aynen koru; yeni süs, yazı, kişi, el veya ürün ekleme.',
    'Işık, beyaz dengesi, netlik ve iştah açıcı doku doğal görünsün. Arka planı zarif, sade, koyu bordo ile sıcak nötr tonlarda stüdyo ortamına dönüştür.',
    'Dikey 2:3 kompozisyon kullan; pasta ortada ve eksiksiz kalsın, üstte logo için temiz bir güvenli alan, altta kısa metin için boşluk bırak.',
    'Logo, filigran, marka adı veya yeni metin üretme. Fotoğraf gerçek bir ürün çekimi gibi olsun; aşırı yapay, plastik veya kusursuz görünmesin.'
  ].join(' ');

  const form = new FormData();
  form.append('model', 'gpt-image-2');
  form.append('image[]', new Blob([bytes], { type: sourceType }), 'pasta.jpg');
  form.append('prompt', prompt);
  form.append('size', '1024x1536');
  form.append('quality', 'medium');
  form.append('output_format', 'jpeg');
  form.append('output_compression', '88');
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
  const generated = await fetch(`${base}/v1/images/edits`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form,
    signal: AbortSignal.timeout(180_000)
  });
  const data = await generated.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!generated.ok || !b64) throw new Error(`OpenAI:${generated.status}:${data?.error?.code || data?.error?.type || 'no_image'}`);

  const cloudForm = new FormData();
  cloudForm.append('file', new Blob([Buffer.from(b64, 'base64')], { type: 'image/jpeg' }), 'instagram-ai.jpg');
  cloudForm.append('upload_preset', UPLOAD_PRESET);
  cloudForm.append('folder', 'instagram-ai');
  cloudForm.append('tags', 'instagram-ai,pastacihani-ai');
  const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: cloudForm, signal: AbortSignal.timeout(40_000)
  });
  const cloud = await uploaded.json();
  if (!uploaded.ok || !cloud.secure_url) throw new Error(`Cloudinary:${uploaded.status}`);
  await store.setJSON(jobId, {
    status: 'completed', imageUrl: cloud.secure_url,
    createdAt: job.createdAt || Date.now(), completedAt: Date.now()
  });
  console.info('instagram artwork completed', { jobId });
}

export default async (request) => {
  const store = getStore({ name: 'instagram-artwork-jobs', consistency: 'strong' });
  let jobId = '';
  try {
    if (request.method !== 'POST') return;
    const body = await request.json();
    jobId = String(body.jobId || '');
    if (!JOB_ID_RE.test(jobId)) return;
    await runJob(jobId, store);
  } catch (error) {
    console.error('instagram artwork worker:', jobId, error?.message || error);
    if (jobId) await store.setJSON(jobId, {
      status: 'failed', error: 'AI rötuş şu anda tamamlanamadı.', failedAt: Date.now()
    }).catch(() => {});
  }
};

export const config = { path: '/api/instagram-artwork-worker', background: true };
