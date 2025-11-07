/**
 * Instrumented Planner Wrapper
 *
 * Wraps the core planner with event instrumentation for dashboard visibility.
 * This is a transparent wrapper that doesn't modify business logic.
 */
import { createPlan as originalCreatePlan } from './planner.js';
import { InstrumentedWrapper } from './events/instrumentation.js';
/**
 * Instrumented createPlan function
 *
 * Emits events for:
 * - PLAN_STARTED
 * - PLAN_COMPLETED
 * - PLAN_FAILED
 */
export async function createPlan(objective, context, constraints, pastExecutions) {
    return InstrumentedWrapper.wrapPlanCreation(objective, context, constraints, () => originalCreatePlan(objective, context, constraints, pastExecutions));
}
//# sourceMappingURL=instrumented_planner.js.map