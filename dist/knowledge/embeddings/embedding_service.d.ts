/**
 * Embedding Service
 *
 * High-level service for embedding generation with caching and fallback.
 * Provides cosine similarity calculations for semantic matching.
 *
 * PRIORITY ORDER:
 * 1. Mnemosyne BGE-large (free, local, high-quality) - DEFAULT
 * 2. OpenAI text-embedding-3-small (requires API key) - FALLBACK
 * 3. Keyword-based hashing (lowest quality) - FINAL FALLBACK
 */
import type { EmbeddingProvider } from './types.js';
export declare class EmbeddingService {
    private provider;
    private cache;
    private fallbackEnabled;
    /**
     * Initialize embedding service
     * @param provider Optional embedding provider (auto-detected if not provided)
     * @param fallbackEnabled Enable keyword-based fallback on all failures (default: true)
     */
    constructor(provider?: EmbeddingProvider, fallbackEnabled?: boolean);
    /**
     * Initialize cache layers and detect best embedding provider
     * Must be called before using the service
     *
     * Provider detection order:
     * 1. Mnemosyne BGE-large (free, local, high-quality)
     * 2. OpenAI text-embedding-3-small (requires OPENAI_API_KEY)
     * 3. Keyword-only mode (if fallback enabled)
     */
    initialize(): Promise<void>;
    /**
     * Get or generate embedding for text
     * Checks cache first, generates if not cached
     *
     * @param text Input text to embed
     * @returns Promise resolving to embedding vector
     */
    getOrGenerateEmbedding(text: string): Promise<number[]>;
    /**
     * Calculate cosine similarity between two embeddings
     *
     * Handles different embedding dimensions by normalizing if necessary.
     *
     * @param a First embedding vector
     * @param b Second embedding vector
     * @returns Similarity score from -1 (opposite) to 1 (identical)
     */
    cosineSimilarity(a: number[], b: number[]): number;
    /**
     * Generate cache key from text
     * Uses SHA256 hash for consistent key generation
     *
     * @param text Input text
     * @returns SHA256 hex digest
     */
    private generateCacheKey;
    /**
     * Generate fallback embedding using keyword hashing
     * Used when no embedding provider is available
     *
     * @param text Input text
     * @returns Embedding vector (dimensions match provider if available, else 1024)
     */
    private generateFallbackEmbedding;
    /**
     * Simple string hash function
     * @param str Input string
     * @returns Positive integer hash
     */
    private hashString;
    /**
     * Get cache statistics
     */
    getCacheStats(): import("../cache/cache_layer.js").CacheStats;
    /**
     * Get current provider info
     */
    getProviderInfo(): {
        name: string;
        dimensions: number;
        available: boolean;
    };
    /**
     * Clean up resources
     * Should be called on shutdown
     */
    destroy(): void;
}
//# sourceMappingURL=embedding_service.d.ts.map