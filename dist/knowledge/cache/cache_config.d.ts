/**
 * Cache Configuration
 *
 * Configuration constants for three-layer cache architecture:
 * - L1: Memory cache (instant access, session lifetime)
 * - L2: Disk cache (24-hour TTL, persists across restarts)
 * - L3: Mnemosyne cache (90-day TTL, cross-session learning)
 */
export declare const CACHE_CONFIG: {
    readonly memory: {
        readonly maxEntries: 100;
        readonly evictionStrategy: "lru";
        readonly hitLogging: false;
    };
    readonly disk: {
        readonly ttlMs: number;
        readonly cacheDir: ".mendicant";
        readonly fileName: "cache_data.json";
        readonly compressionEnabled: false;
        readonly encoding: "utf-8";
    };
    readonly mnemosyne: {
        readonly ttlMs: number;
        readonly entityType: "CacheEntry";
        readonly relationPrefix: "cached_";
        readonly syncTimeout: 5000;
        readonly retryAttempts: 2;
        readonly batchSize: 10;
    };
    readonly refresh: {
        readonly onStartup: true;
        readonly intervalMs: number;
        readonly backgroundSync: true;
        readonly autoEvictStale: true;
    };
    readonly logging: {
        readonly cacheHits: false;
        readonly cacheMisses: false;
        readonly writeOperations: true;
        readonly evictions: true;
        readonly errors: true;
    };
};
/**
 * Generate consistent cache key for data storage
 */
export declare function generateCacheKey(namespace: string, id: string): string;
/**
 * Parse cache key into namespace and id
 */
export declare function parseCacheKey(key: string): {
    namespace: string;
    id: string;
} | null;
/**
 * Check if data is expired based on TTL
 */
export declare function isExpired(timestamp: number, ttlMs: number): boolean;
/**
 * Calculate expiration timestamp
 */
export declare function getExpirationTimestamp(ttlMs: number): number;
/**
 * LRU Cache Node for memory layer
 */
export interface LRUNode<T> {
    key: string;
    value: T;
    timestamp: number;
    prev: LRUNode<T> | null;
    next: LRUNode<T> | null;
}
/**
 * Cache entry metadata
 */
export interface CacheMetadata {
    key: string;
    createdAt: number;
    updatedAt: number;
    accessCount: number;
    lastAccessedAt: number;
    ttl: number;
    layers: {
        l1: boolean;
        l2: boolean;
        l3: boolean;
    };
}
/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
    l1: {
        hits: number;
        misses: number;
        evictions: number;
        size: number;
    };
    l2: {
        hits: number;
        misses: number;
        size: number;
    };
    l3: {
        hits: number;
        misses: number;
        size: number;
    };
    totalHits: number;
    totalMisses: number;
    hitRate: number;
}
//# sourceMappingURL=cache_config.d.ts.map