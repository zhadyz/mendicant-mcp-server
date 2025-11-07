/**
 * Event Emitter for Dashboard Integration
 *
 * Centralized event infrastructure for tracking orchestration lifecycle.
 * Emits events that the dashboard can consume in real-time.
 */
import { EventEmitter } from 'events';
/**
 * Event types emitted by the orchestration system
 */
export var OrchestrationEventType;
(function (OrchestrationEventType) {
    // Planning phase
    OrchestrationEventType["PLAN_STARTED"] = "plan:started";
    OrchestrationEventType["PLAN_COMPLETED"] = "plan:completed";
    OrchestrationEventType["PLAN_FAILED"] = "plan:failed";
    // Agent selection
    OrchestrationEventType["AGENT_SELECTION_STARTED"] = "agent:selection_started";
    OrchestrationEventType["AGENT_SELECTED"] = "agent:selected";
    OrchestrationEventType["AGENT_SCORED"] = "agent:scored";
    // Execution phase
    OrchestrationEventType["EXECUTION_STARTED"] = "execution:started";
    OrchestrationEventType["EXECUTION_COMPLETED"] = "execution:completed";
    OrchestrationEventType["EXECUTION_FAILED"] = "execution:failed";
    // Agent execution
    OrchestrationEventType["AGENT_EXECUTION_STARTED"] = "agent:execution_started";
    OrchestrationEventType["AGENT_EXECUTION_COMPLETED"] = "agent:execution_completed";
    OrchestrationEventType["AGENT_EXECUTION_FAILED"] = "agent:execution_failed";
    // Agent internal operations (from transcript watcher)
    OrchestrationEventType["AGENT_THINKING"] = "agent:thinking";
    OrchestrationEventType["AGENT_TOOL_USE"] = "agent:tool_use";
    OrchestrationEventType["AGENT_TOOL_RESULT"] = "agent:tool_result";
    // Coordination
    OrchestrationEventType["COORDINATION_STARTED"] = "coordination:started";
    OrchestrationEventType["COORDINATION_COMPLETED"] = "coordination:completed";
    // Analysis
    OrchestrationEventType["ANALYSIS_STARTED"] = "analysis:started";
    OrchestrationEventType["ANALYSIS_COMPLETED"] = "analysis:completed";
    // Retry orchestration
    OrchestrationEventType["RETRY_ATTEMPT"] = "retry:attempt";
    OrchestrationEventType["RETRY_FALLBACK"] = "retry:fallback";
    OrchestrationEventType["RETRY_EXHAUSTED"] = "retry:exhausted";
    // Mahoraga learning
    OrchestrationEventType["MAHORAGA_PREDICTION"] = "mahoraga:prediction";
    OrchestrationEventType["MAHORAGA_PATTERN_MATCH"] = "mahoraga:pattern_match";
    OrchestrationEventType["MAHORAGA_FAILURE_ANALYSIS"] = "mahoraga:failure_analysis";
    // Safety and validation
    OrchestrationEventType["SAFETY_CHECK"] = "safety:check";
    OrchestrationEventType["CONSTRAINT_VIOLATION"] = "constraint:violation";
    // Mnemosyne integration
    OrchestrationEventType["MEMORY_QUERY"] = "memory:query";
    OrchestrationEventType["MEMORY_STORE"] = "memory:store";
})(OrchestrationEventType || (OrchestrationEventType = {}));
/**
 * Centralized orchestration event emitter
 */
class OrchestrationEventEmitter extends EventEmitter {
    sessionId = null;
    eventBuffer = [];
    maxBufferSize = 1000;
    constructor() {
        super();
        this.setMaxListeners(50); // Support multiple dashboard connections
    }
    /**
     * Set current session ID for event correlation
     */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    /**
     * Get current session ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Emit typed event with automatic session correlation
     */
    emitEvent(type, payload) {
        const enrichedPayload = {
            ...payload,
            timestamp: payload.timestamp || Date.now(),
            session_id: payload.session_id || this.sessionId || undefined
        };
        // Emit to listeners
        this.emit(type, enrichedPayload);
        this.emit('*', { type, payload: enrichedPayload });
        // Buffer for late subscribers
        this.addToBuffer(type, enrichedPayload);
    }
    /**
     * Add event to buffer for replay
     */
    addToBuffer(type, payload) {
        this.eventBuffer.push({ type, payload });
        // Trim buffer if exceeds max size
        if (this.eventBuffer.length > this.maxBufferSize) {
            this.eventBuffer = this.eventBuffer.slice(-this.maxBufferSize);
        }
    }
    /**
     * Get buffered events (for late subscribers)
     */
    getBufferedEvents(since) {
        if (since) {
            return this.eventBuffer.filter(e => e.payload.timestamp >= since);
        }
        return [...this.eventBuffer];
    }
    /**
     * Clear event buffer
     */
    clearBuffer() {
        this.eventBuffer = [];
    }
    /**
     * Get event statistics
     */
    getStats() {
        const typeCount = {};
        for (const event of this.eventBuffer) {
            typeCount[event.type] = (typeCount[event.type] || 0) + 1;
        }
        return {
            total_events: this.eventBuffer.length,
            buffer_size: this.maxBufferSize,
            events_by_type: typeCount,
            listener_count: this.listenerCount('*')
        };
    }
}
/**
 * Global singleton instance
 */
export const orchestrationEvents = new OrchestrationEventEmitter();
/**
 * Helper to create session-scoped emitter
 */
export function createSessionEmitter(sessionId) {
    const emitter = new OrchestrationEventEmitter();
    emitter.setSessionId(sessionId);
    return emitter;
}
//# sourceMappingURL=event_emitter.js.map