import { LRUCache } from 'lru-cache';
import { CacheEntry, OffersResponse } from './types';
import { getConfig } from '../config';

// In-memory LRU cache
let memoryCache: LRUCache<string, CacheEntry> | null = null;

function getMemoryCache(): LRUCache<string, CacheEntry> {
  if (!memoryCache) {
    memoryCache = new LRUCache<string, CacheEntry>({
      max: 500, // max items
      ttl: 30 * 60 * 1000, // 30 minutes in ms
      allowStale: false,
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    });
  }
  return memoryCache;
}

// Redis cache adapter (if available)
async function getRedisClient() {
  const config = getConfig();
  if (!config.cache.redisUrl) return null;
  
  try {
    // Dynamically import Redis only if needed
    const { createClient } = await import('redis');
    const client = createClient({ url: config.cache.redisUrl });
    await client.connect();
    return client;
  } catch (error) {
    console.warn('Redis connection failed, falling back to memory cache:', error);
    return null;
  }
}

export async function getCache(key: string): Promise<CacheEntry | null> {
  const config = getConfig();
  
  if (config.cache.provider === 'redis') {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const data = await redis.get(key);
        if (data) {
          const parsed = JSON.parse(data) as CacheEntry;
          // Check if expired
          const now = Date.now();
          const ttlMs = config.cache.ttlMinutes * 60 * 1000;
          if (now - parsed.refreshedAt < ttlMs) {
            return parsed;
          } else {
            // Expired, delete it
            await redis.del(key);
          }
        }
        await redis.disconnect();
      }
    } catch (error) {
      console.warn('Redis get error, falling back to memory:', error);
    }
  }
  
  // Fallback to memory cache
  const cache = getMemoryCache();
  return cache.get(key) || null;
}

export async function setCache(key: string, data: OffersResponse, ttlMs?: number): Promise<void> {
  const config = getConfig();
  const actualTtlMs = ttlMs || (config.cache.ttlMinutes * 60 * 1000);
  
  const cacheEntry: CacheEntry = {
    offers: data.offers || [],
    refreshedAt: Date.now(),
    lastRefreshedAt: data.lastRefreshedAt || new Date().toISOString(),
  };
  
  if (config.cache.provider === 'redis') {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const ttlSeconds = Math.floor(actualTtlMs / 1000);
        await redis.setEx(key, ttlSeconds, JSON.stringify(cacheEntry));
        await redis.disconnect();
        return;
      }
    } catch (error) {
      console.warn('Redis set error, falling back to memory:', error);
    }
  }
  
  // Fallback to memory cache
  const cache = getMemoryCache();
  cache.set(key, cacheEntry, { ttl: actualTtlMs });
}

export async function deleteCache(key: string): Promise<void> {
  const config = getConfig();
  
  if (config.cache.provider === 'redis') {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(key);
        await redis.disconnect();
      }
    } catch (error) {
      console.warn('Redis delete error:', error);
    }
  }
  
  // Also delete from memory cache
  const cache = getMemoryCache();
  cache.delete(key);
}

export async function clearCache(): Promise<void> {
  const config = getConfig();
  
  if (config.cache.provider === 'redis') {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.flushAll();
        await redis.disconnect();
      }
    } catch (error) {
      console.warn('Redis clear error:', error);
    }
  }
  
  // Also clear memory cache
  const cache = getMemoryCache();
  cache.clear();
}

export function getCacheStats() {
  const cache = getMemoryCache();
  return {
    size: cache.size,
    max: cache.max,
    calculatedSize: cache.calculatedSize,
  };
}