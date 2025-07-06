import { SessionStore } from '@fastify/session';
import { getRedisClient } from './redis';

// Create Redis store for use with @fastify/session
export function createRedisStore(ttl = 86400): SessionStore {
  // console.log('⚪⚪⚪ - [createRedisStore] Initializing Redis session store with TTL:', ttl);
  
  try {
    // Get Redis client using existing utility function
    const client = getRedisClient();

    // Create a simple session store adapter
    // This wraps the Redis client directly, implementing the SessionStore interface
    const store: SessionStore = {
      set: (sessionId, sessionData, callback) => {
        const key = `sess:${sessionId}`;
        const data = JSON.stringify(sessionData);
        client.setex(key, ttl, data)
          .then(() => {
            // console.log(`🟢🟢🟢 - [RedisStore] Saved session: ${sessionId}`);
            callback();
          })
          .catch(err => {
            // console.error(`🔴🔴🔴 - [RedisStore] Error saving session:`, err);
            callback(err);
          });
      },
      get: (sessionId, callback) => {
        const key = `sess:${sessionId}`;
        client.get(key)
          .then(data => {
            if (!data) {
              return callback(null);
            }
            try {
              const session = JSON.parse(data);
              callback(null, session);
            } catch (err) {
              callback(err);
            }
          })
          .catch(callback);
      },
      destroy: (sessionId, callback) => {
        const key = `sess:${sessionId}`;
        client.del(key)
          .then(() => callback(null))
          .catch(err => callback(err));
      }
    };

    // console.log('✅✅✅ - [createRedisStore] Redis session store created successfully');
    return store;
  } catch (err) {
    // console.error('❌❌❌ - [createRedisStore] Failed to create Redis session store:', err);
    throw err;
  }
}
