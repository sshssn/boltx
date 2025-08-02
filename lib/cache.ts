// Simple in-memory caching layer for boltX

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of cache entries

  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    // Clean up expired entries first
    this.cleanup();

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new Cache();

// Cache keys for common operations
export const CACHE_KEYS = {
  USER: (email: string) => `user:${email}`,
  CHAT: (id: string) => `chat:${id}`,
  CHATS: (userId: string) => `chats:${userId}`,
  MESSAGES: (chatId: string) => `messages:${chatId}`,
  DOCUMENTS: (userId: string) => `documents:${userId}`,
  MEMORY: (userId: string) => `memory:${userId}`,
  USAGE: (userId: string, date: string) => `usage:${userId}:${date}`,
} as const;

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  USER: 5 * 60 * 1000, // 5 minutes
  CHAT: 2 * 60 * 1000, // 2 minutes
  CHATS: 1 * 60 * 1000, // 1 minute
  MESSAGES: 30 * 1000, // 30 seconds
  DOCUMENTS: 5 * 60 * 1000, // 5 minutes
  MEMORY: 10 * 60 * 1000, // 10 minutes
  USAGE: 2 * 60 * 1000, // 2 minutes
} as const;

// Utility functions for common caching patterns
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CACHE_TTL.USER
): Promise<T> => {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
};

export const invalidateCache = (pattern: string): void => {
  // Simple pattern matching for cache invalidation
  // This could be enhanced with more sophisticated pattern matching
  if (pattern.includes('*')) {
    // For now, just clear all cache if pattern contains wildcard
    cache.clear();
  } else {
    cache.delete(pattern);
  }
};

// Cache middleware for API routes
export const cacheMiddleware = (ttl: number = CACHE_TTL.USER) => {
  return async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    return withCache(key, fn, ttl);
  };
}; 