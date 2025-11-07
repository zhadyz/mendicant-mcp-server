/**
 * Event Emitter for Dashboard Integration
 *
 * Centralized event infrastructure for tracking orchestration lifecycle.
 * Emits events that the dashboard can consume in real-time.
 */

import { EventEmitter } from 'events';
import type {
  OrchestrationPlan,
  AgentResult,
  ProjectContext,
  AgentCapability
} from '../types.js';

/**
 * Event types emitted by the orchestration system
 */
export enum OrchestrationEventType {
  // Planning phase
  PLAN_STARTED = 'plan:started',
  PLAN_COMPLETED = 'plan:completed',
  PLAN_FAILED = 'plan:failed',

  // Agent selection
  AGENT_SELECTION_STARTED = 'agent:selection_started',
  AGENT_SELECTED = 'agent:selected',
  AGENT_SCORED = 'agent:scored',

  // Execution phase
  EXECUTION_STARTED = 'execution:started',
  EXECUTION_COMPLETED = 'execution:completed',
  EXECUTION_FAILED = 'execution:failed',

  // Agent execution
  AGENT_EXECUTION_STARTED = 'agent:execution_started',
  AGENT_EXECUTION_COMPLETED = 'agent:execution_completed',
  AGENT_EXECUTION_FAILED = 'agent:execution_failed',

  // Agent internal operations (from transcript watcher)
  AGENT_THINKING = 'agent:thinking',
  AGENT_TOOL_USE = 'agent:tool_use',
  AGENT_TOOL_RESULT = 'agent:tool_result',

  // Coordination
  COORDINATION_STARTED = 'coordination:started',
  COORDINATION_COMPLETED = 'coordination:completed',

  // Analysis
  ANALYSIS_STARTED = 'analysis:started',
  ANALYSIS_COMPLETED = 'analysis:completed',

  // Retry orchestration
  RETRY_ATTEMPT = 'retry:attempt',
  RETRY_FALLBACK = 'retry:fallback',
  RETRY_EXHAUSTED = 'retry:exhausted',

  // Mahoraga learning
  MAHORAGA_PREDICTION = 'mahoraga:prediction',
  MAHORAGA_PATTERN_MATCH = 'mahoraga:pattern_match',
  MAHORAGA_FAILURE_ANALYSIS = 'mahoraga:failure_analysis',

  // Safety and validation
  SAFETY_CHECK = 'safety:check',
  CONSTRAINT_VIOLATION = 'constraint:violation',

  // Mnemosyne integration
  MEMORY_QUERY = 'memory:query',
  MEMORY_STORE = 'memory:store'
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
class OrchestrationEventEmitter extends EventEmitter {
  private sessionId: string | null = null;
  private eventBuffer: Array<{ type: string; payload: any }> = [];
  private maxBufferSize = 1000;

  constructor() {
    super();
    this.setMaxListeners(50); // Support multiple dashboard connections
  }

  /**
   * Set current session ID for event correlation
   */
  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Emit typed event with automatic session correlation
   */
  emitEvent<T extends BaseEventPayload>(
    type: OrchestrationEventType,
    payload: T
  ) {
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
  private addToBuffer(type: string, payload: any) {
    this.eventBuffer.push({ type, payload });

    // Trim buffer if exceeds max size
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Get buffered events (for late subscribers)
   */
  getBufferedEvents(since?: number): Array<{ type: string; payload: any }> {
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
    const typeCount: Record<string, number> = {};
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
export function createSessionEmitter(sessionId: string): OrchestrationEventEmitter {
  const emitter = new OrchestrationEventEmitter();
  emitter.setSessionId(sessionId);
  return emitter;
}
