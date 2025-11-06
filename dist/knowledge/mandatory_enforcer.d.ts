/**
 * MANDATORY AGENT ENFORCER
 *
 * Ensures mandatory agents (oracle, librarian, loveless) are included when required.
 * Prevents critical oversight of required validation/clarification steps.
 */
import type { AgentId, AgentSpec, ProjectContext } from '../types.js';
export interface MandatoryAgentCheck {
    agent_id: AgentId;
    reason: string;
    must_include: boolean;
    suggested_priority: 'critical' | 'high';
}
/**
 * Check which mandatory agents should be included
 */
export declare function checkMandatoryAgents(objective: string, currentAgents: AgentSpec[], projectContext?: ProjectContext): Promise<MandatoryAgentCheck[]>;
/**
 * Add mandatory agents to plan
 */
export declare function addMandatoryAgents(agents: AgentSpec[], mandatoryChecks: MandatoryAgentCheck[], objective: string, context?: ProjectContext): Promise<AgentSpec[]>;
//# sourceMappingURL=mandatory_enforcer.d.ts.map