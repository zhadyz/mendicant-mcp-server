/**
 * Instrumented Coordinator Wrapper
 *
 * Wraps the coordinator with event instrumentation for dashboard visibility.
 * This is a transparent wrapper that doesn't modify business logic.
 */
import { coordinateResults as originalCoordinateResults } from './coordinator.js';
import { InstrumentedWrapper } from './events/instrumentation.js';
/**
 * Instrumented coordinateResults function
 *
 * Emits events for:
 * - COORDINATION_STARTED
 * - COORDINATION_COMPLETED
 */
export async function coordinateResults(objective, agent_results, plan, project_context) {
    return InstrumentedWrapper.wrapCoordination(objective, agent_results, () => originalCoordinateResults(objective, agent_results, plan, project_context));
}
//# sourceMappingURL=instrumented_coordinator.js.map