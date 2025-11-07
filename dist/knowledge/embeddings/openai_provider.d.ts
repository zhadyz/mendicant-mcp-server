/**
 * OpenAI Embedding Provider
 *
 * Implements EmbeddingProvider using OpenAI's text-embedding-3-small model.
 * Provides 1536-dimensional embeddings with excellent semantic quality.
 */
import type { EmbeddingProvider } from './types.js';
export declare class OpenAIEmbeddingProvider implements EmbeddingProvider {
    private client;
    private model;
    /**
     * Initialize OpenAI client
     * @param apiKey Optional API key (defaults to OPENAI_API_KEY env var)
     */
    constructor(apiKey?: string);
    /**
     * Generate embedding for text using OpenAI API
     * @param text Input text to embed
     * @returns Promise resolving to 1536-dimensional embedding vector
     * @throws Error if text is empty or API call fails
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Get embedding dimensions
     * @returns 1536 (dimension count for text-embedding-3-small)
     */
    getDimensions(): number;
}
//# sourceMappingURL=openai_provider.d.ts.map