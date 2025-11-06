/**
 * Predictive Conflict Detector - Learn and Predict Agent Conflicts
 *
 * Some agents conflict with each other:
 * - Resource conflicts: Both modify the same file
 * - Semantic conflicts: Contradictory approaches
 * - Ordering conflicts: Agent B needs Agent A's output
 * - Capability overlaps: Redundant work
 *
 * This system:
 * 1. Learns conflict patterns from past executions
 * 2. Predicts conflicts BEFORE execution
 * 3. Suggests conflict resolution strategies
 * 4. Optimizes agent ordering to prevent conflicts
 *
 * Makes Mendicant proactive about conflicts, not reactive.
 */
import { AgentId, ProjectContext } from '../types.js';
import { SemanticEmbedding } from './semantic_embedder.js';
export interface ConflictPattern {
    agent_a: AgentId;
    agent_b: AgentId;
    conflict_type: ConflictType;
    severity: number;
    frequency: number;
    last_seen: number;
    resolution_strategies: ResolutionStrategy[];
    context_tags: string[];
}
export type ConflictType = 'resource_contention' | 'semantic_contradiction' | 'ordering_dependency' | 'capability_overlap' | 'unknown';
export interface ResolutionStrategy {
    strategy: 'reorder' | 'remove' | 'serialize' | 'parallelize' | 'merge';
    description: string;
    confidence: number;
    success_rate: number;
}
export interface ConflictPrediction {
    agent_pair: [AgentId, AgentId];
    conflict_probability: number;
    predicted_type: ConflictType;
    predicted_severity: number;
    confidence: number;
    reasoning: string;
    recommended_resolution: ResolutionStrategy;
}
export interface ConflictAnalysis {
    predicted_conflicts: ConflictPrediction[];
    conflict_free_probability: number;
    recommended_reordering?: AgentId[];
    agents_to_remove?: AgentId[];
    reasoning: string;
}
/**
 * Predictive Conflict Detector - Learn and predict agent conflicts
 */
export declare class PredictiveConflictDetector {
    private conflict_patterns;
    private resolution_success;
    /**
     * Analyze a planned agent sequence for potential conflicts
     */
    analyzeConflicts(agents: AgentId[], objective: string, objective_embedding: SemanticEmbedding, context?: ProjectContext): Promise<ConflictAnalysis>;
    /**
     * Predict conflict between two agents
     */
    private predictConflict;
    /**
     * Heuristic conflict prediction (when no historical data)
     */
    private heuristicConflictPrediction;
    /**
     * Check if agents have similar capabilities
     */
    private haveSimilarCapabilities;
    /**
     * Check for known ordering dependencies
     */
    private hasOrderingDependency;
    /**
     * Check if agents are resource-intensive
     */
    private areResourceIntensive;
    /**
     * Check if agents have contradictory semantics
     */
    private haveContradictorySemantics;
    /**
     * Generate resolution strategy for conflict type
     */
    private generateResolutionStrategy;
    /**
     * Calculate overall conflict-free probability
     */
    private calculateConflictFreeProbability;
    /**
     * Generate resolution for conflicts
     */
    private generateResolution;
    /**
     * Identify agents to remove to resolve conflicts
     */
    private identifyAgentsToRemove;
    /**
     * Reorder agents to respect dependencies
     */
    private reorderAgents;
    /**
     * Learn from observed conflicts
     */
    learnConflict(agent_a: AgentId, agent_b: AgentId, conflict_type: ConflictType, severity: number, context_tags: string[], resolution_used?: ResolutionStrategy, resolution_success?: boolean): Promise<void>;
    /**
     * Get pattern key for agent pair (order-independent)
     */
    private getPatternKey;
    /**
     * Match context tags for similarity
     */
    private matchContext;
    /**
     * Select best resolution strategy from history
     */
    private selectBestResolution;
    /**
     * Get all learned conflict patterns
     */
    getConflictPatterns(): ConflictPattern[];
    /**
     * Clear old conflict patterns
     */
    pruneOldPatterns(max_age_days?: number): number;
}
/**
 * Singleton instance
 */
export declare const conflictDetector: PredictiveConflictDetector;
//# sourceMappingURL=predictive_conflict_detector.d.ts.map