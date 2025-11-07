/**
 * Retry Orchestrator - Intelligent Sequential Fallback
 *
 * PHASE 3: Automatic retry with fallback orchestration
 *
 * Features:
 * - Sequential fallback (one agent at a time for cost efficiency)
 * - Max 3 attempts per task
 * - Quality threshold: fallback agents must score ≥0.5
 * - Learning loops: Records failures and successful fallbacks in Mnemosyne
 * - Hybrid sync: Real-time sync for failure/success patterns
 * - Exclusion tracking: Don't retry with failed agents
 *
 * Architecture:
 * - Uses IntelligentSelector for agent ranking
 * - Integrates with SyncQueue for hybrid real-time/async persistence
 * - Learns from failures to improve future fallback recommendations
 */
import { IntelligentSelector } from '../knowledge/intelligent_selector.js';
import type { AgentCapability, ProjectContext } from '../types.js';
/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
    /** Maximum number of attempts before giving up */
    maxAttempts: number;
    /** Exclude failed agents from future attempts */
    excludeOnFailure: boolean;
    /** Record failures for learning */
    learnFromFailure: boolean;
    /** Minimum score for fallback agents (0.0 - 1.0) */
    fallbackScoreThreshold: number;
    /** Optional timeout for task execution (milliseconds) */
    timeout?: number;
}
/**
 * Context for planning and agent selection
 */
export interface PlanContext {
    /** The objective to accomplish */
    objective: string;
    /** Optional project context */
    project_context?: ProjectContext;
    /** Optional constraints */
    constraints?: any;
}
/**
 * Result of retry execution
 */
export interface RetryResult {
    /** Whether task succeeded */
    success: boolean;
    /** Agent that succeeded (if any) */
    agent?: AgentCapability;
    /** Which attempt number succeeded */
    attemptNumber: number;
    /** Chain of agents attempted (in order) */
    fallbackChain: AgentCapability[];
    /** Error if all attempts failed */
    error?: Error;
    /** Total time spent across all attempts */
    totalDuration: number;
}
/**
 * Task executor function type
 * Takes an agent and returns result (or throws on failure)
 */
export type TaskExecutor = (agent: AgentCapability) => Promise<any>;
/**
 * Retry Orchestrator with Intelligent Sequential Fallback
 *
 * Key Design Principles:
 * 1. Sequential execution (not parallel) - cost efficient, one agent at a time
 * 2. Quality threshold enforcement - fallback agents must be high quality (≥0.5 score)
 * 3. Learning from failures - real-time sync to Mnemosyne for immediate learning
 * 4. Exclusion tracking - never retry with an agent that already failed
 * 5. Graceful degradation - works even if Mnemosyne unavailable
 */
export declare class RetryOrchestrator {
    private selector;
    private syncQueue;
    private initialized;
    constructor(selector?: IntelligentSelector);
    /**
     * Initialize orchestrator
     * Starts sync queue for background persistence
     */
    initialize(): Promise<void>;
    /**
     * Execute task with automatic retry and sequential fallback
     *
     * Algorithm:
     * 1. Get ranked agents from IntelligentSelector
     * 2. Try primary agent
     * 3. If fails, exclude it and select next best agent (with quality check)
     * 4. Repeat up to maxAttempts
     * 5. Record all failures and successes for learning
     *
     * @param context Planning context (objective + project context)
     * @param task Task executor function
     * @param strategy Retry strategy configuration
     * @returns RetryResult with success status and execution details
     */
    executeWithRetry(context: PlanContext, task: TaskExecutor, strategy?: Partial<RetryStrategy>): Promise<RetryResult>;
    /**
     * Select agent excluding previously failed ones
     *
     * Uses IntelligentSelector to get ranked agents, then filters out excluded ones.
     * Returns the highest-ranked available agent.
     */
    private selectWithExclusions;
    /**
     * Execute task with optional timeout
     *
     * If timeout is specified, races task execution against timeout promise.
     * Otherwise executes task normally.
     */
    private executeWithTimeout;
    /**
     * Create timeout promise that rejects after specified milliseconds
     */
    private timeoutPromise;
    /**
     * Record successful fallback pattern (real-time sync)
     *
     * When a fallback agent succeeds after primary failure, record this pattern
     * for future learning. Uses hybrid sync with real-time priority.
     */
    private recordSuccessfulFallback;
    /**
     * Record failure pattern (real-time sync)
     *
     * Records agent failure for learning. Uses hybrid sync with real-time priority
     * to ensure immediate learning from failures.
     */
    private recordFailure;
    /**
     * Get fallback recommendations based on past failures
     *
     * Queries Mnemosyne for successful fallbacks after specific agent failures.
     * Returns list of agents that historically succeeded as fallbacks.
     */
    getFallbackRecommendations(failedAgent: string, context: PlanContext): Promise<string[]>;
    /**
     * Destroy orchestrator and cleanup resources
     * Stops sync queue and flushes remaining operations
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=retry_orchestrator.d.ts.map