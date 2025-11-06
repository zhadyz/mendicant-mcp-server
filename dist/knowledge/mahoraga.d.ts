/**
 * MAHORAGA - Adaptive Intelligence Engine
 *
 * Named after the shikigami that adapts to any phenomenon.
 * This engine learns from every execution and becomes immune to patterns of failure.
 *
 * Core Capabilities:
 * 1. Pattern Recognition - Finds similar past executions
 * 2. Predictive Selection - Predicts agent success before spawning
 * 3. Failure Analysis - Learns WHY things fail, not just that they failed
 * 4. Adaptive Refinement - Automatically improves failed plans
 * 5. Context Awareness - Understands project context and objective similarity
 */
import type { ExecutionPattern, FailureContext, PatternMatch, PredictiveScore, AdaptiveRefinement, AgentId, ProjectContext, OrchestrationPlan, AgentResult, Conflict, Gap } from '../types.js';
/**
 * Mahoraga's memory - stores and retrieves execution patterns
 */
export declare class MahoragaMemory {
    private patterns;
    private failures;
    /**
     * Record a complete execution pattern
     */
    recordPattern(pattern: ExecutionPattern): void;
    /**
     * Find patterns similar to the given objective
     */
    findSimilarPatterns(objective: string, projectContext?: ProjectContext, limit?: number): PatternMatch[];
    /**
     * Get all patterns where a specific agent was used
     */
    getPatternsWithAgent(agentId: AgentId): ExecutionPattern[];
    /**
     * Get failure patterns for learning
     */
    getFailures(agentId?: AgentId): FailureContext[];
    /**
     * Clear old patterns (older than 30 days)
     */
    pruneOldPatterns(): void;
    private extractFailureContext;
    private classifyError;
    private generateAvoidanceRule;
    private extractObjectiveType;
    private extractTags;
    private calculateSimilarity;
    private calculateTextSimilarity;
    private getMatchingFactors;
}
/**
 * Predictive agent selector - uses learned patterns to predict success
 */
export declare class PredictiveSelector {
    private memory;
    constructor(memory: MahoragaMemory);
    /**
     * Score agents based on how likely they are to succeed for this objective
     */
    predictAgentSuccess(agents: AgentId[], objective: string, projectContext?: ProjectContext): PredictiveScore[];
    private calculatePredictiveScore;
}
/**
 * Failure analyzer - learns from what went wrong
 */
export declare class FailureAnalyzer {
    private memory;
    constructor(memory: MahoragaMemory);
    /**
     * Analyze a failure and learn how to avoid it
     */
    analyzeFailure(objective: string, failedAgentId: AgentId, error: string, precedingAgents: AgentId[], projectContext?: ProjectContext): FailureContext;
    private isSimilarFailure;
    private classifyError;
    private generateAvoidanceRule;
    private suggestFix;
    private findCommonPrecedingAgents;
}
/**
 * Adaptive plan refiner - automatically improves failed plans
 */
export declare class AdaptivePlanner {
    private memory;
    private failureAnalyzer;
    constructor(memory: MahoragaMemory, failureAnalyzer: FailureAnalyzer);
    /**
     * Refine a failed plan based on learned patterns
     * NOW WITH ADAPTIVE CREATIVITY - adjusts strategy based on confidence
     */
    refinePlan(originalPlan: OrchestrationPlan, failureContext: FailureContext, objective: string, projectContext?: ProjectContext): AdaptiveRefinement;
    private determinePlanChanges;
    private findCommonAgents;
    private applyChanges;
    private calculateRefinementConfidence;
    /**
     * AGGRESSIVE REFINEMENT - When confidence is low, get creative
     * This is where Mahoraga truly adapts like its namesake
     */
    private generateAggressiveRefinement;
    /**
     * HYBRID APPROACH - Mix successful patterns from different domains
     * When we have some data but not enough, cross-pollinate
     */
    private hybridizePatterns;
    private generateRefinementReasoning;
}
/**
 * Mahoraga Engine - orchestrates all adaptive intelligence
 */
export declare class MahoragaEngine {
    private memory;
    private predictor;
    private analyzer;
    private planner;
    private isBootstrapped;
    constructor();
    /**
     * Initialize Mahoraga with bootstrap data if memory is empty
     * This solves the cold-start problem by providing synthetic training data
     */
    private ensureBootstrapped;
    /**
     * Record execution for learning
     */
    recordExecution(objective: string, plan: OrchestrationPlan, results: AgentResult[], conflicts: Conflict[], gaps: Gap[], projectContext?: ProjectContext): void;
    /**
     * Get predictive scores for agents
     */
    predictAgents(agents: AgentId[], objective: string, projectContext?: ProjectContext): PredictiveScore[];
    /**
     * Analyze a failure
     */
    analyzeFailure(objective: string, failedAgentId: AgentId, error: string, precedingAgents: AgentId[], projectContext?: ProjectContext): FailureContext;
    /**
     * Refine a failed plan
     */
    refinePlan(originalPlan: OrchestrationPlan, failureContext: FailureContext, objective: string, projectContext?: ProjectContext): AdaptiveRefinement;
    /**
     * Find similar successful patterns
     */
    findSimilarSuccessfulPatterns(objective: string, projectContext?: ProjectContext, limit?: number): PatternMatch[];
    private extractObjectiveType;
    private extractTags;
}
export declare const mahoraga: MahoragaEngine;
//# sourceMappingURL=mahoraga.d.ts.map