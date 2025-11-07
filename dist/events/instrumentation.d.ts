/**
 * Instrumentation Layer
 *
 * Provides non-invasive instrumentation for core orchestration components.
 * Emits events without modifying core business logic.
 */
import type { OrchestrationPlan, ProjectContext, Constraints, AgentResult } from '../types.js';
/**
 * Instrumentation for planning phase
 */
export declare class PlannerInstrumentation {
    /**
     * Record plan start
     */
    static planStarted(objective: string, context?: ProjectContext, constraints?: Constraints): void;
    /**
     * Record plan completion
     */
    static planCompleted(plan: OrchestrationPlan, startTime: number): void;
    /**
     * Record plan failure
     */
    static planFailed(error: string, startTime: number, objective?: string): void;
}
/**
 * Instrumentation for agent selection
 */
export declare class SelectorInstrumentation {
    /**
     * Record selection start
     */
    static selectionStarted(objective: string, availableAgentCount: number): void;
    /**
     * Record agent scoring
     */
    static agentScored(agentId: string, score: number, confidence: number, reasoning: string[]): void;
    /**
     * Record agent selection
     */
    static agentSelected(agentId: string, rank: number, score: number): void;
}
/**
 * Instrumentation for coordination phase
 */
export declare class CoordinatorInstrumentation {
    /**
     * Record coordination start
     */
    static coordinationStarted(agentResults: AgentResult[], objective: string): void;
    /**
     * Record coordination completion
     */
    static coordinationCompleted(conflictsDetected: number, gapsIdentified: number, recommendations: string[], objective: string): void;
}
/**
 * Instrumentation for Mahoraga adaptive intelligence
 */
export declare class MahoragaInstrumentation {
    /**
     * Record agent predictions
     */
    static predictionMade(agentIds: string[], predictions: Array<{
        agent_id: string;
        predicted_success_rate: number;
        confidence: number;
    }>, objective: string): void;
    /**
     * Record pattern matching
     */
    static patternMatched(objective: string, matchedPatterns: number, topSimilarity: number): void;
    /**
     * Record failure analysis
     */
    static failureAnalyzed(objective: string, failedAgentId: string, analysis: any): void;
}
/**
 * Instrumentation for safety and validation
 */
export declare class SafetyInstrumentation {
    /**
     * Record safety check
     */
    static safetyCheck(objective: string, threatLevel: string, threats: any[], blocked: boolean): void;
    /**
     * Record constraint violation
     */
    static constraintViolation(constraint: string, violation: string, objective?: string): void;
}
/**
 * Instrumentation for memory operations
 */
export declare class MemoryInstrumentation {
    /**
     * Record memory query
     */
    static memoryQuery(queryType: string, query: string, resultsCount: number): void;
    /**
     * Record memory store
     */
    static memoryStore(storeType: string, entity: string, success: boolean): void;
}
/**
 * Wrapper functions for transparent instrumentation
 */
export declare class InstrumentedWrapper {
    /**
     * Wrap plan creation with instrumentation
     */
    static wrapPlanCreation<T>(objective: string, context: ProjectContext | undefined, constraints: Constraints | undefined, planFn: () => Promise<T>): Promise<T>;
    /**
     * Wrap coordination with instrumentation
     */
    static wrapCoordination<T>(objective: string, agentResults: AgentResult[], coordinateFn: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=instrumentation.d.ts.map