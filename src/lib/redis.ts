import Redis from 'ioredis';

export function getRedisClient() {
  console.log('🟡🟡🟡 - [getRedisClient] called');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl);
  console.log('🟡🟡🟡 - [getRedisClient] return:', client.status);
  return client;
}

export const redisClient = getRedisClient();