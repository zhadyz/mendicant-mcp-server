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

import { IntelligentSelector, type AgentRecommendation } from '../knowledge/intelligent_selector.js';
import { mnemosyneClient } from '../knowledge/mnemosyne/client.js';
import { SyncQueue } from '../knowledge/mnemosyne/sync.js';
import { SyncStrategyClassifier } from '../knowledge/mnemosyne/sync_strategy.js';
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
export class RetryOrchestrator {
  private selector: IntelligentSelector;
  private syncQueue: SyncQueue;
  private initialized: boolean = false;

  constructor(selector?: IntelligentSelector) {
    this.selector = selector || new IntelligentSelector();
    this.syncQueue = new SyncQueue(mnemosyneClient);
  }

  /**
   * Initialize orchestrator
   * Starts sync queue for background persistence
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[RetryOrchestrator] Already initialized');
      return;
    }

    console.log('[RetryOrchestrator] Initializing...');

    // Start background sync queue
    this.syncQueue.start();

    this.initialized = true;
    console.log('[RetryOrchestrator] Initialized successfully');
  }

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
  async executeWithRetry(
    context: PlanContext,
    task: TaskExecutor,
    strategy?: Partial<RetryStrategy>
  ): Promise<RetryResult> {
    const fullStrategy: RetryStrategy = {
      maxAttempts: 3,
      excludeOnFailure: true,
      learnFromFailure: true,
      fallbackScoreThreshold: 0.5,
      ...strategy
    };

    console.log(`[RetryOrchestrator] Starting execution with retry (max ${fullStrategy.maxAttempts} attempts)`);

    const excludedAgents = new Set<string>();
    const fallbackChain: AgentCapability[] = [];
    const startTime = Date.now();

    // Attempt loop
    for (let attempt = 1; attempt <= fullStrategy.maxAttempts; attempt++) {
      console.log(`[RetryOrchestrator] Attempt ${attempt}/${fullStrategy.maxAttempts}`);

      // Select agent (excluding previously failed ones)
      const agentRecommendation = await this.selectWithExclusions(context, excludedAgents);

      if (!agentRecommendation) {
        console.warn('[RetryOrchestrator] No suitable agents available after exclusions');
        return {
          success: false,
          attemptNumber: attempt,
          fallbackChain,
          error: new Error('No suitable agents available'),
          totalDuration: Date.now() - startTime
        };
      }

      const agent = agentRecommendation.agent;

      // Quality threshold check for fallback agents (attempts > 1)
      if (attempt > 1 && agentRecommendation.score < fullStrategy.fallbackScoreThreshold) {
        console.warn(
          `[RetryOrchestrator] Fallback agent ${agent.name} below quality threshold ` +
          `(${agentRecommendation.score.toFixed(2)} < ${fullStrategy.fallbackScoreThreshold})`
        );

        return {
          success: false,
          attemptNumber: attempt,
          fallbackChain,
          error: new Error(
            `No suitable fallback agent found (quality threshold ${fullStrategy.fallbackScoreThreshold})`
          ),
          totalDuration: Date.now() - startTime
        };
      }

      // Add to fallback chain
      fallbackChain.push(agent);

      // Execute task
      try {
        console.log(
          `[RetryOrchestrator] Executing with agent: ${agent.name} ` +
          `(score: ${agentRecommendation.score.toFixed(2)}, ` +
          `confidence: ${agentRecommendation.confidence.toFixed(2)})`
        );

        const result = await this.executeWithTimeout(task, agent, fullStrategy.timeout);

        console.log(`[RetryOrchestrator] ✓ Success on attempt ${attempt} with ${agent.name}`);

        // Record successful fallback if this wasn't the first attempt
        if (attempt > 1 && fullStrategy.learnFromFailure) {
          await this.recordSuccessfulFallback(context, fallbackChain);
        }

        return {
          success: true,
          agent,
          attemptNumber: attempt,
          fallbackChain,
          totalDuration: Date.now() - startTime
        };

      } catch (error) {
        console.error(`[RetryOrchestrator] ✗ Attempt ${attempt} failed with ${agent.name}:`, error);

        // Record failure for learning
        if (fullStrategy.learnFromFailure) {
          await this.recordFailure(context, agent, error as Error, attempt);
        }

        // Exclude this agent from future attempts
        if (fullStrategy.excludeOnFailure) {
          excludedAgents.add(agent.name);
          console.log(`[RetryOrchestrator] Excluded ${agent.name} from future attempts`);
        }

        // If this was the last attempt, return failure
        if (attempt === fullStrategy.maxAttempts) {
          console.error('[RetryOrchestrator] ✗ All attempts exhausted, giving up');
          return {
            success: false,
            attemptNumber: attempt,
            fallbackChain,
            error: error as Error,
            totalDuration: Date.now() - startTime
          };
        }

        // Otherwise, continue to next attempt
        console.log('[RetryOrchestrator] Retrying with different agent...');
      }
    }

    // Should never reach here (TypeScript exhaustiveness check)
    return {
      success: false,
      attemptNumber: fullStrategy.maxAttempts,
      fallbackChain,
      error: new Error('Max attempts reached'),
      totalDuration: Date.now() - startTime
    };
  }

  /**
   * Select agent excluding previously failed ones
   *
   * Uses IntelligentSelector to get ranked agents, then filters out excluded ones.
   * Returns the highest-ranked available agent.
   */
  private async selectWithExclusions(
    context: PlanContext,
    excludedAgents: Set<string>
  ): Promise<AgentRecommendation | null> {
    console.log(
      `[RetryOrchestrator] Selecting agent (${excludedAgents.size} excluded: ` +
      `${Array.from(excludedAgents).join(', ') || 'none'})`
    );

    // Get ranked recommendations from intelligent selector
    const recommendations = await this.selector.selectAgentsForObjective(
      context.objective,
      context.project_context
    );

    // Filter out excluded agents
    const availableRecommendations = recommendations.filter(
      rec => !excludedAgents.has(rec.agent.name)
    );

    if (availableRecommendations.length === 0) {
      console.warn('[RetryOrchestrator] No available agents after exclusions');
      return null;
    }

    // Return highest-ranked available agent
    const selected = availableRecommendations[0];
    console.log(
      `[RetryOrchestrator] Selected ${selected.agent.name} ` +
      `(score: ${selected.score.toFixed(2)}, ` +
      `confidence: ${selected.confidence.toFixed(2)})`
    );

    return selected;
  }

  /**
   * Execute task with optional timeout
   *
   * If timeout is specified, races task execution against timeout promise.
   * Otherwise executes task normally.
   */
  private async executeWithTimeout(
    task: TaskExecutor,
    agent: AgentCapability,
    timeout?: number
  ): Promise<any> {
    if (!timeout) {
      return await task(agent);
    }

    console.log(`[RetryOrchestrator] Task timeout: ${timeout}ms`);

    return await Promise.race([
      task(agent),
      this.timeoutPromise(timeout)
    ]);
  }

  /**
   * Create timeout promise that rejects after specified milliseconds
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Task timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Record successful fallback pattern (real-time sync)
   *
   * When a fallback agent succeeds after primary failure, record this pattern
   * for future learning. Uses hybrid sync with real-time priority.
   */
  private async recordSuccessfulFallback(
    context: PlanContext,
    fallbackChain: AgentCapability[]
  ): Promise<void> {
    const failedAgents = fallbackChain.slice(0, -1).map(a => a.name);
    const successfulAgent = fallbackChain[fallbackChain.length - 1].name;

    console.log(
      `[RetryOrchestrator] Recording successful fallback: ` +
      `${failedAgents.join(' → ')} → ${successfulAgent}`
    );

    const pattern = {
      type: 'successful_fallback',
      objective: context.objective,
      failedAgents,
      successfulAgent,
      chainLength: fallbackChain.length,
      timestamp: Date.now()
    };

    // Use hybrid sync with real-time priority (critical for learning)
    try {
      await this.syncQueue.hybridSync(
        {
          type: 'record_execution',
          data: {
            agent_id: successfulAgent,
            objective: context.objective,
            success: true,
            tokens_used: 0,
            duration_ms: 0,
            timestamp: Date.now(),
            metadata: {
              fallback: true,
              failedAgents,
              chainLength: fallbackChain.length
            }
          }
        },
        'task_failure' // Pass operation type string, not strategy object
      );

      console.log('[RetryOrchestrator] ✓ Fallback pattern recorded successfully');
    } catch (error) {
      console.error('[RetryOrchestrator] Failed to record fallback pattern:', error);
      // Non-critical error, continue execution
    }
  }

  /**
   * Record failure pattern (real-time sync)
   *
   * Records agent failure for learning. Uses hybrid sync with real-time priority
   * to ensure immediate learning from failures.
   */
  private async recordFailure(
    context: PlanContext,
    agent: AgentCapability,
    error: Error,
    attemptNumber: number
  ): Promise<void> {
    console.log(`[RetryOrchestrator] Recording failure for ${agent.name}: ${error.message}`);

    // Use hybrid sync with real-time priority for failures
    try {
      await this.syncQueue.hybridSync(
        {
          type: 'record_execution',
          data: {
            agent_id: agent.name,
            objective: context.objective,
            success: false,
            tokens_used: 0,
            duration_ms: 0,
            error_message: error.message,
            timestamp: Date.now(),
            metadata: {
              attemptNumber,
              retryContext: true
            }
          }
        },
        'task_failure' // Pass operation type string, not strategy object
      );

      console.log('[RetryOrchestrator] ✓ Failure recorded successfully');
    } catch (syncError) {
      console.error('[RetryOrchestrator] Failed to record failure:', syncError);
      // Non-critical error, continue execution
    }
  }

  /**
   * Get fallback recommendations based on past failures
   *
   * Queries Mnemosyne for successful fallbacks after specific agent failures.
   * Returns list of agents that historically succeeded as fallbacks.
   */
  async getFallbackRecommendations(
    failedAgent: string,
    context: PlanContext
  ): Promise<string[]> {
    console.log(`[RetryOrchestrator] Getting fallback recommendations after ${failedAgent} failed`);

    try {
      // Query Mnemosyne for successful fallback patterns
      const key = `pattern:project:mendicant:successful_fallback`;
      const patterns = await mnemosyneClient.recall(key);

      if (!patterns || patterns.length === 0) {
        console.log('[RetryOrchestrator] No fallback patterns found in memory');
        return [];
      }

      // Filter patterns where failedAgent was in the failed chain
      const relevantPatterns = patterns.filter((p: any) =>
        p.failedAgents?.includes(failedAgent)
      );

      // Extract successful agents and deduplicate
      const recommendations = relevantPatterns
        .map((p: any) => p.successfulAgent)
        .filter((agent: string, index: number, self: string[]) =>
          self.indexOf(agent) === index
        );

      console.log(
        `[RetryOrchestrator] Found ${recommendations.length} fallback recommendations:`,
        recommendations
      );

      return recommendations;

    } catch (error) {
      console.error('[RetryOrchestrator] Failed to get fallback recommendations:', error);
      return [];
    }
  }

  /**
   * Destroy orchestrator and cleanup resources
   * Stops sync queue and flushes remaining operations
   */
  async destroy(): Promise<void> {
    console.log('[RetryOrchestrator] Destroying...');

    // Stop sync queue (flush remaining operations)
    await this.syncQueue.stop(true);

    this.initialized = false;
    console.log('[RetryOrchestrator] Destroyed successfully');
  }
}
