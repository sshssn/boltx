// @ts-nocheck
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || process.env.KV_URL;

const globalForRedis = global as unknown as {
  redisClient: ReturnType<typeof createClient> | null | undefined;
};

export const redisClient =
  typeof redisUrl === 'string'
    ? globalForRedis.redisClient ?? createClient({ url: redisUrl })
    : null;

if (process.env.NODE_ENV !== 'production' && redisClient) {
  globalForRedis.redisClient = redisClient;
}

if (redisClient && !redisClient.isOpen) {
  redisClient.connect().catch((error) => {
    console.error('Redis connection failed:', error);
  });
}
