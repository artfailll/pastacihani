const { json, requireAdmin } = require('../lib/auth');

// AI Caption: OpenAI ile fotoğrafa bakıp Instagram caption üretir
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Yalnızca POST desteklenir' });
  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return json(503, { error: 'Yapay zekâ servisi yapılandırılmadı' });

  try {
    const { imageUrl, category } = JSON.parse(event.body || '{}');
    if (!/^https:\/\/res\.cloudinary\.com\/do7gjdvb0\//.test(imageUrl || '')) {
      return json(400, { error: 'Geçersiz görsel adresi' });
    }

    const today = new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'full', timeZone: 'Europe/Istanbul'
    }).format(new Date());
    const safeCategory = String(category || 'özel tasarım pasta').replace(/[\r\n<>]/g, ' ').slice(0, 80);
    const prompt = [
      `Bugün ${today}. Sen Pastacihanı'nın deneyimli Instagram içerik yazarısın.`,
      `Fotoğraftaki ${safeCategory} pastasını dikkatle incele; yalnızca gerçekten gördüğün renk, süsleme, tema ve detayları kullan.`,
      'Türkçe, samimi, iştah açıcı ve 850-1400 karakter arasında bir Instagram açıklaması yaz.',
      'İlk satır kaydırmayı durduracak kısa ve merak uyandıran bir giriş olsun; yanıltıcı clickbait kullanma.',
      'Pastaya ve kutlamaya özgü, sıcak ve inandırıcı küçük bir hikâye kur. Kişi adı, yaş, sipariş nedeni veya müşteri sözü uydurma.',
      'Türkiye\'deki güncel mevsimsel ya da kültürel havaya yalnızca doğal biçimde uyuyorsa değin. Siyasi, trajik veya hassas gündem kullanma; güncel olduğu belirsiz olay, kişi, akım ya da haber uydurma.',
      'Kısa paragraflar ve ölçülü emoji kullan. Sonlara doğru takipçiye pastayı kiminle paylaşacağını veya en sevdiği detayı sor; kaydetme ya da paylaşma çağrısını doğal biçimde ekle.',
      'Teslimatı yalnızca Silivri ve çevresi olarak anlat. Sonunda ayrı satırda "Sipariş: 0554 810 63 01" yaz.',
      'En fazla 5 hashtag kullan. Bunlardan biri mutlaka #pastacihani, biri #silivripasta olsun; kalanlar sadece fotoğraftaki pasta ve kutlama türüyle ilgili olsun. Alakasız #fyp, #viral veya #kesfet etiketleri kullanma.',
      'Sadece yayımlanacak açıklamayı yaz; başlık, analiz veya tırnak işareti ekleme.'
    ].join(' ');

    const openaiBase = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
    const res = await fetch(`${openaiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 750,
        temperature: 0.85
      })
    });
    const data = await res.json();
    const caption = data.choices?.[0]?.message?.content?.trim();
    if (caption) return json(200, { caption });
    return json(502, { error: 'Açıklama üretilemedi' });
  } catch (err) {
    console.error('ai-caption:', err);
    return json(500, { error: 'Açıklama üretilirken bir hata oluştu' });
  }
};
