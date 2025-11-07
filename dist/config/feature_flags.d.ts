/**
 * Feature Flags System
 *
 * Provides runtime configuration for Mendicant features.
 * Enables graceful degradation and A/B testing of new capabilities.
 *
 * CYCLE 5: Configuration-driven feature enablement
 */
export interface FeatureConfig {
    features: {
        embeddings: {
            enabled: boolean;
            fallbackToKeywords: boolean;
            provider: string;
        };
        realtimeSync: {
            enabled: boolean;
            fallbackToAsync: boolean;
            timeout: number;
        };
        crossProjectLearning: {
            enabled: boolean;
            querySimilar: boolean;
            maxSimilarProjects: number;
        };
        semanticMatching: {
            enabled: boolean;
            weight: number;
        };
    };
    learning: {
        scope: {
            level: string;
            identifier: string;
            canShare: boolean;
            sensitivity: string;
        };
    };
}
/**
 * Feature Flags Manager
 *
 * Loads configuration from .mendicant/config.json.
 * Falls back to sensible defaults if config not found.
 */
declare class FeatureFlags {
    private config;
    private configPath;
    private loaded;
    constructor();
    /**
     * Load configuration from disk
     *
     * Attempts to read config.json. If not found, uses defaults.
     * Safe to call multiple times (caches result).
     */
    load(): Promise<void>;
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
    isEnabled(feature: string): boolean;
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
    get<T>(path: string): T | undefined;
    /**
     * Get full configuration object
     *
     * @returns Complete configuration or null if not loaded
     */
    getConfig(): FeatureConfig | null;
    /**
     * Reload configuration from disk
     *
     * Useful for hot-reloading config changes without restart.
     */
    reload(): Promise<void>;
    /**
     * Get default configuration
     *
     * Provides sensible defaults when config file not found.
     * Emphasizes stability over experimental features.
     *
     * @returns Default configuration object
     */
    private getDefaultConfig;
}
export declare const featureFlags: FeatureFlags;
export {};
//# sourceMappingURL=feature_flags.d.ts.map