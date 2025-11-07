/**
 * Instrumentation Layer
 *
 * Provides non-invasive instrumentation for core orchestration components.
 * Emits events without modifying core business logic.
 */
import { orchestrationEvents, OrchestrationEventType } from './event_emitter.js';
/**
 * Instrumentation for planning phase
 */
export class PlannerInstrumentation {
    /**
     * Record plan start
     */
    static planStarted(objective, context, constraints) {
        const payload = {
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
    static planCompleted(plan, startTime) {
        const payload = {
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
    static planFailed(error, startTime, objective) {
        const payload = {
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
    static selectionStarted(objective, availableAgentCount) {
        const payload = {
            timestamp: Date.now(),
            objective,
            available_agents: availableAgentCount
        };
        orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_SELECTION_STARTED, payload);
    }
    /**
     * Record agent scoring
     */
    static agentScored(agentId, score, confidence, reasoning) {
        const payload = {
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
    static agentSelected(agentId, rank, score) {
        const payload = {
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
    static coordinationStarted(agentResults, objective) {
        const payload = {
            timestamp: Date.now(),
            agent_results: agentResults,
            objective
        };
        orchestrationEvents.emitEvent(OrchestrationEventType.COORDINATION_STARTED, payload);
    }
    /**
     * Record coordination completion
     */
    static coordinationCompleted(conflictsDetected, gapsIdentified, recommendations, objective) {
        const payload = {
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
    static predictionMade(agentIds, predictions, objective) {
        const payload = {
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
    static patternMatched(objective, matchedPatterns, topSimilarity) {
        const payload = {
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
    static failureAnalyzed(objective, failedAgentId, analysis) {
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
    static safetyCheck(objective, threatLevel, threats, blocked) {
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
    static constraintViolation(constraint, violation, objective) {
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
    static memoryQuery(queryType, query, resultsCount) {
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
    static memoryStore(storeType, entity, success) {
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
    static async wrapPlanCreation(objective, context, constraints, planFn) {
        const startTime = Date.now();
        PlannerInstrumentation.planStarted(objective, context, constraints);
        try {
            const result = await planFn();
            PlannerInstrumentation.planCompleted(result, startTime);
            return result;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            PlannerInstrumentation.planFailed(errorMsg, startTime, objective);
            throw error;
        }
    }
    /**
     * Wrap coordination with instrumentation
     */
    static async wrapCoordination(objective, agentResults, coordinateFn) {
        CoordinatorInstrumentation.coordinationStarted(agentResults, objective);
        try {
            const result = await coordinateFn();
            // Extract coordination metrics from result
            const conflicts = result.conflicts?.length || 0;
            const gaps = result.gaps?.length || 0;
            const recommendations = result.recommendations || [];
            CoordinatorInstrumentation.coordinationCompleted(conflicts, gaps, recommendations, objective);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=instrumentation.js.map