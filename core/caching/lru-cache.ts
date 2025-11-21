/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

interface CacheEntry<T> {
    value: T;
    timestamp: number;
    hits: number;
}

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
export class LRUCache<K, V> {
    private cache: Map<K, CacheEntry<V>>;
    private maxSize: number;
    private ttlMs: number;
    private enableStats: boolean;
    private stats: CacheStats;

    constructor(config: CacheConfig = {}) {
        this.maxSize = config.maxSize ?? 100;
        this.ttlMs = config.ttlMs ?? 300000; // 5 minutes default
        this.enableStats = config.enableStats ?? true;
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
            evictions: 0
        };
    }

    /**
     * Get value from cache
     */
    public get(key: K): V | undefined {
        const entry = this.cache.get(key);

        if (!entry) {
            if (this.enableStats) this.stats.misses++;
            return undefined;
        }

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            if (this.enableStats) {
                this.stats.misses++;
                this.stats.size = this.cache.size;
            }
            return undefined;
        }

        // Update access time and hit count
        entry.timestamp = Date.now();
        entry.hits++;

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        if (this.enableStats) this.stats.hits++;
        return entry.value;
    }

    /**
     * Set value in cache
     */
    public set(key: K, value: V): void {
        // Remove if exists (to update position)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
                if (this.enableStats) this.stats.evictions++;
            }
        }

        // Add new entry
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0
        });

        if (this.enableStats) this.stats.size = this.cache.size;
    }

    /**
     * Check if key exists in cache
     */
    public has(key: K): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            if (this.enableStats) this.stats.size = this.cache.size;
            return false;
        }

        return true;
    }

    /**
     * Delete key from cache
     */
    public delete(key: K): boolean {
        const result = this.cache.delete(key);
        if (result && this.enableStats) {
            this.stats.size = this.cache.size;
        }
        return result;
    }

    /**
     * Clear all entries
     */
    public clear(): void {
        this.cache.clear();
        if (this.enableStats) {
            this.stats.size = 0;
        }
    }

    /**
     * Get cache statistics
     */
    public getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get current cache size
     */
    public size(): number {
        return this.cache.size;
    }

    /**
     * Get cache hit rate
     */
    public getHitRate(): number {
        const total = this.stats.hits + this.stats.misses;
        return total === 0 ? 0 : this.stats.hits / total;
    }
}
