/**
 * Mnemosyne MCP Client
 *
 * Handles all interactions with the Mnemosyne MCP server for knowledge graph persistence.
 * Provides type-safe interface for storing agent execution data and querying historical patterns.
 */
import type { AgentId, AgentCapability, ProjectContext } from '../../types.js';
import { type MnemosyneEntity, type MnemosyneRelation } from './schema.js';
/**
 * Performance metrics for agent executions
 */
export interface PerformanceMetrics {
    agent_id: AgentId;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
    avg_tokens: number;
    avg_duration_ms: number;
    last_execution: number;
}
/**
 * Execution record for Mnemosyne storage
 */
export interface ExecutionRecord {
    agent_id: AgentId;
    objective: string;
    success: boolean;
    tokens_used?: number;
    duration_ms?: number;
    error_message?: string;
    project_context?: ProjectContext;
    timestamp: number;
    metadata?: Record<string, any>;
}
/**
 * Objective pattern match result
 */
export interface ObjectivePatternMatch {
    pattern_name: string;
    objective_text: string;
    objective_type: string;
    success_rate: number;
    avg_tokens: number;
    recommended_agents: AgentId[];
    similarity_score: number;
}
/**
 * MCP Tool Call Interface
 * This will be replaced with actual MCP client when available
 */
interface MCPTools {
    create_entities: (entities: MnemosyneEntity[]) => Promise<void>;
    create_relations: (relations: MnemosyneRelation[]) => Promise<void>;
    semantic_search: (query: string, options?: any) => Promise<any[]>;
    open_nodes: (names: string[]) => Promise<any[]>;
}
/**
 * Mnemosyne Client
 *
 * Provides high-level interface for storing agent intelligence in knowledge graph.
 * Handles retries, error recovery, and efficient batch operations.
 */
export declare class MnemosyneClient {
    private isAvailable;
    private mcpTools;
    private retryAttempts;
    private retryDelayMs;
    constructor(mcpTools?: MCPTools);
    /**
     * Create agent profile in knowledge graph
     *
     * Stores agent's identity, capabilities, and specialization for future lookups.
     */
    createAgentProfile(agent: AgentCapability): Promise<void>;
    /**
     * Record agent execution in knowledge graph
     *
     * Stores execution result with full context for pattern learning.
     * Creates relations to agent profile and context signature.
     */
    recordExecution(execution: ExecutionRecord): Promise<void>;
    /**
     * Query agent performance metrics from knowledge graph
     *
     * Aggregates all executions for an agent to compute success rate, avg tokens, etc.
     */
    queryAgentPerformance(agentId: AgentId): Promise<PerformanceMetrics | null>;
    /**
     * Find similar objectives using semantic search
     *
     * Returns objective patterns that match the query semantically.
     * Useful for finding relevant historical executions.
     */
    findSimilarObjectives(objective: string, limit?: number): Promise<ObjectivePatternMatch[]>;
    /**
     * Execute operation with exponential backoff retry
     *
     * Retries up to 3 times with 1s, 2s, 4s delays.
     */
    private withRetry;
    /**
     * Check if Mnemosyne is available
     */
    isConnected(): boolean;
    /**
     * Set MCP tools (for dependency injection in tests)
     */
    setMCPTools(tools: MCPTools | null): void;
    /**
     * Store generic data with scoped key
     *
     * Used by CrossProjectLearningService for flexible pattern storage.
     * Supports any serializable data structure.
     *
     * @param key Scoped key from ScopedKey.build()
     * @param data Data to store (will be JSON serialized)
     */
    remember(key: string, data: any): Promise<void>;
    /**
     * Retrieve data by scoped key prefix
     *
     * Returns all entities matching the key prefix.
     * Useful for querying patterns within a scope.
     *
     * @param keyPrefix Scoped key or prefix to search
     * @returns Array of stored data objects
     */
    recall(keyPrefix: string): Promise<any[]>;
}
export declare const mnemosyneClient: MnemosyneClient;
export {};
//# sourceMappingURL=client.d.ts.map