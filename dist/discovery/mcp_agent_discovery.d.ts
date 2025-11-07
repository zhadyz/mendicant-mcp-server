/**
 * MCP Agent Discovery
 *
 * Dynamically discovers agents available in current Claude Code session via MCP introspection.
 * Queries the environment for available subagent_types and extracts capabilities.
 *
 * Discovery Strategy:
 * 1. Parse available subagent_types from Claude context (if exposed)
 * 2. Extract specializations from agent descriptions
 * 3. Infer capabilities from agent names (pattern matching)
 * 4. Map to domain/task_type/intent compatibility
 */
import type { AgentCapability, AgentId } from '../types.js';
import { type AgentCategory } from './agent_capability_parser.js';
/**
 * MCP Agent Discovery Service
 */
export declare class MCPAgentDiscovery {
    private discoveredAgents;
    private lastDiscoveryTime;
    private discoveryInProgress;
    constructor();
    /**
     * Discover all available agents in current Claude Code session
     */
    discoverAvailableAgents(): Promise<AgentCapability[]>;
    /**
     * Get a specific discovered agent by ID
     */
    getAgent(agentId: AgentId): AgentCapability | null;
    /**
     * Get all discovered agents
     */
    getAllAgents(): AgentCapability[];
    /**
     * Check if discovery is stale and needs refresh
     */
    needsRefresh(intervalMs?: number): boolean;
    /**
     * Clear discovered agents and force re-discovery
     */
    reset(): void;
    /**
     * Get agents by category
     */
    getAgentsByCategory(category: AgentCategory): AgentCapability[];
    /**
     * Strategy 1: Discover from known agent IDs
     */
    private discoverKnownAgents;
    /**
     * Strategy 2: Discover from environment variables
     */
    private discoverFromEnvironment;
    /**
     * Strategy 3: Discover from MCP context (if available)
     */
    private discoverFromMCPContext;
    /**
     * Infer tools from agent description
     */
    private inferToolsFromDescription;
}
/**
 * Singleton instance for global agent discovery
 */
export declare const mcpAgentDiscovery: MCPAgentDiscovery;
//# sourceMappingURL=mcp_agent_discovery.d.ts.map