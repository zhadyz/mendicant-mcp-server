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
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { AGENT_CAPABILITIES } from './agent_capabilities.js';
const CACHE_DIR = join(homedir(), '.mendicant');
const CACHE_FILE = join(CACHE_DIR, 'learned_agents.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export class AgentRegistry {
    memoryCache = new Map();
    learnedAgents = new Map();
    cacheLoaded = false;
    cacheLoadPromise = null;
    constructor() {
        console.error('[DEBUG] AgentRegistry constructor called');
        console.error('[DEBUG] AGENT_CAPABILITIES keys:', Object.keys(AGENT_CAPABILITIES));
        console.error('[DEBUG] AGENT_CAPABILITIES entries:', Object.keys(AGENT_CAPABILITIES).length);
        // Start with hardcoded defaults in memory
        for (const [id, spec] of Object.entries(AGENT_CAPABILITIES)) {
            this.memoryCache.set(id, spec);
            console.error('[DEBUG] Added agent to memoryCache:', id);
        }
        console.error('[DEBUG] memoryCache size after constructor:', this.memoryCache.size);
    }
    /**
     * Get all known agents (hardcoded + learned)
     * Brutally efficient: memory-first, lazy-load disk cache
     */
    async getAllAgents() {
        console.error('[DEBUG] getAllAgents called, memoryCache size:', this.memoryCache.size);
        await this.ensureCacheLoaded();
        console.error('[DEBUG] After ensureCacheLoaded, memoryCache size:', this.memoryCache.size);
        const agents = {};
        // Merge hardcoded and learned agents
        for (const [id, spec] of this.memoryCache) {
            console.error('[DEBUG] Processing memoryCache entry:', id);
            const learned = this.learnedAgents.get(id);
            agents[id] = this.mergeAgentData(spec, learned);
        }
        console.error('[DEBUG] After memoryCache loop, agents keys:', Object.keys(agents));
        // Add purely learned agents (not in hardcoded set)
        for (const [id, learned] of this.learnedAgents) {
            if (!agents[id]) {
                agents[id] = this.learnedToCapability(learned);
            }
        }
        console.error('[DEBUG] Final agents count:', Object.keys(agents).length);
        return agents;
    }
    /**
     * Get agent by ID with adaptive ranking
     */
    async getAgent(agentId) {
        await this.ensureCacheLoaded();
        const hardcoded = this.memoryCache.get(agentId);
        const learned = this.learnedAgents.get(agentId);
        if (!hardcoded && !learned)
            return null;
        return this.mergeAgentData(hardcoded, learned);
    }
    /**
     * Record agent feedback - passive learning
     * Async, doesn't block caller
     */
    async recordFeedback(feedback) {
        const agentId = feedback.agent_id;
        let learned = this.learnedAgents.get(agentId);
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
        this.learnedAgents.set(agentId, learned);
        // Persist to disk (async, non-blocking)
        this.persistCache().catch(err => console.error('Failed to persist agent cache:', err));
        // Store in mnemosyne for cross-session learning (async, non-blocking)
        this.storeInMnemosyne(feedback).catch(err => console.error('Failed to store in mnemosyne:', err));
    }
    /**
     * Discover agents from context (Claude tells us what agents exist)
     */
    async discoverAgents(agentIds) {
        for (const agentId of agentIds) {
            if (!this.learnedAgents.has(agentId) && !this.memoryCache.has(agentId)) {
                // New agent discovered
                this.learnedAgents.set(agentId, {
                    agent_id: agentId,
                    discovered_at: Date.now(),
                    last_used: Date.now(),
                    total_executions: 0,
                    successful_executions: 0,
                    failed_executions: 0,
                    avg_token_usage: 40000 // Default estimate
                });
            }
        }
        await this.persistCache();
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
    // Private helpers
    async ensureCacheLoaded() {
        if (this.cacheLoaded)
            return;
        // Prevent concurrent loads
        if (this.cacheLoadPromise) {
            return this.cacheLoadPromise;
        }
        this.cacheLoadPromise = this.loadCache();
        await this.cacheLoadPromise;
        this.cacheLoadPromise = null;
    }
    async loadCache() {
        try {
            const data = await readFile(CACHE_FILE, 'utf-8');
            const cached = JSON.parse(data);
            // Check if cache is stale
            if (Date.now() - cached.last_updated > CACHE_TTL_MS) {
                // Stale cache, refresh from mnemosyne in background
                this.refreshFromMnemosyne().catch(err => console.error('Failed to refresh from mnemosyne:', err));
            }
            // Load learned agents into memory
            for (const [id, learned] of Object.entries(cached.learned_agents)) {
                this.learnedAgents.set(id, learned);
            }
            this.cacheLoaded = true;
        }
        catch (err) {
            // Cache doesn't exist or is corrupted, start fresh
            this.cacheLoaded = true;
        }
    }
    async persistCache() {
        try {
            await mkdir(CACHE_DIR, { recursive: true });
            const data = {
                learned_agents: Object.fromEntries(this.learnedAgents),
                last_updated: Date.now()
            };
            await writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
        }
        catch (err) {
            console.error('Failed to persist cache:', err);
        }
    }
    mergeAgentData(hardcoded, learned) {
        if (!hardcoded && !learned) {
            throw new Error('Cannot merge with both undefined');
        }
        if (!learned)
            return hardcoded;
        if (!hardcoded)
            return this.learnedToCapability(learned);
        // Merge: prefer hardcoded structure, but use learned statistics
        const successRate = learned.total_executions > 0
            ? learned.successful_executions / learned.total_executions
            : hardcoded.success_rate;
        return {
            ...hardcoded,
            success_rate: successRate,
            avg_token_usage: learned.avg_token_usage || hardcoded.avg_token_usage
        };
    }
    learnedToCapability(learned) {
        const successRate = learned.total_executions > 0
            ? learned.successful_executions / learned.total_executions
            : 0.5; // Unknown agents start at 50%
        return {
            name: learned.agent_id,
            specialization: learned.specialization || 'custom_agent',
            capabilities: learned.capabilities || [],
            tools: learned.tools || [],
            typical_use_cases: learned.typical_use_cases || [],
            avg_token_usage: learned.avg_token_usage,
            success_rate: successRate
        };
    }
    async storeInMnemosyne(feedback) {
        // TODO: Integrate with mnemosyne MCP for cross-session learning
        // Store agent performance data as entities/relations
        // This enables learning across Claude Code instances
    }
    async refreshFromMnemosyne() {
        // TODO: Query mnemosyne for learned agent patterns
        // Merge with local cache
        // This enables cross-machine learning
    }
}
// Singleton instance
export const agentRegistry = new AgentRegistry();
//# sourceMappingURL=agent_registry.js.map