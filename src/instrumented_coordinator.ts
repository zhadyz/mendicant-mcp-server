/**
 * Instrumented Coordinator Wrapper
 *
 * Wraps the coordinator with event instrumentation for dashboard visibility.
 * This is a transparent wrapper that doesn't modify business logic.
 */

import { coordinateResults as originalCoordinateResults } from './coordinator.js';
import { InstrumentedWrapper } from './events/instrumentation.js';
import type { AgentResult, ProjectContext } from './types.js';

/**
 * Instrumented coordinateResults function
 *
 * Emits events for:
 * - COORDINATION_STARTED
 * - COORDINATION_COMPLETED
 */
export async function coordinateResults(
  objective: string,
  agent_results: AgentResult[],
  plan?: any,
  project_context?: ProjectContext
) {
  return InstrumentedWrapper.wrapCoordination(
    objective,
    agent_results,
    () => originalCoordinateResults(objective, agent_results, plan, project_context)
  );
}
