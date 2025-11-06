/**
 * INTELLIGENT MEMORY BRIDGE
 *
 * Mahoraga-level intelligence for consolidating short-term (RAM) memory
 * into long-term (Mnemosyne) storage.
 *
 * The bridge itself is adaptive - it learns what memories are valuable
 * and only persists what matters.
 *
 * Architecture:
 * - Mahoraga (RAM) → Memory Bridge → Mnemosyne (Persistent Storage)
 * - Selective consolidation based on value scoring
 * - Semantic retrieval for context-aware loading
 * - Adaptive thresholds that improve over time
 */
import type { ExecutionPattern, FailureContext, OrchestrationPlan, AgentResult, Conflict, Gap, ProjectContext, AgentId } from '../types.js';
/**
 * Memory value scoring - determines if a memory is worth persisting
 */
interface MemoryScore {
    value: number;
    reasoning: string;
    factors: {
        success_rate: number;
        reusability: number;
        novelty: number;
        impact: number;
        conflict_severity: number;
    };
}
/**
 * Consolidation decision
 */
interface ConsolidationDecision {
    should_persist: boolean;
    memory_type: 'execution_pattern' | 'failure_context' | 'agent_synergy' | 'conflict_resolution';
    score: MemoryScore;
    entities_to_create: any[];
    relations_to_create: any[];
}
/**
 * Retrieval context for semantic search
 */
interface RetrievalContext {
    objective: string;
    project_context?: ProjectContext;
    intent?: string;
    domain?: string;
    limit?: number;
}
/**
 * Intelligent Memory Bridge
 *
 * This is the consolidation system that decides:
 * 1. WHAT to persist (scoring & thresholds)
 * 2. WHEN to persist (timing & triggers)
 * 3. HOW to persist (entity/relation structure)
 * 4. WHAT to retrieve (semantic relevance)
 */
export declare class MemoryBridge {
    private mnemosyneClient?;
    private consolidationThreshold;
    private minSuccessRate;
    private noveltyBonus;
    private stats;
    constructor(mnemosyneClient?: any | undefined);
    /**
     * CONSOLIDATION: Mahoraga → Mnemosyne
     *
     * Intelligently decide if an execution pattern should be persisted
     */
    consolidateExecutionPattern(objective: string, plan: OrchestrationPlan, results: AgentResult[], conflicts: Conflict[], gaps: Gap[], projectContext?: ProjectContext): Promise<ConsolidationDecision>;
    /**
     * CONSOLIDATION: Failure contexts
     *
     * Persist critical failures for future avoidance
     */
    consolidateFailure(objective: string, failedAgent: AgentId, error: string, errorCategory: string, precedingAgents: AgentId[], suggestedFix: string, projectContext?: ProjectContext): Promise<ConsolidationDecision>;
    /**
     * RETRIEVAL: Mnemosyne → Mahoraga
     *
     * Semantically retrieve relevant past executions
     */
    retrieveRelevantPatterns(context: RetrievalContext): Promise<ExecutionPattern[]>;
    /**
     * RETRIEVAL: Get failure contexts for similar objectives
     */
    retrieveRelevantFailures(context: RetrievalContext): Promise<FailureContext[]>;
    /**
     * Score an execution memory's value (0.0 to 1.0)
     */
    private scoreExecutionMemory;
    /**
     * Score a failure memory's value
     */
    private scoreFailureMemory;
    /**
     * Determine if error is critical (should always persist)
     */
    private isCriticalFailure;
    /**
     * Score how reusable this pattern is
     */
    private scoreReusability;
    /**
     * Score how novel this pattern is
     */
    private scoreNovelty;
    /**
     * Score the impact of this execution
     */
    private scoreImpact;
    /**
     * Score conflict severity (0 = no conflicts, 1 = severe conflicts)
     */
    private scoreConflictSeverity;
    /**
     * Explain why a score was assigned
     */
    private explainScore;
    /**
     * Build knowledge graph entities and relations for execution pattern
     */
    private buildExecutionGraph;
    /**
     * Build knowledge graph for failure context
     */
    private buildFailureGraph;
    /**
     * Build semantic search query from retrieval context
     */
    private buildRetrievalQuery;
    /**
     * Parse Mnemosyne results into ExecutionPattern objects
     */
    private parseExecutionPatterns;
    /**
     * Parse Mnemosyne results into FailureContext objects
     */
    private parseFailureContexts;
    /**
     * Get bridge statistics (for monitoring health)
     */
    getStats(): {
        consolidation_threshold: number;
        persistence_rate: number;
        retrieval_success_rate: number;
        memories_scored: number;
        memories_persisted: number;
        retrievals_performed: number;
        successful_retrievals: number;
    };
    /**
     * Adapt thresholds based on performance
     * (Mahoraga-style self-improvement)
     */
    adaptThresholds(feedback: {
        retrieval_helped: boolean;
        memory_reused: boolean;
    }): void;
}
/**
 * Global memory bridge instance
 */
export declare const memoryBridge: MemoryBridge;
export {};
//# sourceMappingURL=memory_bridge.d.ts.map