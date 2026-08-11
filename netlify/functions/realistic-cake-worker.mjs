import { getStore } from '@netlify/blobs';

const CLOUD_NAME = 'do7gjdvb0';
const UPLOAD_PRESET = 'folder';
const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function parseImage(dataUrl) {
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Görsel biçimi desteklenmiyor');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 3_200_000) throw new Error('Görsel boyutu geçersiz');
  return { buffer, type: match[1] === 'png' ? 'image/png' : 'image/jpeg' };
}

async function generateWithOpenAI({ apiKey, buffer, type, prompt }) {
  const form = new FormData();
  form.append('model', 'gpt-image-2');
  form.append('image[]', new Blob([buffer], { type }), `pastacihani-tasarim.${type === 'image/png' ? 'png' : 'jpg'}`);
  form.append('prompt', prompt);
  form.append('size', '1024x1024');
  form.append('quality', 'medium');
  form.append('output_format', 'jpeg');
  form.append('output_compression', '88');

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
  const result = await fetch(`${baseUrl}/v1/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(150_000)
  });
  const data = await result.json();
  const image = data?.data?.[0]?.b64_json;
  if (!result.ok || !image) throw new Error(`OpenAI:${result.status}:${data?.error?.code || data?.error?.type || 'no_image'}`);
  return { image, mimeType: 'image/jpeg' };
}

async function generateWithGemini({ apiKey, buffer, type, prompt }) {
  const baseUrl = (process.env.GOOGLE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
  const result = await fetch(`${baseUrl}/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: type, data: buffer.toString('base64') } }
        ]
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    }),
    signal: AbortSignal.timeout(150_000)
  });
  const data = await result.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = [...parts].reverse().find((part) => part.inlineData?.data || part.inline_data?.data);
  const inline = imagePart?.inlineData || imagePart?.inline_data;
  if (!result.ok || !inline?.data) {
    const detail = String(data?.error?.message || data?.error?.status || data?.promptFeedback?.blockReason || 'no_image').slice(0, 300);
    throw new Error(`Gemini:${result.status}:${detail}`);
  }
  return { image: inline.data, mimeType: inline.mimeType || inline.mime_type || 'image/png' };
}

async function runJob(jobId, store) {
  const startedAt = Date.now();
  const job = await store.get(jobId, { type: 'json' });
  if (!job || !['queued', 'processing'].includes(job.status)) return;

  const { buffer, type } = parseImage(job.imageDataUrl);
  await store.setJSON(jobId, { status: 'processing', createdAt: job.createdAt || Date.now() });

  const prompt = [
    'Transform this 3D cake design into a photorealistic product photograph of a real, professionally handmade celebration cake.',
    'Preserve the exact cake shape, number of tiers, proportions, icing colors, decorations, topper, candles, fruit, flowers, drip details and any short cake inscription visible in the reference.',
    'Use realistic edible materials, subtle handmade imperfections, natural buttercream or fondant texture and accurate shadows.',
    'Place the cake centered on a simple elegant cake stand against a warm cream studio background, straight-on three-quarter product photography, soft natural light, premium bakery aesthetic.',
    'Do not add people, hands, packaging, logos, watermarks, extra text, extra decorations or extra cake tiers.',
    job.designSummary ? `Design notes: ${job.designSummary}` : ''
  ].filter(Boolean).join(' ');

  const openaiKey = process.env.OPENAI_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  let generated;
  if (openaiKey.startsWith('sk-')) generated = await generateWithOpenAI({ apiKey: openaiKey, buffer, type, prompt });
  else if (geminiKey) generated = await generateWithGemini({ apiKey: geminiKey, buffer, type, prompt });
  else throw new Error('Uygun görsel modeli bulunamadı');

  console.info('realistic-cake generated', { jobId, durationMs: Date.now() - startedAt });
  const cloudForm = new FormData();
  const outputExt = generated.mimeType.includes('png') ? 'png' : 'jpg';
  cloudForm.append('file', new Blob([Buffer.from(generated.image, 'base64')], { type: generated.mimeType }), `gercek-pasta.${outputExt}`);
  cloudForm.append('upload_preset', UPLOAD_PRESET);
  cloudForm.append('folder', 'ai-designs');
  cloudForm.append('tags', 'ai-tasarim');

  const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: cloudForm, signal: AbortSignal.timeout(40_000)
  });
  const cloud = await uploaded.json();
  if (!uploaded.ok || !cloud.secure_url) throw new Error(`Cloudinary:${uploaded.status}:${cloud?.error?.message || 'no_url'}`);

  await store.setJSON(jobId, {
    status: 'completed',
    imageUrl: cloud.secure_url,
    createdAt: job.createdAt || Date.now(),
    completedAt: Date.now()
  });
  console.info('realistic-cake completed', { jobId, durationMs: Date.now() - startedAt });
}

export default async (request) => {
  let jobId = '';
  const store = getStore({ name: 'realistic-cake-jobs', consistency: 'strong' });
  try {
    if (request.method !== 'POST') return;
    const body = await request.json();
    jobId = String(body.jobId || '');
    if (!JOB_ID_RE.test(jobId)) return;
    await runJob(jobId, store);
  } catch (error) {
    console.error('realistic-cake worker:', jobId, error?.message || error);
    if (jobId) {
      await store.setJSON(jobId, {
        status: 'failed',
        error: 'Gerçek pasta görseli şu anda üretilemedi. Lütfen tekrar deneyin.',
        failedAt: Date.now()
      }).catch(() => {});
    }
  }
};

export const config = {
  path: '/api/realistic-cake-worker',
  background: true
};
