import type { AgentResult, CoordinationResult, ProjectContext, OrchestrationPlan } from './types.js';
/**
 * Coordinates and synthesizes results from multiple agents
 *
 * This handles:
 * - Combining outputs into unified response
 * - Detecting conflicts between agents
 * - Identifying gaps in coverage
 * - Making recommendations for next steps
 * - Recording feedback for passive learning
 * - Recording execution patterns for Mahoraga adaptive learning
 */
export declare function coordinateResults(objective: string, agentResults: AgentResult[], plan?: OrchestrationPlan, projectContext?: ProjectContext): Promise<CoordinationResult>;
//# sourceMappingURL=coordinator.d.ts.map