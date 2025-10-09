import { LRUCache } from 'lru-cache';
import type { CacheConfig, CacheStats } from './types';

/**
 * Query cache with LRU eviction and memory limits
 */
export class QueryCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: LRUCache<string, any>;
  private stats = { hits: 0, misses: 0 };
  private readonly keyPrefix: string;
  private readonly enabled: boolean;

  constructor(config: CacheConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.keyPrefix = config.keyPrefix || 'query';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.cache = new LRUCache<string, any>({
      max: 1000, // Maximum number of entries
      maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB default
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sizeCalculation: (value: any) => {
        try {
          return JSON.stringify(value).length * 2; // UTF-16 estimation
        } catch {
          return 1000; // Fallback for non-serializable objects
        }
      },
      dispose: () => {
        // Cache eviction callback - no logging needed
      },
    });
  }

  /**
   * Store value in cache
   */
  set<T>(key: string, value: T): void {
    if (!this.enabled) return;

    const fullKey = `${this.keyPrefix}:${key}`;
    this.cache.set(fullKey, value);
  }

  /**
   * Retrieve value from cache
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const fullKey = `${this.keyPrefix}:${key}`;
    const value = this.cache.get(fullKey);

    if (value !== undefined) {
      this.stats.hits++;
      return value as T;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    if (!this.enabled) return false;

    const fullKey = `${this.keyPrefix}:${key}`;
    return this.cache.delete(fullKey);
  }

  /**
   * Clear entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    if (!this.enabled) return;

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      currentSize: this.cache.calculatedSize || 0,
      entryCount: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
    };
  }
}

let globalCache: QueryCache | null = null;

/**
 * Get or create global shared cache instance
 */
export function getGlobalCache(config?: CacheConfig): QueryCache {
  if (!globalCache) {
    globalCache = new QueryCache({
      maxSize: 50 * 1024 * 1024, // 50MB total for all models
      ttl: 5 * 60 * 1000, // 5 minutes
      keyPrefix: 'global',
      ...config,
    });
  }
  return globalCache;
}

/**
 * Reset global cache (useful for testing)
 */
export function resetGlobalCache(): void {
  globalCache = null;
}
