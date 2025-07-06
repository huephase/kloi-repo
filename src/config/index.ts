import fastifyConfig from './fastify';
import { redisClient, getRedisClient } from '../lib/redis';

// console.log('🟡🟡🟡 - [config/index] fastifyConfig loaded:', fastifyConfig);
// console.log('🟡🟡🟡 - [config/index] redisClient loaded:', redisClient);
// console.log('🟡🟡🟡 - [config/index] getRedisClient loaded:', getRedisClient);

export { fastifyConfig, redisClient, getRedisClient };

export function logLoadedConfigKeys() {
  console.log('🟡🟡🟡 - [config/index] Loaded config keys:', Object.keys({ fastifyConfig, redisClient, getRedisClient }));
}
