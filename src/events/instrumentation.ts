/**
 * Instrumentation Layer
 *
 * Provides non-invasive instrumentation for core orchestration components.
 * Emits events without modifying core business logic.
 */

import {
  orchestrationEvents,
  OrchestrationEventType,
  type PlanStartedPayload,
  type PlanCompletedPayload,
  type PlanFailedPayload,
  type AgentSelectionStartedPayload,
  type AgentScoredPayload,
  type AgentSelectedPayload,
  type CoordinationStartedPayload,
  type CoordinationCompletedPayload,
  type MahoragaPredictionPayload,
  type MahoragaPatternMatchPayload
} from './event_emitter.js';
import type {
  OrchestrationPlan,
  ProjectContext,
  Constraints,
  AgentResult,
  AgentCapability
} from '../types.js';

/**
 * Instrumentation for planning phase
 */
export class PlannerInstrumentation {
  /**
   * Record plan start
   */
  static planStarted(objective: string, context?: ProjectContext, constraints?: Constraints) {
    const payload: PlanStartedPayload = {
      timestamp: Date.now(),
      objective,
      context,
      constraints
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.PLAN_STARTED, payload);
  }

  /**
   * Record plan completion
   */
  static planCompleted(plan: OrchestrationPlan, startTime: number) {
    const payload: PlanCompletedPayload = {
      timestamp: Date.now(),
      plan,
      duration_ms: Date.now() - startTime,
      objective: plan.reasoning
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.PLAN_COMPLETED, payload);
  }

  /**
   * Record plan failure
   */
  static planFailed(error: string, startTime: number, objective?: string) {
    const payload: PlanFailedPayload = {
      timestamp: Date.now(),
      error,
      duration_ms: Date.now() - startTime,
      objective
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.PLAN_FAILED, payload);
  }
}

/**
 * Instrumentation for agent selection
 */
export class SelectorInstrumentation {
  /**
   * Record selection start
   */
  static selectionStarted(objective: string, availableAgentCount: number) {
    const payload: AgentSelectionStartedPayload = {
      timestamp: Date.now(),
      objective,
      available_agents: availableAgentCount
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_SELECTION_STARTED, payload);
  }

  /**
   * Record agent scoring
   */
  static agentScored(
    agentId: string,
    score: number,
    confidence: number,
    reasoning: string[]
  ) {
    const payload: AgentScoredPayload = {
      timestamp: Date.now(),
      agent_id: agentId,
      score,
      confidence,
      reasoning
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_SCORED, payload);
  }

  /**
   * Record agent selection
   */
  static agentSelected(agentId: string, rank: number, score: number) {
    const payload: AgentSelectedPayload = {
      timestamp: Date.now(),
      agent_id: agentId,
      rank,
      score
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_SELECTED, payload);
  }
}

/**
 * Instrumentation for coordination phase
 */
export class CoordinatorInstrumentation {
  /**
   * Record coordination start
   */
  static coordinationStarted(agentResults: AgentResult[], objective: string) {
    const payload: CoordinationStartedPayload = {
      timestamp: Date.now(),
      agent_results: agentResults,
      objective
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.COORDINATION_STARTED, payload);
  }

  /**
   * Record coordination completion
   */
  static coordinationCompleted(
    conflictsDetected: number,
    gapsIdentified: number,
    recommendations: string[],
    objective: string
  ) {
    const payload: CoordinationCompletedPayload = {
      timestamp: Date.now(),
      conflicts_detected: conflictsDetected,
      gaps_identified: gapsIdentified,
      recommendations,
      objective
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.COORDINATION_COMPLETED, payload);
  }
}

/**
 * Instrumentation for Mahoraga adaptive intelligence
 */
export class MahoragaInstrumentation {
  /**
   * Record agent predictions
   */
  static predictionMade(
    agentIds: string[],
    predictions: Array<{
      agent_id: string;
      predicted_success_rate: number;
      confidence: number;
    }>,
    objective: string
  ) {
    const payload: MahoragaPredictionPayload = {
      timestamp: Date.now(),
      agent_ids: agentIds,
      predictions,
      objective
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.MAHORAGA_PREDICTION, payload);
  }

  /**
   * Record pattern matching
   */
  static patternMatched(
    objective: string,
    matchedPatterns: number,
    topSimilarity: number
  ) {
    const payload: MahoragaPatternMatchPayload = {
      timestamp: Date.now(),
      objective,
      matched_patterns: matchedPatterns,
      top_pattern_similarity: topSimilarity
    };

    orchestrationEvents.emitEvent(OrchestrationEventType.MAHORAGA_PATTERN_MATCH, payload);
  }

  /**
   * Record failure analysis
   */
  static failureAnalyzed(
    objective: string,
    failedAgentId: string,
    analysis: any
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.MAHORAGA_FAILURE_ANALYSIS, {
      timestamp: Date.now(),
      objective,
      failed_agent_id: failedAgentId,
      analysis
    });
  }
}

/**
 * Instrumentation for safety and validation
 */
export class SafetyInstrumentation {
  /**
   * Record safety check
   */
  static safetyCheck(
    objective: string,
    threatLevel: string,
    threats: any[],
    blocked: boolean
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.SAFETY_CHECK, {
      timestamp: Date.now(),
      objective,
      threat_level: threatLevel,
      detected_threats: threats,
      blocked
    });
  }

  /**
   * Record constraint violation
   */
  static constraintViolation(
    constraint: string,
    violation: string,
    objective?: string
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.CONSTRAINT_VIOLATION, {
      timestamp: Date.now(),
      constraint,
      violation,
      objective
    });
  }
}

/**
 * Instrumentation for memory operations
 */
export class MemoryInstrumentation {
  /**
   * Record memory query
   */
  static memoryQuery(
    queryType: string,
    query: string,
    resultsCount: number
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.MEMORY_QUERY, {
      timestamp: Date.now(),
      query_type: queryType,
      query,
      results_count: resultsCount
    });
  }

  /**
   * Record memory store
   */
  static memoryStore(
    storeType: string,
    entity: string,
    success: boolean
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.MEMORY_STORE, {
      timestamp: Date.now(),
      store_type: storeType,
      entity,
      success
    });
  }
}

/**
 * Wrapper functions for transparent instrumentation
 */
export class InstrumentedWrapper {
  /**
   * Wrap plan creation with instrumentation
   */
  static async wrapPlanCreation<T>(
    objective: string,
    context: ProjectContext | undefined,
    constraints: Constraints | undefined,
    planFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    PlannerInstrumentation.planStarted(objective, context, constraints);

    try {
      const result = await planFn();
      PlannerInstrumentation.planCompleted(result as any, startTime);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      PlannerInstrumentation.planFailed(errorMsg, startTime, objective);
      throw error;
    }
  }

  /**
   * Wrap coordination with instrumentation
   */
  static async wrapCoordination<T>(
    objective: string,
    agentResults: AgentResult[],
    coordinateFn: () => Promise<T>
  ): Promise<T> {
    CoordinatorInstrumentation.coordinationStarted(agentResults, objective);

    try {
      const result = await coordinateFn();

      // Extract coordination metrics from result
      const conflicts = (result as any).conflicts?.length || 0;
      const gaps = (result as any).gaps?.length || 0;
      const recommendations = (result as any).recommendations || [];

      CoordinatorInstrumentation.coordinationCompleted(
        conflicts,
        gaps,
        recommendations,
        objective
      );

      return result;
    } catch (error) {
      throw error;
    }
  }
}
