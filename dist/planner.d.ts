import type { OrchestrationPlan, ProjectContext, Constraints } from './types.js';
import type { PastExecution } from './integration/mnemosyne.js';
/**
 * Creates an orchestration plan for a given objective
 *
 * Strategy:
 * 1. Check mnemosyne for similar past executions (if provided)
 * 2. Try to match against common patterns
 * 3. Generate custom plan if no pattern matches
 */
export declare function createPlan(objective: string, context?: ProjectContext, constraints?: Constraints, pastExecutions?: PastExecution[]): Promise<OrchestrationPlan>;
//# sourceMappingURL=planner.d.ts.map