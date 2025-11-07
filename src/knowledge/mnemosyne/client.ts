/**
 * Mnemosyne MCP Client
 *
 * Handles all interactions with the Mnemosyne MCP server for knowledge graph persistence.
 * Provides type-safe interface for storing agent execution data and querying historical patterns.
 */

import type { AgentId, AgentCapability, ProjectContext } from '../../types.js';
import type { AgentFeedback } from '../../types.js';
import {
  type MnemosyneEntity,
  type MnemosyneRelation,
  type AgentProfile,
  type AgentExecution,
  type ObjectivePattern,
  ENTITY_TYPES,
  RELATION_TYPES,
  agentProfileToEntity,
  agentExecutionToEntity,
  objectivePatternToEntity,
  contextSignatureToEntity,
  createContextSignature,
  createExecutedRelation,
  createMatchesContextRelation,
  generateContextHash
} from './schema.js';

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
export class MnemosyneClient {
  private isAvailable: boolean = false;
  private mcpTools: MCPTools | null = null;
  private retryAttempts: number = 3;
  private retryDelayMs: number = 1000;

  constructor(mcpTools?: MCPTools) {
    this.mcpTools = mcpTools || null;
    this.isAvailable = !!mcpTools;
  }

  /**
   * Create agent profile in knowledge graph
   *
   * Stores agent's identity, capabilities, and specialization for future lookups.
   */
  async createAgentProfile(agent: AgentCapability): Promise<void> {
    if (!this.isAvailable) {
      console.log('[MnemosyneClient] Not available, skipping createAgentProfile');
      return;
    }

    try {
      const profile: AgentProfile = {
        entity_type: ENTITY_TYPES.AGENT_PROFILE,
        name: agent.name,
        specialization: agent.specialization,
        capabilities: agent.capabilities,
        tools: agent.tools,
        typical_use_cases: agent.typical_use_cases
      };

      const entity = agentProfileToEntity(profile);

      await this.withRetry(async () => {
        await this.mcpTools!.create_entities([entity]);
      });

      console.log(`[MnemosyneClient] Created agent profile: ${agent.name}`);
    } catch (error) {
      console.error(`[MnemosyneClient] Failed to create agent profile:`, error);
      throw error;
    }
  }

  /**
   * Record agent execution in knowledge graph
   *
   * Stores execution result with full context for pattern learning.
   * Creates relations to agent profile and context signature.
   */
  async recordExecution(execution: ExecutionRecord): Promise<void> {
    if (!this.isAvailable) {
      console.log('[MnemosyneClient] Not available, skipping recordExecution');
      return;
    }

    try {
      const execution_name = `exec_${execution.agent_id}_${execution.timestamp}`;

      // Create execution entity
      const exec_entity: AgentExecution = {
        entity_type: ENTITY_TYPES.AGENT_EXECUTION,
        name: execution_name,
        agent_id: execution.agent_id,
        objective: execution.objective,
        success: execution.success,
        tokens_used: execution.tokens_used,
        duration_ms: execution.duration_ms,
        error_message: execution.error_message,
        timestamp: execution.timestamp,
        context_signature: execution.project_context
          ? generateContextHash(execution.objective, execution.project_context)
          : undefined
      };

      const entities: MnemosyneEntity[] = [agentExecutionToEntity(exec_entity)];
      const relations: MnemosyneRelation[] = [];

      // Create relation: agent -> execution
      relations.push(createExecutedRelation(execution.agent_id, execution_name));

      // Create context signature if context provided
      if (execution.project_context) {
        const context_sig = createContextSignature(execution.objective, execution.project_context);
        entities.push(contextSignatureToEntity(context_sig));

        // Create relation: execution -> context
        relations.push(createMatchesContextRelation(execution_name, context_sig.name));
      }

      // Store in Mnemosyne with retry
      await this.withRetry(async () => {
        await this.mcpTools!.create_entities(entities);
        if (relations.length > 0) {
          await this.mcpTools!.create_relations(relations);
        }
      });

      console.log(`[MnemosyneClient] Recorded execution: ${execution_name}`);
    } catch (error) {
      console.error(`[MnemosyneClient] Failed to record execution:`, error);
      throw error;
    }
  }

  /**
   * Query agent performance metrics from knowledge graph
   *
   * Aggregates all executions for an agent to compute success rate, avg tokens, etc.
   */
  async queryAgentPerformance(agentId: AgentId): Promise<PerformanceMetrics | null> {
    if (!this.isAvailable) {
      console.log('[MnemosyneClient] Not available, returning null for queryAgentPerformance');
      return null;
    }

    try {
      // Search for all executions by this agent
      const query = `Agent: ${agentId}`;
      const results = await this.withRetry(async () => {
        return await this.mcpTools!.semantic_search(query, {
          entity_types: [ENTITY_TYPES.AGENT_EXECUTION],
          limit: 100
        });
      });

      if (!results || results.length === 0) {
        return null;
      }

      // Aggregate metrics
      let total = 0;
      let successful = 0;
      let failed = 0;
      let total_tokens = 0;
      let total_duration = 0;
      let last_exec = 0;

      for (const result of results) {
        total++;

        const success_obs = result.observations.find((o: string) => o.startsWith('Success:'));
        if (success_obs?.includes('true')) {
          successful++;
        } else {
          failed++;
        }

        const tokens_obs = result.observations.find((o: string) => o.startsWith('Tokens:'));
        if (tokens_obs) {
          const tokens = parseInt(tokens_obs.split(':')[1].trim());
          if (!isNaN(tokens)) total_tokens += tokens;
        }

        const duration_obs = result.observations.find((o: string) => o.startsWith('Duration:'));
        if (duration_obs) {
          const duration = parseInt(duration_obs.split(':')[1].replace('ms', '').trim());
          if (!isNaN(duration)) total_duration += duration;
        }

        const timestamp_obs = result.observations.find((o: string) => o.startsWith('Timestamp:'));
        if (timestamp_obs) {
          const timestamp = new Date(timestamp_obs.split(': ')[1]).getTime();
          if (timestamp > last_exec) last_exec = timestamp;
        }
      }

      return {
        agent_id: agentId,
        total_executions: total,
        successful_executions: successful,
        failed_executions: failed,
        success_rate: total > 0 ? successful / total : 0,
        avg_tokens: total > 0 ? total_tokens / total : 0,
        avg_duration_ms: total > 0 ? total_duration / total : 0,
        last_execution: last_exec
      };
    } catch (error) {
      console.error(`[MnemosyneClient] Failed to query agent performance:`, error);
      return null;
    }
  }

  /**
   * Find similar objectives using semantic search
   *
   * Returns objective patterns that match the query semantically.
   * Useful for finding relevant historical executions.
   */
  async findSimilarObjectives(
    objective: string,
    limit: number = 10
  ): Promise<ObjectivePatternMatch[]> {
    if (!this.isAvailable) {
      console.log('[MnemosyneClient] Not available, returning empty array for findSimilarObjectives');
      return [];
    }

    try {
      const results = await this.withRetry(async () => {
        return await this.mcpTools!.semantic_search(objective, {
          entity_types: [ENTITY_TYPES.OBJECTIVE_PATTERN],
          limit,
          min_similarity: 0.7
        });
      });

      if (!results || results.length === 0) {
        return [];
      }

      // Parse results into ObjectivePatternMatch
      const matches: ObjectivePatternMatch[] = [];

      for (const result of results) {
        const objective_obs = result.observations.find((o: string) => o.startsWith('Objective:'));
        const type_obs = result.observations.find((o: string) => o.startsWith('Type:'));
        const success_obs = result.observations.find((o: string) => o.startsWith('Success Count:'));
        const failure_obs = result.observations.find((o: string) => o.startsWith('Failure Count:'));
        const tokens_obs = result.observations.find((o: string) => o.startsWith('Avg Tokens:'));
        const agents_obs = result.observations.find((o: string) => o.startsWith('Successful Agents:'));

        if (!objective_obs || !type_obs) continue;

        const success_count = success_obs ? parseInt(success_obs.split(':')[1].trim()) : 0;
        const failure_count = failure_obs ? parseInt(failure_obs.split(':')[1].trim()) : 0;
        const total = success_count + failure_count;

        const recommended_agents: AgentId[] = agents_obs
          ? agents_obs.split(':')[1].split(',').map((a: string) => a.trim())
          : [];

        matches.push({
          pattern_name: result.name,
          objective_text: objective_obs.split(':')[1].trim(),
          objective_type: type_obs.split(':')[1].trim(),
          success_rate: total > 0 ? success_count / total : 0,
          avg_tokens: tokens_obs ? parseInt(tokens_obs.split(':')[1].trim()) : 0,
          recommended_agents,
          similarity_score: result.similarity_score || 0.8
        });
      }

      return matches;
    } catch (error) {
      console.error(`[MnemosyneClient] Failed to find similar objectives:`, error);
      return [];
    }
  }

  /**
   * Execute operation with exponential backoff retry
   *
   * Retries up to 3 times with 1s, 2s, 4s delays.
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[MnemosyneClient] Attempt ${attempt + 1}/${this.retryAttempts} failed:`,
          error
        );

        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          console.log(`[MnemosyneClient] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Check if Mnemosyne is available
   */
  isConnected(): boolean {
    return this.isAvailable;
  }

  /**
   * Set MCP tools (for dependency injection in tests)
   */
  setMCPTools(tools: MCPTools | null): void {
    this.mcpTools = tools;
    this.isAvailable = !!tools;
  }

  /**
   * Store generic data with scoped key
   *
   * Used by CrossProjectLearningService for flexible pattern storage.
   * Supports any serializable data structure.
   *
   * @param key Scoped key from ScopedKey.build()
   * @param data Data to store (will be JSON serialized)
   */
  async remember(key: string, data: any): Promise<void> {
    if (!this.isAvailable) {
      console.log('[MnemosyneClient] Not available, skipping remember');
      return;
    }

    try {
      const entity: MnemosyneEntity = {
        name: key,
        entityType: 'generic_pattern',
        observations: [
          `Data: ${JSON.stringify(data)}`,
          `Stored: ${new Date().toISOString()}`
        ]
      };

      await this.withRetry(async () => {
        await this.mcpTools!.create_entities([entity]);
      });

      console.log(`[MnemosyneClient] Stored data for key: ${key}`);
    } catch (error) {
      console.error(`[MnemosyneClient] Failed to remember:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data by scoped key prefix
   *
   * Returns all entities matching the key prefix.
   * Useful for querying patterns within a scope.
   *
   * @param keyPrefix Scoped key or prefix to search
   * @returns Array of stored data objects
   */
  async recall(keyPrefix: string): Promise<any[]> {
    if (!this.isAvailable) {
      console.log('[MnemosyneClient] Not available, returning empty array for recall');
      return [];
    }

    try {
      // Search for entities matching the key prefix
      const results = await this.withRetry(async () => {
        return await this.mcpTools!.open_nodes([keyPrefix]);
      });

      if (!results || results.length === 0) {
        return [];
      }

      // Parse stored data from observations
      const data: any[] = [];
      for (const result of results) {
        const dataObs = result.observations.find((o: string) => o.startsWith('Data:'));
        if (dataObs) {
          try {
            const jsonStr = dataObs.substring('Data:'.length).trim();
            const parsed = JSON.parse(jsonStr);
            data.push(parsed);
          } catch (parseError) {
            console.warn(`[MnemosyneClient] Failed to parse data for ${result.name}`);
          }
        }
      }

      return data;
    } catch (error) {
      console.error(`[MnemosyneClient] Failed to recall:`, error);
      return [];
    }
  }
}

// Singleton instance
export const mnemosyneClient = new MnemosyneClient();
