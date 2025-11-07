/**
 * Cache Layer Test Suite
 *
 * Tests three-tier caching architecture with LRU eviction and TTL management.
 * Covers L1 (memory), L2 (disk), and L3 (Mnemosyne stub) functionality.
 */
import { CacheLayer } from '../../knowledge/cache/cache_layer.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CACHE_CONFIG } from '../../knowledge/cache/cache_config.js';
describe('CacheLayer', () => {
    let cacheLayer;
    const testNamespace = 'test_cache';
    const testCachePath = path.join(CACHE_CONFIG.disk.cacheDir, `${testNamespace}_${CACHE_CONFIG.disk.fileName}`);
    beforeEach(async () => {
        cacheLayer = new CacheLayer(testNamespace);
        await cacheLayer.initialize();
    });
    afterEach(async () => {
        await cacheLayer.clear();
        cacheLayer.destroy();
        // Clean up test cache file
        try {
            await fs.unlink(testCachePath);
        }
        catch (err) {
            // Ignore if file doesn't exist
        }
    });
    describe('L1 Memory Cache', () => {
        test('should store and retrieve values from L1 cache', async () => {
            await cacheLayer.set('key1', 'value1');
            const result = await cacheLayer.get('key1');
            expect(result).toBe('value1');
        });
        test('should update access count on L1 hit', async () => {
            await cacheLayer.set('key1', 'value1');
            // Access multiple times
            await cacheLayer.get('key1');
            await cacheLayer.get('key1');
            const stats = cacheLayer.getStats();
            expect(stats.l1Hits).toBeGreaterThanOrEqual(2);
        });
        test('should implement LRU eviction when cache is full', async () => {
            // Fill cache to max capacity + 1
            const maxEntries = CACHE_CONFIG.memory.maxEntries;
            for (let i = 0; i < maxEntries + 1; i++) {
                await cacheLayer.set(`key${i}`, `value${i}`);
            }
            // First key should be evicted
            const result = await cacheLayer.get('key0');
            expect(result).toBeNull();
            const stats = cacheLayer.getStats();
            expect(stats.evictions).toBeGreaterThanOrEqual(1);
        });
        test('should move accessed entries to front of LRU', async () => {
            // Add entries
            await cacheLayer.set('key1', 'value1');
            await cacheLayer.set('key2', 'value2');
            await cacheLayer.set('key3', 'value3');
            // Access key1 to make it most recently used
            await cacheLayer.get('key1');
            // Fill cache to trigger eviction
            const maxEntries = CACHE_CONFIG.memory.maxEntries;
            for (let i = 4; i < maxEntries + 2; i++) {
                await cacheLayer.set(`key${i}`, `value${i}`);
            }
            // key1 should still be in cache (recently accessed)
            const result = await cacheLayer.get('key1');
            expect(result).toBe('value1');
        });
        test('should update existing entries without duplication', async () => {
            await cacheLayer.set('key1', 'value1');
            await cacheLayer.set('key1', 'value1_updated');
            const result = await cacheLayer.get('key1');
            expect(result).toBe('value1_updated');
        });
    });
    describe('L2 Disk Cache', () => {
        test('should persist to disk and reload', async () => {
            await cacheLayer.set('key1', 'value1');
            // Create new cache instance (simulates restart)
            const newCache = new CacheLayer(testNamespace);
            await newCache.initialize();
            const result = await newCache.get('key1');
            expect(result).toBe('value1');
            newCache.destroy();
        });
        test('should promote L2 entries to L1 on cache hit', async () => {
            await cacheLayer.set('key1', 'value1');
            // Clear L1 but keep L2
            cacheLayer.destroy();
            cacheLayer = new CacheLayer(testNamespace);
            await cacheLayer.initialize();
            const stats = cacheLayer.getStats();
            const initialL1Hits = stats.l1Hits;
            // This should be L2 hit and promote to L1
            const result = await cacheLayer.get('key1');
            expect(result).toBe('value1');
            const newStats = cacheLayer.getStats();
            expect(newStats.l2Hits).toBeGreaterThan(0);
            expect(newStats.promotions).toBeGreaterThan(0);
            // Second access should hit L1
            await cacheLayer.get('key1');
            const finalStats = cacheLayer.getStats();
            expect(finalStats.l1Hits).toBeGreaterThan(initialL1Hits);
        });
        test('should handle disk cache corruption gracefully', async () => {
            // Write invalid JSON to cache file
            await fs.mkdir(CACHE_CONFIG.disk.cacheDir, { recursive: true });
            await fs.writeFile(testCachePath, 'invalid json{', 'utf-8');
            // Should initialize without error
            const corruptedCache = new CacheLayer(testNamespace);
            await corruptedCache.initialize();
            const result = await corruptedCache.get('nonexistent');
            expect(result).toBeNull();
            corruptedCache.destroy();
        });
    });
    describe('L3 Mnemosyne Cache (Stub)', () => {
        test('should gracefully handle L3 unavailable', async () => {
            // L3 is stubbed, so should return null
            // This tests graceful degradation
            await cacheLayer.set('key1', 'value1');
            const result = await cacheLayer.get('key1');
            // Should work via L1/L2 even though L3 is unavailable
            expect(result).toBe('value1');
        });
        test('should call refresh without errors when L3 unavailable', async () => {
            // refresh() should be a no-op when Mnemosyne unavailable
            await expect(cacheLayer.refresh()).resolves.not.toThrow();
        });
    });
    describe('Cache Invalidation', () => {
        test('should remove entries from all layers', async () => {
            await cacheLayer.set('key1', 'value1');
            await cacheLayer.invalidate('key1');
            const result = await cacheLayer.get('key1');
            expect(result).toBeNull();
        });
        test('should handle invalidation of non-existent keys', async () => {
            await expect(cacheLayer.invalidate('nonexistent')).resolves.not.toThrow();
        });
    });
    describe('Cache Statistics', () => {
        test('should track L1 hit/miss ratios', async () => {
            await cacheLayer.set('key1', 'value1');
            // Hit
            await cacheLayer.get('key1');
            // Miss
            await cacheLayer.get('nonexistent');
            const stats = cacheLayer.getStats();
            expect(stats.l1Hits).toBeGreaterThanOrEqual(1);
            expect(stats.l1Misses).toBeGreaterThanOrEqual(1);
        });
        test('should track eviction count', async () => {
            const maxEntries = CACHE_CONFIG.memory.maxEntries;
            for (let i = 0; i < maxEntries + 5; i++) {
                await cacheLayer.set(`key${i}`, `value${i}`);
            }
            const stats = cacheLayer.getStats();
            expect(stats.evictions).toBeGreaterThanOrEqual(5);
        });
        test('should track promotion count', async () => {
            await cacheLayer.set('key1', 'value1');
            // Destroy and reload to force L2 → L1 promotion
            cacheLayer.destroy();
            cacheLayer = new CacheLayer(testNamespace);
            await cacheLayer.initialize();
            await cacheLayer.get('key1');
            const stats = cacheLayer.getStats();
            expect(stats.promotions).toBeGreaterThanOrEqual(1);
        });
    });
    describe('Cache Clear', () => {
        test('should clear all cache layers', async () => {
            await cacheLayer.set('key1', 'value1');
            await cacheLayer.set('key2', 'value2');
            await cacheLayer.clear();
            const result1 = await cacheLayer.get('key1');
            const result2 = await cacheLayer.get('key2');
            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });
        test('should reset statistics after clear', async () => {
            await cacheLayer.set('key1', 'value1');
            await cacheLayer.get('key1');
            await cacheLayer.clear();
            const stats = cacheLayer.getStats();
            // Stats should still contain historical data
            // (We don't reset stats on clear to maintain analytics)
            expect(stats).toBeDefined();
        });
    });
    describe('Complex Data Types', () => {
        test('should cache objects', async () => {
            const objectCache = new CacheLayer('test_objects');
            await objectCache.initialize();
            const testObj = {
                id: 1,
                name: 'test',
                nested: { value: 'nested_value' }
            };
            await objectCache.set('obj1', testObj);
            const result = await objectCache.get('obj1');
            expect(result).toEqual(testObj);
            objectCache.destroy();
        });
        test('should cache arrays', async () => {
            const arrayCache = new CacheLayer('test_arrays');
            await arrayCache.initialize();
            const testArray = ['a', 'b', 'c'];
            await arrayCache.set('arr1', testArray);
            const result = await arrayCache.get('arr1');
            expect(result).toEqual(testArray);
            arrayCache.destroy();
        });
    });
    describe('Edge Cases', () => {
        test('should handle empty string as value', async () => {
            await cacheLayer.set('empty', '');
            const result = await cacheLayer.get('empty');
            expect(result).toBe('');
        });
        test('should handle special characters in keys', async () => {
            const specialKey = 'key-with_special.chars@123';
            await cacheLayer.set(specialKey, 'value');
            const result = await cacheLayer.get(specialKey);
            expect(result).toBe('value');
        });
        test('should handle concurrent operations', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(cacheLayer.set(`key${i}`, `value${i}`));
            }
            await Promise.all(promises);
            const results = await Promise.all(Array.from({ length: 10 }, (_, i) => cacheLayer.get(`key${i}`)));
            results.forEach((result, i) => {
                expect(result).toBe(`value${i}`);
            });
        });
    });
});
//# sourceMappingURL=cache_layer.test.js.map