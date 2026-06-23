// middleware.js – Vercel Edge Middleware for rate-limiting public API endpoints.
// Limits unauthenticated traffic to /api/register, /api/send-email, /api/send-sms
// to 5 submissions per hour per IP using Upstash Redis sliding window.
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/redis';

// 5 requests per hour, sliding window.
const WINDOW_LIMIT = 5;
const WINDOW_MS = '1 h';

export const config = {
  // Only intercept public-facing API routes.
  matcher: ['/api/register', '/api/send-email', '/api/send-sms'],
};

function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

function tooManyRequestsResponse(limit, remaining, reset) {
  return new Response(
    JSON.stringify({
      error: 'Too many registration attempts. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
      },
    }
  );
}

export default async function middleware(req) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Fail-closed in production: if rate-limit envs are missing, REJECT the
  // request so we never accidentally run unprotected. The deployment checklist
  // requires these envs to be set on Vercel.
  const isProd = process.env.VERCEL_ENV === 'production';
  if (!url || !token) {
    if (isProd) {
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable. Please try again later.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Local dev: bypass with a console warning so onboarding is easy.
    console.warn('[middleware] Upstash envs missing; rate limiting disabled (dev only).');
    return;
  }

  const redis = new Redis({ url, token });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(WINDOW_LIMIT, WINDOW_MS),
    analytics: false,
    prefix: 'avnl_rl',
  });

  const ip = getClientIp(req);
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return tooManyRequestsResponse(limit, remaining, reset);
  }
}
