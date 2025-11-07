/**
 * Event Emitter for Dashboard Integration
 *
 * Centralized event infrastructure for tracking orchestration lifecycle.
 * Emits events that the dashboard can consume in real-time.
 */
import { EventEmitter } from 'events';
import type { OrchestrationPlan, AgentResult, ProjectContext } from '../types.js';
/**
 * Event types emitted by the orchestration system
 */
export declare enum OrchestrationEventType {
    PLAN_STARTED = "plan:started",
    PLAN_COMPLETED = "plan:completed",
    PLAN_FAILED = "plan:failed",
    AGENT_SELECTION_STARTED = "agent:selection_started",
    AGENT_SELECTED = "agent:selected",
    AGENT_SCORED = "agent:scored",
    EXECUTION_STARTED = "execution:started",
    EXECUTION_COMPLETED = "execution:completed",
    EXECUTION_FAILED = "execution:failed",
    AGENT_EXECUTION_STARTED = "agent:execution_started",
    AGENT_EXECUTION_COMPLETED = "agent:execution_completed",
    AGENT_EXECUTION_FAILED = "agent:execution_failed",
    AGENT_THINKING = "agent:thinking",
    AGENT_TOOL_USE = "agent:tool_use",
    AGENT_TOOL_RESULT = "agent:tool_result",
    COORDINATION_STARTED = "coordination:started",
    COORDINATION_COMPLETED = "coordination:completed",
    ANALYSIS_STARTED = "analysis:started",
    ANALYSIS_COMPLETED = "analysis:completed",
    RETRY_ATTEMPT = "retry:attempt",
    RETRY_FALLBACK = "retry:fallback",
    RETRY_EXHAUSTED = "retry:exhausted",
    MAHORAGA_PREDICTION = "mahoraga:prediction",
    MAHORAGA_PATTERN_MATCH = "mahoraga:pattern_match",
    MAHORAGA_FAILURE_ANALYSIS = "mahoraga:failure_analysis",
    SAFETY_CHECK = "safety:check",
    CONSTRAINT_VIOLATION = "constraint:violation",
    MEMORY_QUERY = "memory:query",
    MEMORY_STORE = "memory:store"
}
/**
 * Base event payload
 */
export interface BaseEventPayload {
    timestamp: number;
    session_id?: string;
    objective?: string;
}
/**
 * Plan event payloads
 */
export interface PlanStartedPayload extends BaseEventPayload {
    objective: string;
    context?: ProjectContext;
    constraints?: any;
}
export interface PlanCompletedPayload extends BaseEventPayload {
    plan: OrchestrationPlan;
    duration_ms: number;
}
export interface PlanFailedPayload extends BaseEventPayload {
    error: string;
    duration_ms: number;
}
/**
 * Agent selection payloads
 */
export interface AgentSelectionStartedPayload extends BaseEventPayload {
    objective: string;
    available_agents: number;
}
export interface AgentScoredPayload extends BaseEventPayload {
    agent_id: string;
    score: number;
    confidence: number;
    reasoning: string[];
}
export interface AgentSelectedPayload extends BaseEventPayload {
    agent_id: string;
    rank: number;
    score: number;
}
/**
 * Execution payloads
 */
export interface ExecutionStartedPayload extends BaseEventPayload {
    plan: OrchestrationPlan;
    agent_count: number;
}
export interface AgentExecutionStartedPayload extends BaseEventPayload {
    agent_id: string;
    agent_index: number;
    total_agents: number;
    task_description: string;
}
export interface AgentExecutionCompletedPayload extends BaseEventPayload {
    agent_id: string;
    success: boolean;
    duration_ms: number;
    tokens_used?: number;
    output_preview?: string;
}
export interface AgentExecutionFailedPayload extends BaseEventPayload {
    agent_id: string;
    error: string;
    duration_ms: number;
}
/**
 * Coordination payloads
 */
export interface CoordinationStartedPayload extends BaseEventPayload {
    agent_results: AgentResult[];
}
export interface CoordinationCompletedPayload extends BaseEventPayload {
    conflicts_detected: number;
    gaps_identified: number;
    recommendations: string[];
}
/**
 * Retry orchestration payloads
 */
export interface RetryAttemptPayload extends BaseEventPayload {
    attempt_number: number;
    max_attempts: number;
    agent_id: string;
}
export interface RetryFallbackPayload extends BaseEventPayload {
    original_agent: string;
    fallback_agent: string;
    reason: string;
}
/**
 * Mahoraga payloads
 */
export interface MahoragaPredictionPayload extends BaseEventPayload {
    agent_ids: string[];
    predictions: Array<{
        agent_id: string;
        predicted_success_rate: number;
        confidence: number;
    }>;
}
export interface MahoragaPatternMatchPayload extends BaseEventPayload {
    objective: string;
    matched_patterns: number;
    top_pattern_similarity: number;
}
/**
 * Centralized orchestration event emitter
 */
declare class OrchestrationEventEmitter extends EventEmitter {
    private sessionId;
    private eventBuffer;
    private maxBufferSize;
    constructor();
    /**
     * Set current session ID for event correlation
     */
    setSessionId(sessionId: string): void;
    /**
     * Get current session ID
     */
    getSessionId(): string | null;
    /**
     * Emit typed event with automatic session correlation
     */
    emitEvent<T extends BaseEventPayload>(type: OrchestrationEventType, payload: T): void;
    /**
     * Add event to buffer for replay
     */
    private addToBuffer;
    /**
     * Get buffered events (for late subscribers)
     */
    getBufferedEvents(since?: number): Array<{
        type: string;
        payload: any;
    }>;
    /**
     * Clear event buffer
     */
    clearBuffer(): void;
    /**
     * Get event statistics
     */
    getStats(): {
        total_events: number;
        buffer_size: number;
        events_by_type: Record<string, number>;
        listener_count: number;
    };
}
/**
 * Global singleton instance
 */
export declare const orchestrationEvents: OrchestrationEventEmitter;
/**
 * Helper to create session-scoped emitter
 */
export declare function createSessionEmitter(sessionId: string): OrchestrationEventEmitter;
export {};
//# sourceMappingURL=event_emitter.d.ts.map