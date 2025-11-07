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
export type { EmbeddingProvider, EmbeddingCache, CachedEmbedding } from './types.js';
import { EmbeddingService } from './embedding_service.js';
export declare const embeddingService: EmbeddingService;
//# sourceMappingURL=index.d.ts.map