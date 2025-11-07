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
import { AGENT_CAPABILITIES } from './agent_capabilities.js';
import { mnemosyneClient } from './mnemosyne/client.js';
import { SyncQueue } from './mnemosyne/sync.js';
import { CacheLayer } from './cache/cache_layer.js';
import { mcpAgentDiscovery } from '../discovery/mcp_agent_discovery.js';
export class AgentRegistry {
    // Tier 1: Hardcoded defaults
    hardcodedAgents = new Map();
    // Tier 2: MCP-discovered agents
    mcpDiscoveredAgents = new Map();
    // Tier 3: Mnemosyne-learned agents (via cache)
    learnedAgentsCache;
    // Tier 4: Runtime feedback (session-only)
    runtimeFeedback = new Map();
    syncQueue;
    mcpRefreshInterval = null;
    initialized = false;
    constructor() {
        // Initialize Tier 1: Hardcoded defaults
        for (const [id, spec] of Object.entries(AGENT_CAPABILITIES)) {
            this.hardcodedAgents.set(id, spec);
        }
        // Initialize Tier 3: Learned agents cache
        this.learnedAgentsCache = new CacheLayer('learned_agents');
        // Initialize sync queue for Mnemosyne operations
        this.syncQueue = new SyncQueue(mnemosyneClient);
        this.syncQueue.start();
        // Create agent profiles in Mnemosyne (async, non-blocking)
        for (const [id, spec] of Object.entries(AGENT_CAPABILITIES)) {
            this.syncQueue.enqueue({
                type: 'create_profile',
                data: spec
            });
        }
        // Auto-initialize
        this.initialize().catch(err => console.error('[AgentRegistry] Failed to initialize:', err));
    }
    /**
     * Initialize registry - discover MCP agents and start refresh cycle
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            console.log('[AgentRegistry] Initializing...');
            // Initialize cache layer
            await this.learnedAgentsCache.initialize();
            // Tier 2: Discover MCP agents
            await this.refreshMCPAgents();
            // Start periodic MCP discovery refresh (every 5 minutes)
            this.mcpRefreshInterval = setInterval(() => this.refreshMCPAgents().catch(err => console.error('[AgentRegistry] MCP refresh failed:', err)), 5 * 60 * 1000);
            this.initialized = true;
            console.log('[AgentRegistry] Initialized successfully');
        }
        catch (err) {
            console.error('[AgentRegistry] Initialization error:', err);
            this.initialized = true; // Continue with partial initialization
        }
    }
    /**
     * Get all known agents (all four tiers merged)
     * Priority: Tier 1 → Tier 2 → Tier 3 → Tier 4
     */
    async getAllAgents() {
        await this.initialize();
        const agents = {};
        // Tier 1: Hardcoded agents (highest priority)
        for (const [id, spec] of this.hardcodedAgents) {
            const learned = this.runtimeFeedback.get(id) || await this.getLearnedAgent(id);
            agents[id] = this.mergeAgentData(spec, learned);
        }
        // Tier 2: MCP-discovered agents
        for (const [id, spec] of this.mcpDiscoveredAgents) {
            if (!agents[id]) {
                const learned = this.runtimeFeedback.get(id) || await this.getLearnedAgent(id);
                agents[id] = this.mergeAgentData(spec, learned);
            }
        }
        // Tier 3: Mnemosyne-learned agents (not in Tier 1 or 2)
        const allLearnedIds = await this.getAllLearnedAgentIds();
        for (const id of allLearnedIds) {
            if (!agents[id]) {
                const learned = await this.getLearnedAgent(id);
                if (learned) {
                    agents[id] = this.learnedToCapability(learned);
                }
            }
        }
        // Tier 4: Pure runtime feedback agents (not in any other tier)
        for (const [id, learned] of this.runtimeFeedback) {
            if (!agents[id]) {
                agents[id] = this.learnedToCapability(learned);
            }
        }
        console.log(`[AgentRegistry] Returning ${Object.keys(agents).length} total agents`);
        return agents;
    }
    /**
     * Get agent by ID with adaptive ranking from all tiers
     */
    async getAgent(agentId) {
        await this.initialize();
        // Check Tier 1: Hardcoded
        const hardcoded = this.hardcodedAgents.get(agentId);
        // Check Tier 2: MCP-discovered
        const mcpDiscovered = this.mcpDiscoveredAgents.get(agentId);
        // Check Tier 3: Learned (via cache)
        const learned = this.runtimeFeedback.get(agentId) || await this.getLearnedAgent(agentId);
        // Priority merge
        const baseAgent = hardcoded || mcpDiscovered;
        if (!baseAgent && !learned)
            return null;
        if (!baseAgent)
            return this.learnedToCapability(learned);
        return this.mergeAgentData(baseAgent, learned || undefined);
    }
    /**
     * Record agent feedback - passive learning (Tier 4 → Tier 3)
     * Updates runtime feedback and persists to cache
     */
    async recordFeedback(feedback) {
        const agentId = feedback.agent_id;
        // Update or create runtime feedback
        let learned = this.runtimeFeedback.get(agentId) || await this.getLearnedAgent(agentId);
        if (!learned) {
            // Discover new agent
            learned = {
                agent_id: agentId,
                discovered_at: Date.now(),
                last_used: Date.now(),
                total_executions: 0,
                successful_executions: 0,
                failed_executions: 0,
                avg_token_usage: 0
            };
        }
        // Update statistics
        learned.last_used = Date.now();
        learned.total_executions++;
        if (feedback.success) {
            learned.successful_executions++;
        }
        else {
            learned.failed_executions++;
        }
        // Update rolling average for tokens
        if (feedback.tokens_used) {
            const totalTokens = learned.avg_token_usage * (learned.total_executions - 1);
            learned.avg_token_usage = (totalTokens + feedback.tokens_used) / learned.total_executions;
        }
        // Store in Tier 4 (runtime)
        this.runtimeFeedback.set(agentId, learned);
        // Persist to Tier 3 (cache → Mnemosyne)
        await this.learnedAgentsCache.set(agentId, learned);
        // Store in Mnemosyne for cross-session learning (async, non-blocking)
        this.storeInMnemosyne(feedback).catch(err => console.error('[AgentRegistry] Failed to store in Mnemosyne:', err));
        console.log(`[AgentRegistry] Recorded feedback for ${agentId}`);
    }
    /**
     * Discover agents from context (updates Tier 2)
     */
    async discoverAgents(agentIds) {
        for (const agentId of agentIds) {
            if (!this.hardcodedAgents.has(agentId) &&
                !this.mcpDiscoveredAgents.has(agentId)) {
                // Try to get from MCP discovery
                const mcpAgent = mcpAgentDiscovery.getAgent(agentId);
                if (mcpAgent) {
                    this.mcpDiscoveredAgents.set(agentId, mcpAgent);
                }
                else {
                    // Create minimal learned agent entry
                    const learned = {
                        agent_id: agentId,
                        discovered_at: Date.now(),
                        last_used: Date.now(),
                        total_executions: 0,
                        successful_executions: 0,
                        failed_executions: 0,
                        avg_token_usage: 40000 // Default estimate
                    };
                    this.runtimeFeedback.set(agentId, learned);
                    await this.learnedAgentsCache.set(agentId, learned);
                }
            }
        }
        console.log(`[AgentRegistry] Discovered ${agentIds.length} agents`);
    }
    /**
     * Get agents ranked by success rate
     */
    async getRankedAgents() {
        const agents = await this.getAllAgents();
        return Object.values(agents).sort((a, b) => {
            return b.success_rate - a.success_rate;
        });
    }
    /**
     * Clean up resources
     */
    destroy() {
        if (this.mcpRefreshInterval) {
            clearInterval(this.mcpRefreshInterval);
            this.mcpRefreshInterval = null;
        }
        this.learnedAgentsCache.destroy();
        this.syncQueue.stop();
    }
    // Private methods
    /**
     * Refresh MCP-discovered agents (Tier 2)
     */
    async refreshMCPAgents() {
        try {
            if (mcpAgentDiscovery.needsRefresh()) {
                console.log('[AgentRegistry] Refreshing MCP agents...');
                const discovered = await mcpAgentDiscovery.discoverAvailableAgents();
                // Update Tier 2
                this.mcpDiscoveredAgents.clear();
                for (const agent of discovered) {
                    this.mcpDiscoveredAgents.set(agent.name, agent);
                }
                console.log(`[AgentRegistry] Refreshed ${discovered.length} MCP agents`);
            }
        }
        catch (err) {
            console.error('[AgentRegistry] Failed to refresh MCP agents:', err);
        }
    }
    /**
     * Get learned agent from cache (Tier 3)
     */
    async getLearnedAgent(agentId) {
        try {
            const result = await this.learnedAgentsCache.get(agentId);
            return result || undefined;
        }
        catch (err) {
            return undefined;
        }
    }
    /**
     * Get all learned agent IDs from cache
     */
    async getAllLearnedAgentIds() {
        // This would require cache layer to expose keys() method
        // For now, return empty array - agents will be discovered via other tiers
        return [];
    }
    /**
     * Merge agent data from capability spec and learned statistics
     */
    mergeAgentData(capability, learned) {
        if (!learned)
            return capability;
        // Calculate success rate from learned data
        const successRate = learned.total_executions > 0
            ? learned.successful_executions / learned.total_executions
            : capability.success_rate;
        // Merge: prefer capability structure, use learned statistics
        return {
            ...capability,
            success_rate: successRate,
            avg_token_usage: learned.avg_token_usage || capability.avg_token_usage
        };
    }
    /**
     * Convert learned agent to capability
     */
    learnedToCapability(learned) {
        const successRate = learned.total_executions > 0
            ? learned.successful_executions / learned.total_executions
            : 0.5;
        return {
            name: learned.agent_id,
            specialization: learned.specialization || 'custom_agent',
            capabilities: learned.capabilities || [],
            tools: learned.tools || [],
            typical_use_cases: learned.typical_use_cases || ['general_tasks'],
            avg_token_usage: learned.avg_token_usage,
            success_rate: successRate
        };
    }
    /**
     * Store execution in Mnemosyne
     */
    async storeInMnemosyne(feedback) {
        try {
            const executionRecord = {
                agent_id: feedback.agent_id,
                objective: 'feedback_execution',
                success: feedback.success,
                tokens_used: feedback.tokens_used,
                duration_ms: feedback.duration_ms,
                error_message: feedback.error,
                timestamp: Date.now()
            };
            // Enqueue for async processing (non-blocking)
            this.syncQueue.enqueue({
                type: 'record_execution',
                data: executionRecord
            });
            console.log(`[AgentRegistry] Enqueued execution record for ${feedback.agent_id}`);
        }
        catch (err) {
            console.error('[AgentRegistry] Failed to enqueue execution for Mnemosyne:', err);
        }
    }
}
// Singleton instance
export const agentRegistry = new AgentRegistry();
//# sourceMappingURL=agent_registry.js.map