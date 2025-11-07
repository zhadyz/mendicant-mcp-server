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
  score: number;           // Similarity score [0.0, 1.0]
  confidence: number;      // Confidence in score [0.0, 1.0]
  method: 'embedding' | 'keyword_fallback';
}

/**
 * Semantic Matching Service
 *
 * Computes semantic similarity between user queries and agent capabilities
 * using embeddings or keyword-based fallback.
 */
export class SemanticMatchingService {
  private embeddingService: EmbeddingService;
  private initialized = false;

  /**
   * Initialize service with optional embedding service
   * @param embeddingService Optional pre-configured embedding service
   */
  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || new EmbeddingService();
  }

  /**
   * Initialize embedding service
   * Must be called before computing semantic scores
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.embeddingService.initialize();
    this.initialized = true;
  }

  /**
   * Compute semantic similarity between user query and agent expertise
   *
   * Uses embedding-based cosine similarity with keyword fallback.
   *
   * @param userQuery User's objective or query
   * @param agent Agent capability to match against
   * @returns Semantic score with confidence and method
   */
  async computeSemanticScore(
    userQuery: string,
    agent: AgentCapability
  ): Promise<SemanticScore> {
    try {
      await this.initialize();

      // Build comprehensive agent expertise text
      const agentExpertise = this.buildAgentExpertiseText(agent);

      // Get embeddings for query and expertise
      const queryEmbedding = await this.embeddingService.getOrGenerateEmbedding(userQuery);
      const expertiseEmbedding = await this.embeddingService.getOrGenerateEmbedding(agentExpertise);

      // Calculate cosine similarity
      const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, expertiseEmbedding);

      // Clamp to [0, 1] range (cosine similarity can be [-1, 1])
      const normalizedScore = Math.max(0, Math.min(1, similarity));

      return {
        score: normalizedScore,
        confidence: 0.9,  // High confidence for embedding-based
        method: 'embedding'
      };
    } catch (error) {
      console.warn('[SemanticMatchingService] Embedding failed, using keyword fallback:', error);
      return this.keywordFallbackScore(userQuery, agent);
    }
  }

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
  async computeBatchSemanticScores(
    userQuery: string,
    agents: AgentCapability[]
  ): Promise<SemanticScore[]> {
    await this.initialize();

    // Get query embedding once
    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.embeddingService.getOrGenerateEmbedding(userQuery);
    } catch (error) {
      // If query embedding fails, use fallback for all
      console.warn('[SemanticMatchingService] Query embedding failed, using fallback for all');
      return agents.map(agent => this.keywordFallbackScore(userQuery, agent));
    }

    // Score each agent
    const scores: SemanticScore[] = [];

    for (const agent of agents) {
      try {
        const agentExpertise = this.buildAgentExpertiseText(agent);
        const expertiseEmbedding = await this.embeddingService.getOrGenerateEmbedding(agentExpertise);

        const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, expertiseEmbedding);
        const normalizedScore = Math.max(0, Math.min(1, similarity));

        scores.push({
          score: normalizedScore,
          confidence: 0.9,
          method: 'embedding'
        });
      } catch (error) {
        // Fallback for this agent
        scores.push(this.keywordFallbackScore(userQuery, agent));
      }
    }

    return scores;
  }

  /**
   * Build comprehensive expertise text from agent capability
   *
   * Combines all relevant agent fields into a single text
   * for embedding generation.
   *
   * @param agent Agent capability
   * @returns Concatenated expertise text
   */
  private buildAgentExpertiseText(agent: AgentCapability): string {
    const parts = [
      agent.name,
      agent.specialization,
      ...agent.capabilities,
      ...agent.typical_use_cases,
      ...agent.tools
    ];

    // Filter empty parts and join with spaces
    return parts
      .filter(part => part && part.trim())
      .join(' ');
  }

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
  private keywordFallbackScore(userQuery: string, agent: AgentCapability): SemanticScore {
    const queryTokens = this.tokenize(userQuery.toLowerCase());
    const expertiseText = this.buildAgentExpertiseText(agent).toLowerCase();
    const expertiseTokens = this.tokenize(expertiseText);

    // Calculate token overlap
    const intersection = queryTokens.filter(token => expertiseTokens.includes(token));
    const overlapScore = intersection.length / Math.max(queryTokens.length, 1);

    // Boost score to compensate for simple matching (max 1.0)
    const boostedScore = Math.min(1, overlapScore * 1.5);

    return {
      score: boostedScore,
      confidence: 0.5,  // Lower confidence for keyword-based
      method: 'keyword_fallback'
    };
  }

  /**
   * Tokenize text into words
   *
   * Filters out short tokens (< 3 chars) to reduce noise.
   *
   * @param text Input text
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Get embedding service cache statistics
   */
  getCacheStats() {
    return this.embeddingService.getCacheStats();
  }

  /**
   * Clean up resources
   * Should be called on shutdown
   */
  destroy(): void {
    this.embeddingService.destroy();
  }
}
