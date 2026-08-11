const CLOUD_NAME = 'do7gjdvb0';
const UPLOAD_PRESET = 'folder';
const MAX_BODY_BYTES = 4_500_000;
const GENERATION_TIMEOUT_MS = 19_000;
const UPLOAD_TIMEOUT_MS = 8_000;

function response(status, body) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch (_) { return false; }
}

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
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS)
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
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    }),
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS)
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

export default async (request) => {
  if (request.method !== 'POST') return response(405, { error: 'Yalnızca POST desteklenir' });
  if (!isSameOrigin(request)) return response(403, { error: 'Geçersiz istek kaynağı' });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return response(413, { error: 'Tasarım görseli çok büyük' });

  const openaiKey = process.env.OPENAI_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!openaiKey && !geminiKey) return response(503, { error: 'Yapay zekâ servisi yapılandırılmadı' });

  try {
    const startedAt = Date.now();
    const body = await request.json();
    const { buffer, type } = parseImage(body.imageDataUrl);
    const designSummary = String(body.designSummary || '').replace(/[\r\n<>]/g, ' ').slice(0, 500);

    const prompt = [
      'Transform this 3D cake design into a photorealistic product photograph of a real, professionally handmade celebration cake.',
      'Preserve the exact cake shape, number of tiers, proportions, icing colors, decorations, topper, candles, fruit, flowers, drip details and any short cake inscription visible in the reference.',
      'Use realistic edible materials, subtle handmade imperfections, natural buttercream or fondant texture and accurate shadows.',
      'Place the cake centered on a simple elegant cake stand against a warm cream studio background, straight-on three-quarter product photography, soft natural light, premium bakery aesthetic.',
      'Do not add people, hands, packaging, logos, watermarks, extra text, extra decorations or extra cake tiers.',
      designSummary ? `Design notes: ${designSummary}` : ''
    ].filter(Boolean).join(' ');

    let generated;
    try {
      // Kişisel OpenAI anahtarı varsa GPT Image 2; Netlify'ın ağ geçidi anahtarıysa
      // görüntü destekli Gemini yedeği kullanılır. İki durumda da sırlar yalnızca sunucudadır.
      if (openaiKey.startsWith('sk-')) generated = await generateWithOpenAI({ apiKey: openaiKey, buffer, type, prompt });
      else if (geminiKey) generated = await generateWithGemini({ apiKey: geminiKey, buffer, type, prompt });
      else throw new Error('Uygun görsel modeli bulunamadı');
    } catch (generationError) {
      console.error('realistic-cake generation:', generationError.message);
      if (generationError?.name === 'TimeoutError') {
        return response(504, { error: 'Görsel üretimi bu denemede uzun sürdü. Lütfen hemen tekrar deneyin.' });
      }
      return response(502, { error: 'Gerçek pasta görseli şu anda üretilemedi. Lütfen biraz sonra tekrar deneyin.' });
    }

    console.info('realistic-cake generated', { durationMs: Date.now() - startedAt });

    const cloudForm = new FormData();
    const outputExt = generated.mimeType.includes('png') ? 'png' : 'jpg';
    cloudForm.append('file', new Blob([Buffer.from(generated.image, 'base64')], { type: generated.mimeType }), `gercek-pasta.${outputExt}`);
    cloudForm.append('upload_preset', UPLOAD_PRESET);
    cloudForm.append('folder', 'ai-designs');
    cloudForm.append('tags', 'ai-tasarim');

    const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST', body: cloudForm, signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
    });
    const cloud = await uploaded.json();
    if (!uploaded.ok || !cloud.secure_url) {
      console.error('realistic-cake Cloudinary:', uploaded.status, cloud?.error?.message);
      return response(502, { error: 'Görsel üretildi ancak kaydedilemedi. Lütfen tekrar deneyin.' });
    }

    console.info('realistic-cake completed', { durationMs: Date.now() - startedAt });
    return response(200, { imageUrl: cloud.secure_url });
  } catch (error) {
    if (error?.name === 'TimeoutError') return response(504, { error: 'Görsel üretimi uzun sürdü. Lütfen tekrar deneyin.' });
    if (/Görsel/.test(error?.message || '')) return response(400, { error: error.message });
    console.error('realistic-cake:', error);
    return response(500, { error: 'Görsel üretilirken beklenmeyen bir hata oluştu' });
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
