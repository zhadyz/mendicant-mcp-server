/**
 * Embedding Provider Interface
 *
 * Defines the contract for embedding generation services.
 * Implementations can use different providers (OpenAI, local models, etc.)
 */
export interface EmbeddingProvider {
    /**
     * Generate embedding vector for text
     * @param text Input text to embed
     * @returns Promise resolving to embedding vector
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Get dimensions of embedding vectors
     * @returns Number of dimensions
     */
    getDimensions(): number;
}
/**
 * Embedding Cache Interface
 *
 * Defines contract for caching embeddings to avoid repeated API calls.
 */
export interface EmbeddingCache {
    /**
     * Retrieve cached embedding
     * @param key Cache key (typically hash of input text)
     * @returns Promise resolving to embedding or null if not cached
     */
    get(key: string): Promise<number[] | null>;
    /**
     * Store embedding in cache
     * @param key Cache key
     * @param embedding Embedding vector to cache
     */
    set(key: string, embedding: number[]): Promise<void>;
    /**
     * Clear all cached embeddings
     */
    clear(): Promise<void>;
}
/**
 * Cached Embedding Entry
 *
 * Metadata wrapper for cached embeddings.
 */
export interface CachedEmbedding {
    /** The embedding vector */
    embedding: number[];
    /** Timestamp when cached (milliseconds since epoch) */
    timestamp: number;
    /** Number of times this embedding was retrieved from cache */
    hits: number;
}
//# sourceMappingURL=types.d.ts.map