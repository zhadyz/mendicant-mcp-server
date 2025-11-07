/**
 * Instrumented Planner Wrapper
 *
 * Wraps the core planner with event instrumentation for dashboard visibility.
 * This is a transparent wrapper that doesn't modify business logic.
 */
import type { OrchestrationPlan, ProjectContext, Constraints } from './types.js';
import type { PastExecution } from './integration/mnemosyne.js';
/**
 * Instrumented createPlan function
 *
 * Emits events for:
 * - PLAN_STARTED
 * - PLAN_COMPLETED
 * - PLAN_FAILED
 */
export declare function createPlan(objective: string, context?: ProjectContext, constraints?: Constraints, pastExecutions?: PastExecution[]): Promise<OrchestrationPlan>;
//# sourceMappingURL=instrumented_planner.d.ts.map