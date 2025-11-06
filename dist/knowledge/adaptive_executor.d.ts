/**
 * Adaptive Executor - Real-Time Plan Modification
 *
 * This is what makes Mendicant truly adaptive like Mahoraga - the ability to
 * modify execution plans IN REAL-TIME based on what's actually happening.
 *
 * Traditional executors follow a fixed plan. Adaptive executors:
 * - Monitor execution health in real-time
 * - Detect when plans are failing
 * - Generate recovery strategies on-the-fly
 * - Substitute agents when needed
 * - Adapt to resource constraints dynamically
 * - Learn optimal recovery patterns
 *
 * This is the difference between "learning from past executions" and
 * "adapting DURING execution" - true Mahoraga-style adaptation.
 */
import { AgentId, ProjectContext } from '../types.js';
export interface ExecutionState {
    objective: string;
    original_plan: ExecutionPlan;
    current_plan: ExecutionPlan;
    completed_agents: AgentResult[];
    pending_agents: AgentId[];
    current_agent?: AgentId;
    status: 'running' | 'adapting' | 'recovering' | 'completed' | 'failed';
    adaptations: Adaptation[];
    resource_usage: ResourceUsage;
    start_time: number;
    context?: ProjectContext;
}
export interface ExecutionPlan {
    agents: AgentId[];
    execution_mode: 'sequential' | 'parallel' | 'hybrid';
    estimated_duration_ms: number;
    estimated_tokens: number;
    confidence: number;
}
export interface AgentResult {
    agent_id: AgentId;
    success: boolean;
    output?: string;
    error?: string;
    duration_ms: number;
    tokens_used: number;
    timestamp: number;
}
export interface Adaptation {
    type: 'agent_substitution' | 'plan_refinement' | 'recovery_strategy' | 'resource_optimization';
    reason: string;
    original_plan: AgentId[];
    adapted_plan: AgentId[];
    confidence: number;
    timestamp: number;
}
export interface ResourceUsage {
    total_duration_ms: number;
    total_tokens: number;
    max_parallel_agents: number;
    budget_remaining_ms?: number;
    budget_remaining_tokens?: number;
}
export interface RecoveryStrategy {
    strategy_type: 'retry' | 'substitute' | 'skip' | 'rollback' | 'alternative_path';
    failed_agent: AgentId;
    replacement_agents: AgentId[];
    confidence: number;
    reasoning: string;
}
/**
 * Adaptive Executor - Monitors and modifies execution in real-time
 */
export declare class AdaptiveExecutor {
    private execution_state?;
    private adaptation_history;
    private recovery_patterns;
    /**
     * Initialize adaptive execution
     */
    startExecution(objective: string, initial_plan: ExecutionPlan, context?: ProjectContext): Promise<ExecutionState>;
    /**
     * Process agent result and adapt if needed
     */
    processAgentResult(result: AgentResult): Promise<ExecutionState>;
    /**
     * Handle agent failure with recovery strategy
     */
    private handleFailure;
    /**
     * Find or generate recovery strategy for failed agent
     */
    private findRecoveryStrategy;
    /**
     * Generate new recovery strategy
     */
    private generateRecoveryStrategy;
    /**
     * Classify error type
     */
    private classifyError;
    /**
     * Find alternative agents for failed agent
     */
    private findAlternativeAgents;
    /**
     * Apply recovery strategy to execution plan
     */
    private applyRecoveryStrategy;
    /**
     * Learn recovery pattern for future use
     */
    private learnRecoveryPattern;
    /**
     * Check if plan needs optimization based on execution progress
     */
    private shouldOptimizePlan;
    /**
     * Optimize plan based on current execution state
     */
    private optimizePlan;
    /**
     * Remove redundant agents from plan
     */
    private removeRedundantAgents;
    /**
     * Finalize execution and send feedback
     */
    private finalizeExecution;
    /**
     * Get current execution state
     */
    getState(): ExecutionState | undefined;
    /**
     * Get adaptation history
     */
    getAdaptationHistory(): Adaptation[];
    /**
     * Get learned recovery patterns
     */
    getRecoveryPatterns(): Map<string, RecoveryStrategy[]>;
}
/**
 * Singleton instance
 */
export declare const adaptiveExecutor: AdaptiveExecutor;
//# sourceMappingURL=adaptive_executor.d.ts.map