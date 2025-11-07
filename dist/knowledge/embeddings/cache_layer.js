/**
 * Three-Tier Embedding Cache
 *
 * Leverages the existing CacheLayer infrastructure for embeddings.
 * Provides L1 (memory), L2 (disk), and L3 (Mnemosyne) caching.
 */
import { CacheLayer } from '../cache/cache_layer.js';
export class ThreeTierEmbeddingCache {
    cacheLayer;
    /**
     * Initialize cache with 'embeddings' namespace
     */
    constructor() {
        this.cacheLayer = new CacheLayer('embeddings');
    }
    /**
     * Initialize cache layers
     * Must be called before using the cache
     */
    async initialize() {
        await this.cacheLayer.initialize();
    }
    /**
     * Retrieve cached embedding
     * Cascades through L1 → L2 → L3 with automatic promotion
     *
     * @param key Cache key (typically SHA256 hash of text)
     * @returns Embedding vector or null if not cached
     */
    async get(key) {
        const cached = await this.cacheLayer.get(key);
        if (cached) {
            // Update hit counter for cache analytics
            cached.hits++;
            await this.cacheLayer.set(key, cached);
            return cached.embedding;
        }
        return null;
    }
    /**
     * Store embedding in cache
     * Writes through to all three layers
     *
     * @param key Cache key
     * @param embedding Embedding vector to cache
     */
    async set(key, embedding) {
        await this.cacheLayer.set(key, {
            embedding,
            timestamp: Date.now(),
            hits: 0
        });
    }
    /**
     * Clear all cached embeddings
     */
    async clear() {
        await this.cacheLayer.clear();
    }
    /**
     * Get cache statistics
     * Useful for monitoring cache hit rates
     */
    getStats() {
        return this.cacheLayer.getStats();
    }
    /**
     * Clean up cache resources
     * Should be called on shutdown
     */
    destroy() {
        this.cacheLayer.destroy();
    }
}
//# sourceMappingURL=cache_layer.js.map