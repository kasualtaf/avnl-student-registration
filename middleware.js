import { Ratelimit } from '@upstash/redis';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Allow 5 requests per hour
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: false,
});

export const config = {
  matcher: '/api/register',
};

export default async function middleware(req) {
  // Only rate limit if redis env variables are configured
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return; // Proceed without rate limiting if not setup
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (req.url.includes('/api/register')) {
    const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Too many registration attempts. Please try again later." }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
  }
}
