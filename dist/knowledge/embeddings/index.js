/**
 * Embedding System
 *
 * Provides semantic embeddings for intelligent agent selection.
 *
 * Priority order:
 * 1. Mnemosyne BGE-large (free, local, 1024 dims)
 * 2. OpenAI text-embedding-3-small (paid, 1536 dims)
 * 3. Keyword fallback (basic hashing)
 */
export { EmbeddingService } from './embedding_service.js';
export { ThreeTierEmbeddingCache as EmbeddingCacheLayer } from './cache_layer.js';
export { OpenAIEmbeddingProvider } from './openai_provider.js';
export { MnemosyneEmbeddingProvider } from './mnemosyne_provider.js';
// Singleton instance for global use
import { ThreeTierEmbeddingCache } from './cache_layer.js';
import { EmbeddingService } from './embedding_service.js';
const embeddingCache = new ThreeTierEmbeddingCache();
export const embeddingService = new EmbeddingService(undefined, true);
// Initialize on import (async)
embeddingService.initialize().catch((error) => {
    console.error('[Embeddings] Failed to initialize singleton service:', error);
});
//# sourceMappingURL=index.js.map