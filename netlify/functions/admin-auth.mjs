import auth from '../lib/auth.js';

const { createAdminToken, safeEqual } = auth;

export default async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Yalnızca POST desteklenir' }, { status: 405 });
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  let originMatches = false;
  try { originMatches = Boolean(origin && host && new URL(origin).host === host); } catch (_) {}
  if (!originMatches) {
    return Response.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.ADMIN_SESSION_SECRET) {
    return Response.json({ error: 'Yönetim girişi henüz yapılandırılmadı' }, { status: 503 });
  }

  let password = '';
  try {
    const body = await request.json();
    password = typeof body.password === 'string' ? body.password : '';
  } catch (_) {
    return Response.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  if (!safeEqual(password, expected)) return Response.json({ error: 'Şifre yanlış' }, { status: 401 });
  return Response.json({ token: createAdminToken(), expiresIn: 8 * 60 * 60 }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
};

export const config = {
  path: ['/api/admin-auth', '/.netlify/functions/admin-auth'],
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
