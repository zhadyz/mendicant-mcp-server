/**
 * Agent Capability Parser
 *
 * Extracts agent capabilities from natural language descriptions.
 * Used for parsing dynamically discovered agents from MCP context.
 */
import type { AgentCapability, AgentId } from '../types.js';
/**
 * Agent category based on specialization
 */
export type AgentCategory = 'development' | 'architecture' | 'qa_security' | 'documentation' | 'research' | 'design' | 'analysis' | 'planning' | 'operations' | 'unknown';
/**
 * Raw agent information from MCP discovery
 */
export interface RawAgentInfo {
    agent_id: AgentId;
    description?: string;
    tools?: string[];
    metadata?: Record<string, any>;
}
/**
 * Parse agent description and extract capabilities
 */
export declare function parseAgentFromDescription(raw: RawAgentInfo): AgentCapability;
/**
 * Categorize agent based on name and description
 */
export declare function categorizeAgent(agentId: AgentId, description: string): AgentCategory;
/**
 * Validate and normalize agent capability
 */
export declare function normalizeAgentCapability(agent: Partial<AgentCapability>): AgentCapability;
//# sourceMappingURL=agent_capability_parser.d.ts.map