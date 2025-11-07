/**
 * OpenAI Embedding Provider
 *
 * Implements EmbeddingProvider using OpenAI's text-embedding-3-small model.
 * Provides 1536-dimensional embeddings with excellent semantic quality.
 */
import OpenAI from 'openai';
export class OpenAIEmbeddingProvider {
    client;
    model = 'text-embedding-3-small'; // 1536 dimensions, cost-effective
    /**
     * Initialize OpenAI client
     * @param apiKey Optional API key (defaults to OPENAI_API_KEY env var)
     */
    constructor(apiKey) {
        this.client = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY
        });
    }
    /**
     * Generate embedding for text using OpenAI API
     * @param text Input text to embed
     * @returns Promise resolving to 1536-dimensional embedding vector
     * @throws Error if text is empty or API call fails
     */
    async generateEmbedding(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('Cannot generate embedding for empty text');
        }
        try {
            // Truncate to avoid token limit (8191 tokens for text-embedding-3-small)
            // Conservative estimate: ~4 chars per token
            const truncatedText = text.slice(0, 8000);
            const response = await this.client.embeddings.create({
                model: this.model,
                input: truncatedText
            });
            return response.data[0].embedding;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`OpenAI embedding failed: ${errorMessage}`);
        }
    }
    /**
     * Get embedding dimensions
     * @returns 1536 (dimension count for text-embedding-3-small)
     */
    getDimensions() {
        return 1536;
    }
}
//# sourceMappingURL=openai_provider.js.map