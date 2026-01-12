// 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Redis-based rate limiter utility
// Centralized rate limiting using Redis for multi-instance support

import { getRedisClient } from './redis';

/**
 * 🟡🟡🟡 - [RATE LIMITING] Check if request is within rate limit
 * Uses Redis to store rate limit counters with TTL for automatic expiration
 * This ensures rate limiting works across multiple server instances
 * 
 * @param key - Unique key for rate limiting (e.g., 'admin-login:192.168.1.1')
 * @param windowMs - Time window in milliseconds (e.g., 15 minutes = 900000)
 * @param maxAttempts - Maximum number of attempts allowed in the window
 * @returns Object with allowed status, resetTime, and optional retryAfter
 */
export async function checkRateLimit(
  key: string,
  windowMs: number,
  maxAttempts: number
): Promise<{ allowed: boolean; resetTime: number; retryAfter?: number }> {
  try {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Get Redis client
    const client = getRedisClient();
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Get current count from Redis
    const countStr = await client.get(redisKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Calculate reset time
    const resetTime = now + windowMs;
    
    if (count >= maxAttempts) {
      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Rate limit exceeded
      // Get TTL to calculate retryAfter
      const ttl = await client.ttl(redisKey);
      const retryAfter = ttl > 0 ? ttl : Math.ceil(windowMs / 1000);
      
      console.warn(`❗❗❗ - [RATE LIMITING] Rate limit exceeded for key: ${key}, count: ${count}/${maxAttempts}`);
      
      return {
        allowed: false,
        resetTime: now + (ttl > 0 ? ttl * 1000 : windowMs),
        retryAfter
      };
    }
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Within rate limit
    console.log(`✅✅✅ - [RATE LIMITING] Rate limit check passed for key: ${key}, count: ${count}/${maxAttempts}`);
    
    return {
      allowed: true,
      resetTime
    };
  } catch (error) {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] On Redis error, allow request but log error
    // This prevents Redis failures from blocking legitimate requests
    console.error('❗❗❗ - [RATE LIMITING] Redis error during rate limit check:', error);
    console.log('🟡🟡🟡 - [RATE LIMITING] Allowing request due to Redis error (fail-open)');
    
    return {
      allowed: true,
      resetTime: Date.now() + windowMs
    };
  }
}

/**
 * 🟡🟡🟡 - [RATE LIMITING] Increment rate limit counter
 * Increments the counter for a given key and sets TTL if key doesn't exist
 * 
 * @param key - Unique key for rate limiting
 * @param windowMs - Time window in milliseconds
 */
export async function incrementRateLimit(key: string, windowMs: number): Promise<void> {
  try {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Get Redis client
    const client = getRedisClient();
    const redisKey = `ratelimit:${key}`;
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Increment counter and set TTL
    // INCR increments the key, and if it doesn't exist, creates it with value 1
    // EXPIRE sets the TTL in seconds
    const count = await client.incr(redisKey);
    const ttlSeconds = Math.ceil(windowMs / 1000);
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Set TTL only if this is the first increment
    if (count === 1) {
      await client.expire(redisKey, ttlSeconds);
    }
    
    console.log(`🟡🟡🟡 - [RATE LIMITING] Incremented rate limit for key: ${key}, new count: ${count}`);
  } catch (error) {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Log error but don't throw
    // Rate limiting is a security feature but shouldn't break the application
    console.error('❗❗❗ - [RATE LIMITING] Redis error during rate limit increment:', error);
  }
}

/**
 * 🟡🟡🟡 - [RATE LIMITING] Reset rate limit counter
 * Removes the rate limit entry for a given key (e.g., on successful login)
 * 
 * @param key - Unique key for rate limiting
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Get Redis client
    const client = getRedisClient();
    const redisKey = `ratelimit:${key}`;
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Delete the rate limit key
    await client.del(redisKey);
    
    console.log(`✅✅✅ - [RATE LIMITING] Reset rate limit for key: ${key}`);
  } catch (error) {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Log error but don't throw
    console.error('❗❗❗ - [RATE LIMITING] Redis error during rate limit reset:', error);
  }
}
