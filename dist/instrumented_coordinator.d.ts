/**
 * Instrumented Coordinator Wrapper
 *
 * Wraps the coordinator with event instrumentation for dashboard visibility.
 * This is a transparent wrapper that doesn't modify business logic.
 */
import type { AgentResult, ProjectContext } from './types.js';
/**
 * Instrumented coordinateResults function
 *
 * Emits events for:
 * - COORDINATION_STARTED
 * - COORDINATION_COMPLETED
 */
export declare function coordinateResults(objective: string, agent_results: AgentResult[], plan?: any, project_context?: ProjectContext): Promise<import("./types.js").CoordinationResult>;
//# sourceMappingURL=instrumented_coordinator.d.ts.map