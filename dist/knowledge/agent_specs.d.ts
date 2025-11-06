import type { AgentCapability, AgentId } from '../types.js';
import { AGENT_CAPABILITIES } from './agent_capabilities.js';
export { AGENT_CAPABILITIES };
export declare function selectAgents(requirements: string[]): AgentId[];
export declare function estimateTokens(agents: AgentId[]): number;
/**
 * Registry-aware version of selectAgents - uses learned agents + hardcoded defaults
 */
export declare function selectAgentsFromRegistry(requirements: string[]): Promise<AgentId[]>;
/**
 * Registry-aware version of estimateTokens - uses learned token averages
 */
export declare function estimateTokensFromRegistry(agents: AgentId[]): Promise<number>;
/**
 * Get agent spec from registry (with learned data merged in)
 */
export declare function getAgentSpec(agentId: AgentId): Promise<AgentCapability | null>;
//# sourceMappingURL=agent_specs.d.ts.map