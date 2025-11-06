import type { OrchestrationPlan, AgentResult } from './types.js';
/**
 * Executes an orchestration plan by spawning Task agents
 * Returns results suitable for coordinator learning
 */
export declare function executePlan(objective: string, plan: OrchestrationPlan, taskToolExecutor: (description: string, prompt: string, subagentType: string, model?: string) => Promise<string>): Promise<AgentResult[]>;
/**
 * Validates that all agents in plan are known
 */
export declare function validatePlanAgents(plan: OrchestrationPlan): {
    valid: boolean;
    unknownAgents: string[];
};
/**
 * Gets list of all known agent IDs
 */
export declare function getKnownAgentIds(): string[];
//# sourceMappingURL=executor.d.ts.map