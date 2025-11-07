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
    maxEntries: 100,              // LRU eviction after 100 entries
    evictionStrategy: 'lru' as const,
    hitLogging: false             // Set true for debugging
  },

  // L2: Disk Cache Configuration
  disk: {
    ttlMs: 24 * 60 * 60 * 1000,   // 24 hours in milliseconds
    cacheDir: '.mendicant',        // Directory under user home
    fileName: 'cache_data.json',   // Cache file name
    compressionEnabled: false,     // Future: enable compression for large caches
    encoding: 'utf-8' as const
  },

  // L3: Mnemosyne Cache Configuration
  mnemosyne: {
    ttlMs: 90 * 24 * 60 * 60 * 1000,  // 90 days in milliseconds
    entityType: 'CacheEntry',          // Mnemosyne entity type
    relationPrefix: 'cached_',         // Prefix for cache relations
    syncTimeout: 5000,                 // 5 second timeout for Mnemosyne operations
    retryAttempts: 2,                  // Retry failed operations twice
    batchSize: 10                      // Batch operations for efficiency
  },

  // Refresh Configuration
  refresh: {
    onStartup: true,                   // Sync from L3 to L1/L2 on startup
    intervalMs: 5 * 60 * 1000,         // Periodic refresh every 5 minutes
    backgroundSync: true,              // Non-blocking background sync
    autoEvictStale: true               // Automatically evict stale entries
  },

  // Logging Configuration
  logging: {
    cacheHits: false,                  // Log cache hits
    cacheMisses: false,                // Log cache misses
    writeOperations: true,             // Log write operations
    evictions: true,                   // Log evictions
    errors: true                       // Always log errors
  }
} as const;

/**
 * Generate consistent cache key for data storage
 */
export function generateCacheKey(namespace: string, id: string): string {
  return `${namespace}:${id}`;
}

/**
 * Parse cache key into namespace and id
 */
export function parseCacheKey(key: string): { namespace: string; id: string } | null {
  const parts = key.split(':');
  if (parts.length !== 2) return null;

  return {
    namespace: parts[0],
    id: parts[1]
  };
}

/**
 * Check if data is expired based on TTL
 */
export function isExpired(timestamp: number, ttlMs: number): boolean {
  return Date.now() - timestamp > ttlMs;
}

/**
 * Calculate expiration timestamp
 */
export function getExpirationTimestamp(ttlMs: number): number {
  return Date.now() + ttlMs;
}

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
    l1: boolean;  // Present in memory
    l2: boolean;  // Present on disk
    l3: boolean;  // Present in Mnemosyne
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
