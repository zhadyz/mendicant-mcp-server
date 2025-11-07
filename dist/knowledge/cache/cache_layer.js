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
import { promises as fs } from 'fs';
import * as path from 'path';
import { CACHE_CONFIG } from './cache_config.js';
import { mnemosyneClient } from '../mnemosyne/client.js';
/**
 * Cache Layer Implementation
 */
export class CacheLayer {
    namespace;
    // L1: Memory cache with LRU
    l1Cache = new Map();
    lruHead = null;
    lruTail = null;
    l1Size = 0;
    // L2: Disk cache path
    diskCachePath;
    // Statistics
    stats = {
        l1Hits: 0,
        l1Misses: 0,
        l2Hits: 0,
        l2Misses: 0,
        l3Hits: 0,
        l3Misses: 0,
        evictions: 0,
        promotions: 0
    };
    constructor(namespace) {
        this.namespace = namespace;
        this.diskCachePath = path.join(CACHE_CONFIG.disk.cacheDir, `${namespace}_${CACHE_CONFIG.disk.fileName}`);
    }
    /**
     * Initialize cache layer (load disk cache)
     */
    async initialize() {
        try {
            // Ensure cache directory exists
            await fs.mkdir(CACHE_CONFIG.disk.cacheDir, { recursive: true });
            // Load disk cache into memory
            await this.loadDiskCache();
            console.log(`[CacheLayer:${this.namespace}] Initialized successfully`);
        }
        catch (err) {
            console.error(`[CacheLayer:${this.namespace}] Initialization error:`, err);
        }
    }
    /**
     * Get value from cache (L1 → L2 → L3 cascade)
     */
    async get(key) {
        // L1: Check memory cache
        const l1Result = this.getFromL1(key);
        if (l1Result !== null) {
            this.stats.l1Hits++;
            return l1Result;
        }
        this.stats.l1Misses++;
        // L2: Check disk cache
        const l2Result = await this.getFromL2(key);
        if (l2Result !== null) {
            this.stats.l2Hits++;
            // Promote to L1
            this.setToL1(key, l2Result);
            this.stats.promotions++;
            return l2Result.value;
        }
        this.stats.l2Misses++;
        // L3: Check Mnemosyne (currently simplified/stubbed)
        const l3Result = await this.getFromL3(key);
        if (l3Result !== null) {
            this.stats.l3Hits++;
            // Promote to L1 and L2
            const entry = {
                value: l3Result,
                metadata: {
                    key,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    accessCount: 1,
                    lastAccessedAt: Date.now(),
                    ttl: CACHE_CONFIG.mnemosyne.ttlMs,
                    layers: { l1: true, l2: true, l3: true }
                }
            };
            this.setToL1(key, entry);
            await this.setToL2(key, entry);
            this.stats.promotions++;
            return l3Result;
        }
        this.stats.l3Misses++;
        return null;
    }
    /**
     * Set value in cache (write-through to all layers)
     */
    async set(key, value) {
        const entry = {
            value,
            metadata: {
                key,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                accessCount: 0,
                lastAccessedAt: Date.now(),
                ttl: CACHE_CONFIG.disk.ttlMs,
                layers: { l1: true, l2: true, l3: true }
            }
        };
        // Write to all layers
        this.setToL1(key, entry);
        await this.setToL2(key, entry);
        await this.setToL3(key, entry);
    }
    /**
     * Invalidate entry from all cache layers
     */
    async invalidate(key) {
        // Remove from L1
        const node = this.l1Cache.get(key);
        if (node) {
            this.removeNodeFromLRU(node);
            this.l1Cache.delete(key);
            this.l1Size--;
        }
        // Remove from L2
        await this.removeFromL2(key);
        // Remove from L3 (simplified - actual implementation would delete from Mnemosyne)
        await this.removeFromL3(key);
    }
    /**
     * Refresh cache from Mnemosyne (L3 → L2 → L1)
     *
     * NOTE: Currently simplified. When MnemosyneClient supports cache queries,
     * this will fetch all entries from L3 and promote to L2/L1.
     */
    async refresh() {
        if (!mnemosyneClient.isConnected()) {
            return;
        }
        // TODO: Implement when MnemosyneClient supports cache enumeration
        // For now, this is a no-op
        console.log(`[CacheLayer:${this.namespace}] Refresh called (currently simplified)`);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear all cache layers
     */
    async clear() {
        this.l1Cache.clear();
        this.lruHead = null;
        this.lruTail = null;
        this.l1Size = 0;
        await this.persistDiskCache();
        // L3 clear is currently simplified
        console.log(`[CacheLayer:${this.namespace}] Cleared all layers`);
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.l1Cache.clear();
        this.lruHead = null;
        this.lruTail = null;
        this.l1Size = 0;
    }
    // Private L1 methods
    getFromL1(key) {
        const node = this.l1Cache.get(key);
        if (!node)
            return null;
        // Check TTL
        if (this.isExpired(node.entry.metadata.updatedAt, node.entry.metadata.ttl)) {
            this.removeNodeFromLRU(node);
            this.l1Cache.delete(key);
            this.l1Size--;
            this.stats.evictions++;
            return null;
        }
        // Move to front (most recently used)
        this.moveToFront(node);
        // Update access metadata
        node.entry.metadata.accessCount++;
        node.entry.metadata.lastAccessedAt = Date.now();
        return node.entry.value;
    }
    setToL1(key, entry) {
        // Check if already exists
        const existing = this.l1Cache.get(key);
        if (existing) {
            // Update value and move to front
            existing.entry = entry;
            this.moveToFront(existing);
            return;
        }
        // Evict if at capacity
        if (this.l1Size >= CACHE_CONFIG.memory.maxEntries) {
            this.evictLRU();
        }
        // Create new node
        const newNode = {
            key,
            entry,
            prev: null,
            next: this.lruHead
        };
        if (this.lruHead) {
            this.lruHead.prev = newNode;
        }
        this.lruHead = newNode;
        if (!this.lruTail) {
            this.lruTail = newNode;
        }
        this.l1Cache.set(key, newNode);
        this.l1Size++;
    }
    moveToFront(node) {
        if (node === this.lruHead)
            return;
        // Remove from current position
        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        if (node === this.lruTail) {
            this.lruTail = node.prev;
        }
        // Move to front
        node.prev = null;
        node.next = this.lruHead;
        if (this.lruHead) {
            this.lruHead.prev = node;
        }
        this.lruHead = node;
    }
    removeNodeFromLRU(node) {
        if (node.prev) {
            node.prev.next = node.next;
        }
        else {
            this.lruHead = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        else {
            this.lruTail = node.prev;
        }
    }
    evictLRU() {
        if (!this.lruTail)
            return;
        const evicted = this.lruTail;
        this.l1Cache.delete(evicted.key);
        this.removeNodeFromLRU(evicted);
        this.l1Size--;
        this.stats.evictions++;
    }
    // Private L2 methods
    async getFromL2(key) {
        try {
            const diskCache = await this.loadDiskCache();
            const entry = diskCache[key];
            if (!entry)
                return null;
            // Check TTL
            if (this.isExpired(entry.metadata.updatedAt, CACHE_CONFIG.disk.ttlMs)) {
                delete diskCache[key];
                await this.persistDiskCache();
                return null;
            }
            return entry;
        }
        catch (err) {
            return null;
        }
    }
    async setToL2(key, entry) {
        try {
            const diskCache = await this.loadDiskCache();
            diskCache[key] = entry;
            await this.persistDiskCache();
        }
        catch (err) {
            console.error(`[CacheLayer:${this.namespace}] L2 write error:`, err);
        }
    }
    async removeFromL2(key) {
        try {
            const diskCache = await this.loadDiskCache();
            delete diskCache[key];
            await this.persistDiskCache();
        }
        catch (err) {
            console.error(`[CacheLayer:${this.namespace}] L2 removal error:`, err);
        }
    }
    async loadDiskCache() {
        try {
            const data = await fs.readFile(this.diskCachePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (err) {
            // File doesn't exist or is corrupted
            return {};
        }
    }
    async persistDiskCache() {
        try {
            const cacheData = {};
            // Collect all L1 entries for persistence
            for (const [key, node] of this.l1Cache) {
                cacheData[key] = node.entry;
            }
            await fs.writeFile(this.diskCachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
        }
        catch (err) {
            console.error(`[CacheLayer:${this.namespace}] L2 persistence error:`, err);
        }
    }
    // Private L3 methods (simplified - awaiting proper MnemosyneClient API)
    /**
     * Get from Mnemosyne (L3)
     *
     * TODO: Replace with proper cache query when MnemosyneClient supports it
     * Current implementation returns null (effectively disabling L3)
     */
    async getFromL3(key) {
        if (!mnemosyneClient.isConnected()) {
            return null;
        }
        // TODO: Implement when MnemosyneClient has cache retrieval API
        // Example: return await mnemosyneClient.getCacheEntry(this.namespace, key);
        return null;
    }
    /**
     * Set to Mnemosyne (L3)
     *
     * TODO: Replace with proper cache write when MnemosyneClient supports it
     */
    async setToL3(key, entry) {
        if (!mnemosyneClient.isConnected()) {
            return;
        }
        // TODO: Implement when MnemosyneClient has cache write API
        // Example: await mnemosyneClient.setCacheEntry(this.namespace, key, entry);
        // For now, this is a no-op
    }
    /**
     * Remove from Mnemosyne (L3)
     *
     * TODO: Replace with proper cache deletion when MnemosyneClient supports it
     */
    async removeFromL3(key) {
        if (!mnemosyneClient.isConnected()) {
            return;
        }
        // TODO: Implement when MnemosyneClient has cache delete API
        // Example: await mnemosyneClient.deleteCacheEntry(this.namespace, key);
        // For now, this is a no-op
    }
    // Private helper methods
    isExpired(timestamp, ttlMs) {
        return Date.now() - timestamp > ttlMs;
    }
}
//# sourceMappingURL=cache_layer.js.map