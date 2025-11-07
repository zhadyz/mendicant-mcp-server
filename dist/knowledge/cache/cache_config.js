/**
 * Cache Configuration
 *
 * Configuration constants for three-layer cache architecture:
 * - L1: Memory cache (instant access, session lifetime)
 * - L2: Disk cache (24-hour TTL, persists across restarts)
 * - L3: Mnemosyne cache (90-day TTL, cross-session learning)
 */
export const CACHE_CONFIG = {
    // L1: Memory Cache Configuration
    memory: {
        maxEntries: 100, // LRU eviction after 100 entries
        evictionStrategy: 'lru',
        hitLogging: false // Set true for debugging
    },
    // L2: Disk Cache Configuration
    disk: {
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        cacheDir: '.mendicant', // Directory under user home
        fileName: 'cache_data.json', // Cache file name
        compressionEnabled: false, // Future: enable compression for large caches
        encoding: 'utf-8'
    },
    // L3: Mnemosyne Cache Configuration
    mnemosyne: {
        ttlMs: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
        entityType: 'CacheEntry', // Mnemosyne entity type
        relationPrefix: 'cached_', // Prefix for cache relations
        syncTimeout: 5000, // 5 second timeout for Mnemosyne operations
        retryAttempts: 2, // Retry failed operations twice
        batchSize: 10 // Batch operations for efficiency
    },
    // Refresh Configuration
    refresh: {
        onStartup: true, // Sync from L3 to L1/L2 on startup
        intervalMs: 5 * 60 * 1000, // Periodic refresh every 5 minutes
        backgroundSync: true, // Non-blocking background sync
        autoEvictStale: true // Automatically evict stale entries
    },
    // Logging Configuration
    logging: {
        cacheHits: false, // Log cache hits
        cacheMisses: false, // Log cache misses
        writeOperations: true, // Log write operations
        evictions: true, // Log evictions
        errors: true // Always log errors
    }
};
/**
 * Generate consistent cache key for data storage
 */
export function generateCacheKey(namespace, id) {
    return `${namespace}:${id}`;
}
/**
 * Parse cache key into namespace and id
 */
export function parseCacheKey(key) {
    const parts = key.split(':');
    if (parts.length !== 2)
        return null;
    return {
        namespace: parts[0],
        id: parts[1]
    };
}
/**
 * Check if data is expired based on TTL
 */
export function isExpired(timestamp, ttlMs) {
    return Date.now() - timestamp > ttlMs;
}
/**
 * Calculate expiration timestamp
 */
export function getExpirationTimestamp(ttlMs) {
    return Date.now() + ttlMs;
}
//# sourceMappingURL=cache_config.js.map