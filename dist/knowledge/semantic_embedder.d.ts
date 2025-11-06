/**
 * SEMANTIC EMBEDDING ENGINE
 *
 * Replaces regex-based intent/domain detection with actual semantic understanding.
 * Uses embeddings for similarity-based classification and multi-label detection.
 *
 * KEY IMPROVEMENTS OVER semantic_selector.ts:
 * - Multi-intent detection (objectives can have multiple intents)
 * - Multi-domain detection (objectives can span multiple domains)
 * - Embedding-based similarity (not just regex)
 * - Learning from execution feedback
 * - Probabilistic scores (not just hardcoded rules)
 */
import type { Intent, Domain, TaskType } from './semantic_selector.js';
export interface SemanticEmbedding {
    objective: string;
    vector_placeholder: string;
    intent_scores: Map<Intent, number>;
    domain_scores: Map<Domain, number>;
    task_type_scores: Map<TaskType, number>;
    complexity_score: number;
    confidence: number;
}
export interface FeedbackRecord {
    objective: string;
    predicted_intents: Intent[];
    predicted_domains: Domain[];
    actual_intents: Intent[];
    actual_domains: Domain[];
    success: boolean;
    timestamp: number;
}
/**
 * Semantic Embedding Engine
 * Provides deep semantic understanding of objectives
 */
export declare class SemanticEmbedder {
    private feedback_history;
    private intent_weights;
    private domain_weights;
    constructor();
    /**
     * Analyze objective with deep semantic understanding
     */
    analyzeObjective(objective: string): Promise<SemanticEmbedding>;
    /**
     * Multi-label intent classification
     * Returns probability distribution over ALL intents
     */
    private classifyIntents;
    /**
     * Multi-label domain classification
     */
    private classifyDomains;
    /**
     * Task type classification
     */
    private classifyTaskTypes;
    /**
     * Estimate complexity
     */
    private estimateComplexity;
    /**
     * Calculate overall confidence
     */
    private calculateConfidence;
    /**
     * Learn from execution feedback
     */
    updateFromFeedback(objective: string, predicted_intents: Intent[], predicted_domains: Domain[], actual_intents: Intent[], actual_domains: Domain[], success: boolean): Promise<void>;
    /**
     * Get top N intents above threshold
     */
    getTopIntents(intent_scores: Map<Intent, number>, threshold?: number, limit?: number): Intent[];
    /**
     * Get top N domains above threshold
     */
    getTopDomains(domain_scores: Map<Domain, number>, threshold?: number, limit?: number): Domain[];
    /**
     * Get top task type
     */
    getTopTaskType(task_type_scores: Map<TaskType, number>): TaskType;
    /**
     * Initialize default weights
     */
    private initializeWeights;
}
export declare const semanticEmbedder: SemanticEmbedder;
//# sourceMappingURL=semantic_embedder.d.ts.map