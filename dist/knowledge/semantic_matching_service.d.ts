/**
 * Semantic Matching Service
 *
 * Integrates embedding-based semantic scoring into intelligent agent selection.
 * Provides semantic similarity calculations between user queries and agent expertise.
 *
 * Scoring Method:
 * - Primary: Embedding-based cosine similarity (high confidence: 0.9)
 * - Fallback: Keyword overlap matching (lower confidence: 0.5)
 */
import { EmbeddingService } from './embeddings/embedding_service.js';
import type { AgentCapability } from '../types.js';
/**
 * Semantic score result with confidence and method used
 */
export interface SemanticScore {
    score: number;
    confidence: number;
    method: 'embedding' | 'keyword_fallback';
}
/**
 * Semantic Matching Service
 *
 * Computes semantic similarity between user queries and agent capabilities
 * using embeddings or keyword-based fallback.
 */
export declare class SemanticMatchingService {
    private embeddingService;
    private initialized;
    /**
     * Initialize service with optional embedding service
     * @param embeddingService Optional pre-configured embedding service
     */
    constructor(embeddingService?: EmbeddingService);
    /**
     * Initialize embedding service
     * Must be called before computing semantic scores
     */
    initialize(): Promise<void>;
    /**
     * Compute semantic similarity between user query and agent expertise
     *
     * Uses embedding-based cosine similarity with keyword fallback.
     *
     * @param userQuery User's objective or query
     * @param agent Agent capability to match against
     * @returns Semantic score with confidence and method
     */
    computeSemanticScore(userQuery: string, agent: AgentCapability): Promise<SemanticScore>;
    /**
     * Compute semantic scores for multiple agents in batch
     *
     * More efficient than calling computeSemanticScore multiple times
     * due to caching in embedding service.
     *
     * @param userQuery User's objective or query
     * @param agents Array of agent capabilities
     * @returns Array of semantic scores in same order as agents
     */
    computeBatchSemanticScores(userQuery: string, agents: AgentCapability[]): Promise<SemanticScore[]>;
    /**
     * Build comprehensive expertise text from agent capability
     *
     * Combines all relevant agent fields into a single text
     * for embedding generation.
     *
     * @param agent Agent capability
     * @returns Concatenated expertise text
     */
    private buildAgentExpertiseText;
    /**
     * Keyword-based fallback when embeddings unavailable
     *
     * Uses simple token overlap scoring with boosting
     * to compensate for simplicity.
     *
     * @param userQuery User's query
     * @param agent Agent capability
     * @returns Semantic score with lower confidence
     */
    private keywordFallbackScore;
    /**
     * Tokenize text into words
     *
     * Filters out short tokens (< 3 chars) to reduce noise.
     *
     * @param text Input text
     * @returns Array of tokens
     */
    private tokenize;
    /**
     * Get embedding service cache statistics
     */
    getCacheStats(): import("./cache/cache_layer.js").CacheStats;
    /**
     * Clean up resources
     * Should be called on shutdown
     */
    destroy(): void;
}
//# sourceMappingURL=semantic_matching_service.d.ts.map