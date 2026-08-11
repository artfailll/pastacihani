const crypto = require('crypto');

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function json(statusCode, body) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(body) };
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sameOrigin(event) {
  const origin = event.headers?.origin;
  const host = event.headers?.host || event.headers?.['x-forwarded-host'];
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch (_) {
    return false;
  }
}

function signToken(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET tanımlı değil');
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function createAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ role: 'admin', iat: now, exp: now + (8 * 60 * 60) });
}

function verifyAdminToken(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || typeof token !== 'string') return false;
  const [encoded, signature, extra] = token.split('.');
  if (!encoded || !signature || extra) return false;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (!safeEqual(signature, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.role === 'admin' && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch (_) {
    return false;
  }
}

function requireAdmin(event) {
  if (!sameOrigin(event)) return json(403, { error: 'Geçersiz istek kaynağı' });
  const authorization = event.headers?.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return verifyAdminToken(token) ? null : json(401, { error: 'Oturum geçersiz veya süresi dolmuş' });
}

module.exports = {
  createAdminToken,
  json,
  requireAdmin,
  safeEqual,
  sameOrigin
};
