// @ts-nocheck
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForRedis = global as unknown as {
  redisClient: ReturnType<typeof createClient> | undefined;
};

export const redisClient =
  globalForRedis.redisClient ?? createClient({ url: redisUrl });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redisClient;
}

if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error);
}
