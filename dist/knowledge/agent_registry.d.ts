/**
 * Intelligent Agent Registry
 *
 * Three-tier discovery system:
 * 1. Hardcoded defaults (zero-config, instant)
 * 2. Learned agents from mnemosyne (proven performers)
 * 3. Runtime feedback (discovers new agents during execution)
 *
 * Brutally efficient:
 * - Memory cache (zero latency)
 * - Disk cache (persists across restarts)
 * - Lazy loading (only query mnemosyne on cache miss)
 * - Async updates (don't block planning)
 */
import type { AgentId, AgentCapability, AgentFeedback } from '../types.js';
export declare class AgentRegistry {
    private memoryCache;
    private learnedAgents;
    private cacheLoaded;
    private cacheLoadPromise;
    constructor();
    /**
     * Get all known agents (hardcoded + learned)
     * Brutally efficient: memory-first, lazy-load disk cache
     */
    getAllAgents(): Promise<Record<AgentId, AgentCapability>>;
    /**
     * Get agent by ID with adaptive ranking
     */
    getAgent(agentId: AgentId): Promise<AgentCapability | null>;
    /**
     * Record agent feedback - passive learning
     * Async, doesn't block caller
     */
    recordFeedback(feedback: AgentFeedback): Promise<void>;
    /**
     * Discover agents from context (Claude tells us what agents exist)
     */
    discoverAgents(agentIds: AgentId[]): Promise<void>;
    /**
     * Get agents ranked by success rate
     */
    getRankedAgents(): Promise<AgentCapability[]>;
    private ensureCacheLoaded;
    private loadCache;
    private persistCache;
    private mergeAgentData;
    private learnedToCapability;
    private storeInMnemosyne;
    private refreshFromMnemosyne;
}
export declare const agentRegistry: AgentRegistry;
//# sourceMappingURL=agent_registry.d.ts.map