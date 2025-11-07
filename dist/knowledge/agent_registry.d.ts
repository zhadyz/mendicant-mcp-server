/**
 * Intelligent Agent Registry - Four-Tier Discovery System
 *
 * TIER 1: Hardcoded defaults (AGENT_CAPABILITIES) - always available, zero-config
 * TIER 2: MCP-discovered agents - session-specific, dynamic
 * TIER 3: Mnemosyne-learned agents - cross-session, persistent
 * TIER 4: Runtime feedback - current session, temporary
 *
 * Three-Layer Cache Architecture:
 * - L1: Memory cache (instant access, LRU eviction)
 * - L2: Disk cache (24-hour TTL, persists across restarts)
 * - L3: Mnemosyne cache (90-day TTL, cross-session learning)
 *
 * Brutally efficient:
 * - Cache-first lookups (memory → disk → Mnemosyne)
 * - Async discovery and sync (non-blocking)
 * - Periodic refresh (every 5 minutes)
 * - Write-through to all cache layers
 */
import type { AgentId, AgentCapability, AgentFeedback } from '../types.js';
export declare class AgentRegistry {
    private hardcodedAgents;
    private mcpDiscoveredAgents;
    private learnedAgentsCache;
    private runtimeFeedback;
    private syncQueue;
    private mcpRefreshInterval;
    private initialized;
    constructor();
    /**
     * Initialize registry - discover MCP agents and start refresh cycle
     */
    initialize(): Promise<void>;
    /**
     * Get all known agents (all four tiers merged)
     * Priority: Tier 1 → Tier 2 → Tier 3 → Tier 4
     */
    getAllAgents(): Promise<Record<AgentId, AgentCapability>>;
    /**
     * Get agent by ID with adaptive ranking from all tiers
     */
    getAgent(agentId: AgentId): Promise<AgentCapability | null>;
    /**
     * Record agent feedback - passive learning (Tier 4 → Tier 3)
     * Updates runtime feedback and persists to cache
     */
    recordFeedback(feedback: AgentFeedback): Promise<void>;
    /**
     * Discover agents from context (updates Tier 2)
     */
    discoverAgents(agentIds: AgentId[]): Promise<void>;
    /**
     * Get agents ranked by success rate
     */
    getRankedAgents(): Promise<AgentCapability[]>;
    /**
     * Clean up resources
     */
    destroy(): void;
    /**
     * Refresh MCP-discovered agents (Tier 2)
     */
    private refreshMCPAgents;
    /**
     * Get learned agent from cache (Tier 3)
     */
    private getLearnedAgent;
    /**
     * Get all learned agent IDs from cache
     */
    private getAllLearnedAgentIds;
    /**
     * Merge agent data from capability spec and learned statistics
     */
    private mergeAgentData;
    /**
     * Convert learned agent to capability
     */
    private learnedToCapability;
    /**
     * Store execution in Mnemosyne
     */
    private storeInMnemosyne;
}
export declare const agentRegistry: AgentRegistry;
//# sourceMappingURL=agent_registry.d.ts.map