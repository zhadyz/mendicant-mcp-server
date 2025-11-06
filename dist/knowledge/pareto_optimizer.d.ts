/**
 * Pareto Optimizer - Multi-Objective Optimization
 *
 * Mendicant must balance multiple competing objectives:
 * - ACCURACY: Success rate, result quality
 * - COST: Token usage, API calls, compute resources
 * - LATENCY: Execution time, user wait time
 *
 * A Pareto-optimal solution is one where you cannot improve any objective
 * without degrading at least one other. The Pareto frontier is the set of
 * all such non-dominated solutions.
 *
 * Example:
 * Plan A: 95% accuracy, 10k tokens, 5s  → Pareto-optimal
 * Plan B: 90% accuracy, 5k tokens, 2s   → Pareto-optimal (faster, cheaper)
 * Plan C: 92% accuracy, 8k tokens, 4s   → Dominated by A (A is better)
 *
 * This optimizer:
 * 1. Generates multiple candidate plans
 * 2. Evaluates them on all objectives
 * 3. Finds the Pareto frontier
 * 4. Selects optimal solution based on user preferences
 * 5. Learns preferences over time
 */
import { AgentId, ExecutionPattern, ProjectContext } from '../types.js';
import { SemanticEmbedding } from './semantic_embedder.js';
/**
 * Multi-objective scores for a plan
 */
export interface ObjectiveScores {
    accuracy: number;
    cost: number;
    latency: number;
}
/**
 * A candidate plan with its objective scores
 */
export interface ParetoCandidate {
    plan_id: string;
    agents: AgentId[];
    scores: ObjectiveScores;
    raw_metrics: {
        estimated_tokens: number;
        estimated_duration_ms: number;
        confidence: number;
    };
    is_pareto_optimal: boolean;
    dominance_count: number;
}
/**
 * User preferences for objective weights
 */
export interface UserPreferences {
    accuracy_weight: number;
    cost_weight: number;
    latency_weight: number;
    preference_strength: number;
}
/**
 * Optimization result
 */
export interface OptimizationResult {
    pareto_frontier: ParetoCandidate[];
    recommended_plan: ParetoCandidate;
    all_candidates: ParetoCandidate[];
    user_preferences: UserPreferences;
    reasoning: string;
}
/**
 * Pareto Optimizer - Finds optimal trade-offs between objectives
 */
export declare class ParetoOptimizer {
    private user_preferences;
    private preference_history;
    /**
     * Optimize agent selection for multiple objectives
     */
    optimize(objective: string, candidate_plans: AgentId[][], objective_embedding: SemanticEmbedding, context?: ProjectContext, execution_history?: ExecutionPattern[]): Promise<OptimizationResult>;
    /**
     * Evaluate all candidate plans on all objectives
     */
    private evaluateCandidates;
    /**
     * Find Pareto frontier - all non-dominated solutions
     */
    private findParetoFrontier;
    /**
     * Check if plan A dominates plan B
     * A dominates B if A is better or equal in ALL objectives and strictly better in at least one
     */
    private dominates;
    /**
     * Select best plan from Pareto frontier based on user preferences
     */
    private selectBestPlan;
    /**
     * Calculate utility score for a plan given user preferences
     */
    private calculateUtility;
    /**
     * Explain why a plan was chosen
     */
    private explainChoice;
    /**
     * Learn user preferences from their choices
     */
    learnPreferences(chosen_plan: ParetoCandidate, rejected_plans: ParetoCandidate[]): Promise<void>;
    /**
     * Estimate token usage for a plan
     */
    private estimateTokens;
    /**
     * Normalize token count to 0.0-1.0 scale (lower is better)
     */
    private normalizeTokens;
    /**
     * Estimate execution duration for a plan
     */
    private estimateDuration;
    /**
     * Normalize duration to 0.0-1.0 scale (lower is better)
     */
    private normalizeDuration;
    /**
     * Get current user preferences
     */
    getPreferences(): UserPreferences;
    /**
     * Manually set user preferences
     */
    setPreferences(preferences: Partial<UserPreferences>): void;
    /**
     * Get preference learning history
     */
    getPreferenceHistory(): Array<{
        choice: string;
        alternatives: string[];
        timestamp: number;
    }>;
}
/**
 * Singleton instance
 */
export declare const paretoOptimizer: ParetoOptimizer;
//# sourceMappingURL=pareto_optimizer.d.ts.map