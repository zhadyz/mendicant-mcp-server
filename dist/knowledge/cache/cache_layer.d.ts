/**
 * Cache Layer - Three-Tier Architecture
 *
 * L1: Memory cache (instant access, LRU eviction, max 100 entries)
 * L2: Disk cache (24-hour TTL, persists across restarts)
 * L3: Mnemosyne cache (90-day TTL, cross-session learning)
 *
 * IMPORTANT NOTE: L3 (Mnemosyne) integration is currently simplified.
 * The MnemosyneClient API doesn't yet support generic cache operations.
 * When the API is extended, replace the stub implementations with actual calls.
 *
 * Cache operations:
 * - get(): L1 → L2 → L3 (cascade with promotion)
 * - set(): Write-through to all layers
 * - invalidate(): Remove from all layers
 * - refresh(): Sync from L3 to L2/L1
 */
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
 * Cached entry with value and metadata
 */
export interface CachedEntry<T> {
    value: T;
    metadata: CacheMetadata;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    l1Hits: number;
    l1Misses: number;
    l2Hits: number;
    l2Misses: number;
    l3Hits: number;
    l3Misses: number;
    evictions: number;
    promotions: number;
}
/**
 * Cache Layer Implementation
 */
export declare class CacheLayer<T> {
    private namespace;
    private l1Cache;
    private lruHead;
    private lruTail;
    private l1Size;
    private diskCachePath;
    private stats;
    constructor(namespace: string);
    /**
     * Initialize cache layer (load disk cache)
     */
    initialize(): Promise<void>;
    /**
     * Get value from cache (L1 → L2 → L3 cascade)
     */
    get(key: string): Promise<T | null>;
    /**
     * Set value in cache (write-through to all layers)
     */
    set(key: string, value: T): Promise<void>;
    /**
     * Invalidate entry from all cache layers
     */
    invalidate(key: string): Promise<void>;
    /**
     * Refresh cache from Mnemosyne (L3 → L2 → L1)
     *
     * NOTE: Currently simplified. When MnemosyneClient supports cache queries,
     * this will fetch all entries from L3 and promote to L2/L1.
     */
    refresh(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Clear all cache layers
     */
    clear(): Promise<void>;
    /**
     * Clean up resources
     */
    destroy(): void;
    private getFromL1;
    private setToL1;
    private moveToFront;
    private removeNodeFromLRU;
    private evictLRU;
    private getFromL2;
    private setToL2;
    private removeFromL2;
    private loadDiskCache;
    private persistDiskCache;
    /**
     * Get from Mnemosyne (L3)
     *
     * TODO: Replace with proper cache query when MnemosyneClient supports it
     * Current implementation returns null (effectively disabling L3)
     */
    private getFromL3;
    /**
     * Set to Mnemosyne (L3)
     *
     * TODO: Replace with proper cache write when MnemosyneClient supports it
     */
    private setToL3;
    /**
     * Remove from Mnemosyne (L3)
     *
     * TODO: Replace with proper cache deletion when MnemosyneClient supports it
     */
    private removeFromL3;
    private isExpired;
}
//# sourceMappingURL=cache_layer.d.ts.map