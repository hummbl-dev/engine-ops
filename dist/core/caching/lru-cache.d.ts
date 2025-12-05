export interface CacheConfig {
  maxSize?: number;
  ttlMs?: number;
  enableStats?: boolean;
}
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}
/**
 * LRU (Least Recently Used) Cache implementation
 * Provides O(1) get and set operations with automatic eviction
 */
export declare class LRUCache<K, V> {
  private cache;
  private maxSize;
  private ttlMs;
  private enableStats;
  private stats;
  constructor(config?: CacheConfig);
  /**
   * Get value from cache
   */
  get(key: K): V | undefined;
  /**
   * Set value in cache
   */
  set(key: K, value: V): void;
  /**
   * Check if key exists in cache
   */
  has(key: K): boolean;
  /**
   * Delete key from cache
   */
  delete(key: K): boolean;
  /**
   * Clear all entries
   */
  clear(): void;
  /**
   * Get cache statistics
   */
  getStats(): CacheStats;
  /**
   * Get current cache size
   */
  size(): number;
  /**
   * Get cache hit rate
   */
  getHitRate(): number;
}
//# sourceMappingURL=lru-cache.d.ts.map
