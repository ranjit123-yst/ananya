import type { RateLimitResult } from './types';

// In-memory rate limiter for development/fallback.
// In production, use Upstash Redis for distributed rate limiting.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const DAILY_LIMIT = 100;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Hash an IP address for privacy-preserving storage.
 */
export function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(16)}`;
}

/**
 * Get the client IP from request headers.
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return '127.0.0.1';
}

/**
 * Check rate limit for a given IP hash.
 * Returns success status, remaining requests, and reset time.
 */
export async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = rateLimitStore.get(ipHash);

  // Check if we have Upstash configured.
  const upstashUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    return checkUpstashRateLimit(ipHash, upstashUrl, upstashToken);
  }

  // Fallback to in-memory rate limiting.
  if (!existing || now > existing.resetAt) {
    const resetAt = now + DAY_IN_MS;
    rateLimitStore.set(ipHash, { count: 1, resetAt });
    return {
      success: true,
      remaining: DAILY_LIMIT - 1,
      reset: resetAt
    };
  }

  if (existing.count >= DAILY_LIMIT) {
    return {
      success: false,
      remaining: 0,
      reset: existing.resetAt
    };
  }

  existing.count += 1;
  rateLimitStore.set(ipHash, existing);

  return {
    success: true,
    remaining: DAILY_LIMIT - existing.count,
    reset: existing.resetAt
  };
}

/**
 * Check rate limit using Upstash Redis.
 */
async function checkUpstashRateLimit(
  ipHash: string,
  url: string,
  token: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const resetAt = dayEnd.getTime();
  const ttlSeconds = Math.ceil((resetAt - now) / 1000);

  const key = `ratelimit:${ipHash}:${dayStart.toISOString().split('T')[0]}`;

  try {
    // Increment the counter.
    const incrResponse = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const incrData = await incrResponse.json();
    const count = incrData.result as number;

    // Set expiry if this is a new key.
    if (count === 1) {
      await fetch(`${url}/expire/${key}/${ttlSeconds}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    if (count > DAILY_LIMIT) {
      return {
        success: false,
        remaining: 0,
        reset: resetAt
      };
    }

    return {
      success: true,
      remaining: DAILY_LIMIT - count,
      reset: resetAt
    };
  } catch (error) {
    console.error('Upstash rate limit error:', error);
    // Fallback to allowing the request on error.
    return {
      success: true,
      remaining: DAILY_LIMIT,
      reset: resetAt
    };
  }
}

/**
 * Get current rate limit status without incrementing.
 */
export async function getRateLimitStatus(ipHash: string): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = rateLimitStore.get(ipHash);

  if (!existing || now > existing.resetAt) {
    return {
      success: true,
      remaining: DAILY_LIMIT,
      reset: now + DAY_IN_MS
    };
  }

  return {
    success: existing.count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - existing.count),
    reset: existing.resetAt
  };
}
