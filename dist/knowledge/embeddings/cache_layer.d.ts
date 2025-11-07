/**
 * Three-Tier Embedding Cache
 *
 * Leverages the existing CacheLayer infrastructure for embeddings.
 * Provides L1 (memory), L2 (disk), and L3 (Mnemosyne) caching.
 */
import type { EmbeddingCache } from './types.js';
export declare class ThreeTierEmbeddingCache implements EmbeddingCache {
    private cacheLayer;
    /**
     * Initialize cache with 'embeddings' namespace
     */
    constructor();
    /**
     * Initialize cache layers
     * Must be called before using the cache
     */
    initialize(): Promise<void>;
    /**
     * Retrieve cached embedding
     * Cascades through L1 → L2 → L3 with automatic promotion
     *
     * @param key Cache key (typically SHA256 hash of text)
     * @returns Embedding vector or null if not cached
     */
    get(key: string): Promise<number[] | null>;
    /**
     * Store embedding in cache
     * Writes through to all three layers
     *
     * @param key Cache key
     * @param embedding Embedding vector to cache
     */
    set(key: string, embedding: number[]): Promise<void>;
    /**
     * Clear all cached embeddings
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     * Useful for monitoring cache hit rates
     */
    getStats(): import("../cache/cache_layer.js").CacheStats;
    /**
     * Clean up cache resources
     * Should be called on shutdown
     */
    destroy(): void;
}
//# sourceMappingURL=cache_layer.d.ts.map