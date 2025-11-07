/**
 * Feature Flags System
 *
 * Provides runtime configuration for Mendicant features.
 * Enables graceful degradation and A/B testing of new capabilities.
 *
 * CYCLE 5: Configuration-driven feature enablement
 */
import fs from 'fs/promises';
import path from 'path';
/**
 * Feature Flags Manager
 *
 * Loads configuration from .mendicant/config.json.
 * Falls back to sensible defaults if config not found.
 */
class FeatureFlags {
    config = null;
    configPath;
    loaded = false;
    constructor() {
        this.configPath = path.join(process.cwd(), '.mendicant', 'config.json');
    }
    /**
     * Load configuration from disk
     *
     * Attempts to read config.json. If not found, uses defaults.
     * Safe to call multiple times (caches result).
     */
    async load() {
        if (this.loaded)
            return;
        try {
            const content = await fs.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(content);
            console.log('[FeatureFlags] Loaded configuration from', this.configPath);
            this.loaded = true;
        }
        catch (error) {
            console.warn('[FeatureFlags] Config not found, using defaults');
            this.config = this.getDefaultConfig();
            this.loaded = true;
        }
    }
    /**
     * Check if a feature is enabled
     *
     * Supports dot notation for nested features.
     * Examples:
     *   - "embeddings" -> checks features.embeddings.enabled
     *   - "crossProjectLearning" -> checks features.crossProjectLearning.enabled
     *
     * @param feature Feature path (e.g., "embeddings", "crossProjectLearning")
     * @returns True if feature is enabled
     */
    isEnabled(feature) {
        if (!this.config)
            return false;
        const parts = feature.split('.');
        let current = this.config.features;
        for (const part of parts) {
            if (!current[part])
                return false;
            current = current[part];
        }
        return current.enabled === true;
    }
    /**
     * Get configuration value by path
     *
     * Supports dot notation for nested values.
     * Examples:
     *   - "features.embeddings.provider"
     *   - "learning.scope.level"
     *
     * @param path Configuration path
     * @returns Configuration value or undefined
     */
    get(path) {
        if (!this.config)
            return undefined;
        const parts = path.split('.');
        let current = this.config;
        for (const part of parts) {
            if (!current[part])
                return undefined;
            current = current[part];
        }
        return current;
    }
    /**
     * Get full configuration object
     *
     * @returns Complete configuration or null if not loaded
     */
    getConfig() {
        return this.config;
    }
    /**
     * Reload configuration from disk
     *
     * Useful for hot-reloading config changes without restart.
     */
    async reload() {
        this.loaded = false;
        this.config = null;
        await this.load();
    }
    /**
     * Get default configuration
     *
     * Provides sensible defaults when config file not found.
     * Emphasizes stability over experimental features.
     *
     * @returns Default configuration object
     */
    getDefaultConfig() {
        return {
            features: {
                embeddings: {
                    enabled: true,
                    fallbackToKeywords: true,
                    provider: 'openai'
                },
                realtimeSync: {
                    enabled: true,
                    fallbackToAsync: true,
                    timeout: 500
                },
                crossProjectLearning: {
                    enabled: true,
                    querySimilar: true,
                    maxSimilarProjects: 5
                },
                semanticMatching: {
                    enabled: true,
                    weight: 0.30
                }
            },
            learning: {
                scope: {
                    level: 'project',
                    identifier: 'mendicant',
                    canShare: false,
                    sensitivity: 'internal'
                }
            }
        };
    }
}
// Singleton instance
export const featureFlags = new FeatureFlags();
//# sourceMappingURL=feature_flags.js.map