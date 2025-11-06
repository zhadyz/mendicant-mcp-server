/**
 * Predictive Conflict Detector - Learn and Predict Agent Conflicts
 *
 * Some agents conflict with each other:
 * - Resource conflicts: Both modify the same file
 * - Semantic conflicts: Contradictory approaches
 * - Ordering conflicts: Agent B needs Agent A's output
 * - Capability overlaps: Redundant work
 *
 * This system:
 * 1. Learns conflict patterns from past executions
 * 2. Predicts conflicts BEFORE execution
 * 3. Suggests conflict resolution strategies
 * 4. Optimizes agent ordering to prevent conflicts
 *
 * Makes Mendicant proactive about conflicts, not reactive.
 */

import { AgentId, ExecutionPattern, ProjectContext } from '../types.js';
import { semanticEmbedder, SemanticEmbedding } from './semantic_embedder.js';

export interface ConflictPattern {
  agent_a: AgentId;
  agent_b: AgentId;
  conflict_type: ConflictType;
  severity: number; // 0.0 to 1.0
  frequency: number; // How often this conflict occurs
  last_seen: number; // Timestamp
  resolution_strategies: ResolutionStrategy[];
  context_tags: string[]; // When does this conflict happen
}

export type ConflictType =
  | 'resource_contention'     // Both agents accessing same resource
  | 'semantic_contradiction'  // Agents have contradictory goals
  | 'ordering_dependency'     // Agent B needs Agent A first
  | 'capability_overlap'      // Agents do redundant work
  | 'unknown';

export interface ResolutionStrategy {
  strategy: 'reorder' | 'remove' | 'serialize' | 'parallelize' | 'merge';
  description: string;
  confidence: number;
  success_rate: number; // Historical success of this strategy
}

export interface ConflictPrediction {
  agent_pair: [AgentId, AgentId];
  conflict_probability: number; // 0.0 to 1.0
  predicted_type: ConflictType;
  predicted_severity: number;
  confidence: number;
  reasoning: string;
  recommended_resolution: ResolutionStrategy;
}

export interface ConflictAnalysis {
  predicted_conflicts: ConflictPrediction[];
  conflict_free_probability: number;
  recommended_reordering?: AgentId[];
  agents_to_remove?: AgentId[];
  reasoning: string;
}

/**
 * Predictive Conflict Detector - Learn and predict agent conflicts
 */
export class PredictiveConflictDetector {
  private conflict_patterns: Map<string, ConflictPattern> = new Map();
  private resolution_success: Map<string, number> = new Map(); // Strategy → success rate

  /**
   * Analyze a planned agent sequence for potential conflicts
   */
  async analyzeConflicts(
    agents: AgentId[],
    objective: string,
    objective_embedding: SemanticEmbedding,
    context?: ProjectContext
  ): Promise<ConflictAnalysis> {
    console.log(`[ConflictDetector] Analyzing ${agents.length} agents for conflicts`);

    const predictions: ConflictPrediction[] = [];

    // Check each pair of agents
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agent_a = agents[i];
        const agent_b = agents[j];

        const prediction = await this.predictConflict(
          agent_a,
          agent_b,
          objective_embedding,
          context
        );

        if (prediction.conflict_probability > 0.3) {
          predictions.push(prediction);
        }
      }
    }

    // Sort by probability (highest first)
    predictions.sort((a, b) => b.conflict_probability - a.conflict_probability);

    // Calculate overall conflict-free probability
    const conflict_free_prob = this.calculateConflictFreeProbability(predictions);

    console.log(`[ConflictDetector] Found ${predictions.length} potential conflicts`);
    console.log(`[ConflictDetector] Conflict-free probability: ${(conflict_free_prob * 100).toFixed(1)}%`);

    // Generate recommendations
    let recommended_reordering: AgentId[] | undefined;
    let agents_to_remove: AgentId[] | undefined;
    let reasoning = '';

    if (predictions.length > 0) {
      // Try to resolve conflicts
      const resolution = this.generateResolution(agents, predictions);
      recommended_reordering = resolution.reordering;
      agents_to_remove = resolution.removals;
      reasoning = resolution.reasoning;
    } else {
      reasoning = 'No conflicts detected - plan is optimal';
    }

    return {
      predicted_conflicts: predictions,
      conflict_free_probability: conflict_free_prob,
      recommended_reordering,
      agents_to_remove,
      reasoning
    };
  }

  /**
   * Predict conflict between two agents
   */
  private async predictConflict(
    agent_a: AgentId,
    agent_b: AgentId,
    objective_embedding: SemanticEmbedding,
    context?: ProjectContext
  ): Promise<ConflictPrediction> {
    // Check historical patterns
    const pattern_key = this.getPatternKey(agent_a, agent_b);
    const historical_pattern = this.conflict_patterns.get(pattern_key);

    if (historical_pattern) {
      // Use learned pattern
      const base_probability = Math.min(historical_pattern.frequency * 0.2, 0.9);

      // Adjust for context similarity
      const context_match = this.matchContext(historical_pattern.context_tags, objective_embedding, context);
      const adjusted_probability = base_probability * (0.7 + context_match * 0.3);

      const best_resolution = this.selectBestResolution(historical_pattern.resolution_strategies);

      return {
        agent_pair: [agent_a, agent_b],
        conflict_probability: adjusted_probability,
        predicted_type: historical_pattern.conflict_type,
        predicted_severity: historical_pattern.severity,
        confidence: 0.8, // High confidence - based on historical data
        reasoning: `Historical pattern: ${historical_pattern.frequency} conflicts observed, type: ${historical_pattern.conflict_type}`,
        recommended_resolution: best_resolution
      };
    }

    // No historical data - use heuristics
    return this.heuristicConflictPrediction(agent_a, agent_b, objective_embedding, context);
  }

  /**
   * Heuristic conflict prediction (when no historical data)
   */
  private heuristicConflictPrediction(
    agent_a: AgentId,
    agent_b: AgentId,
    objective_embedding: SemanticEmbedding,
    context?: ProjectContext
  ): ConflictPrediction {
    let probability = 0.0;
    let type: ConflictType = 'unknown';
    let severity = 0.3;
    let reasoning = '';

    // Heuristic 1: Same capability agents may overlap
    if (this.haveSimilarCapabilities(agent_a, agent_b)) {
      probability += 0.4;
      type = 'capability_overlap';
      severity = 0.5;
      reasoning = 'Agents have similar capabilities - may perform redundant work';
    }

    // Heuristic 2: Known ordering dependencies
    if (this.hasOrderingDependency(agent_a, agent_b)) {
      probability += 0.6;
      type = 'ordering_dependency';
      severity = 0.7;
      reasoning = 'Known ordering dependency - execution order matters';
    }

    // Heuristic 3: Resource-intensive agents may conflict
    if (this.areResourceIntensive(agent_a, agent_b)) {
      probability += 0.3;
      type = 'resource_contention';
      severity = 0.6;
      reasoning = 'Both agents are resource-intensive - may contend for resources';
    }

    // Heuristic 4: Semantic contradiction
    if (this.haveContradictorySemantics(agent_a, agent_b)) {
      probability += 0.5;
      type = 'semantic_contradiction';
      severity = 0.8;
      reasoning = 'Agents have contradictory approaches';
    }

    probability = Math.min(probability, 1.0);

    // Generate resolution strategy
    const resolution = this.generateResolutionStrategy(type, severity);

    return {
      agent_pair: [agent_a, agent_b],
      conflict_probability: probability,
      predicted_type: type,
      predicted_severity: severity,
      confidence: 0.4, // Lower confidence - heuristic-based
      reasoning: reasoning || 'No specific conflict detected',
      recommended_resolution: resolution
    };
  }

  /**
   * Check if agents have similar capabilities
   */
  private haveSimilarCapabilities(agent_a: AgentId, agent_b: AgentId): boolean {
    // Extract capability keywords
    const keywords_a = agent_a.toLowerCase().split('_');
    const keywords_b = agent_b.toLowerCase().split('_');

    // Check for overlap
    const overlap = keywords_a.filter(k => keywords_b.includes(k));
    return overlap.length > 0;
  }

  /**
   * Check for known ordering dependencies
   */
  private hasOrderingDependency(agent_a: AgentId, agent_b: AgentId): boolean {
    // Known dependencies (would be learned over time in full system)
    const dependencies: Record<string, string[]> = {
      'analyzer': ['implementation', 'debug'],      // Analyze before implementing
      'debug': ['test'],                            // Debug before testing
      'implementation': ['test', 'deploy'],         // Implement before testing/deploying
      'test': ['deploy'],                           // Test before deploying
    };

    // Check if agent_a should come before agent_b
    for (const [prereq, dependents] of Object.entries(dependencies)) {
      if (agent_a.toLowerCase().includes(prereq)) {
        for (const dependent of dependents) {
          if (agent_b.toLowerCase().includes(dependent)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if agents are resource-intensive
   */
  private areResourceIntensive(agent_a: AgentId, agent_b: AgentId): boolean {
    const intensive_keywords = ['six_eyes', 'limitless', 'mahoraga', 'construction', 'domain_expansion'];

    const a_intensive = intensive_keywords.some(k => agent_a.toLowerCase().includes(k));
    const b_intensive = intensive_keywords.some(k => agent_b.toLowerCase().includes(k));

    return a_intensive && b_intensive;
  }

  /**
   * Check if agents have contradictory semantics
   */
  private haveContradictorySemantics(agent_a: AgentId, agent_b: AgentId): boolean {
    const contradictions: Array<[string, string]> = [
      ['create', 'delete'],
      ['add', 'remove'],
      ['build', 'destroy'],
      ['implement', 'rollback'],
    ];

    const a_lower = agent_a.toLowerCase();
    const b_lower = agent_b.toLowerCase();

    for (const [action1, action2] of contradictions) {
      if ((a_lower.includes(action1) && b_lower.includes(action2)) ||
          (a_lower.includes(action2) && b_lower.includes(action1))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate resolution strategy for conflict type
   */
  private generateResolutionStrategy(type: ConflictType, severity: number): ResolutionStrategy {
    switch (type) {
      case 'ordering_dependency':
        return {
          strategy: 'reorder',
          description: 'Reorder agents to respect dependency',
          confidence: 0.8,
          success_rate: 0.85
        };

      case 'capability_overlap':
        return {
          strategy: 'remove',
          description: 'Remove redundant agent',
          confidence: 0.7,
          success_rate: 0.75
        };

      case 'resource_contention':
        return {
          strategy: 'serialize',
          description: 'Execute agents sequentially to avoid resource conflicts',
          confidence: 0.75,
          success_rate: 0.8
        };

      case 'semantic_contradiction':
        return {
          strategy: 'remove',
          description: 'Remove conflicting agent',
          confidence: 0.9,
          success_rate: 0.9
        };

      default:
        return {
          strategy: 'reorder',
          description: 'Try reordering agents',
          confidence: 0.5,
          success_rate: 0.6
        };
    }
  }

  /**
   * Calculate overall conflict-free probability
   */
  private calculateConflictFreeProbability(predictions: ConflictPrediction[]): number {
    if (predictions.length === 0) return 1.0;

    // Assume independent conflicts
    let prob_no_conflict = 1.0;
    for (const pred of predictions) {
      prob_no_conflict *= (1.0 - pred.conflict_probability);
    }

    return prob_no_conflict;
  }

  /**
   * Generate resolution for conflicts
   */
  private generateResolution(
    agents: AgentId[],
    conflicts: ConflictPrediction[]
  ): { reordering?: AgentId[]; removals?: AgentId[]; reasoning: string } {
    let reasoning = `Detected ${conflicts.length} conflict(s). `;

    // Strategy 1: If high-severity conflicts, suggest removals
    const high_severity = conflicts.filter(c => c.predicted_severity > 0.7);
    if (high_severity.length > 0) {
      const agents_to_remove = this.identifyAgentsToRemove(high_severity, agents);
      reasoning += `Recommend removing ${agents_to_remove.length} conflicting agent(s) to prevent high-severity conflicts.`;
      return { removals: agents_to_remove, reasoning };
    }

    // Strategy 2: If ordering dependencies, suggest reordering
    const ordering_conflicts = conflicts.filter(c => c.predicted_type === 'ordering_dependency');
    if (ordering_conflicts.length > 0) {
      const reordered = this.reorderAgents(agents, ordering_conflicts);
      reasoning += `Recommend reordering agents to respect dependencies.`;
      return { reordering: reordered, reasoning };
    }

    // Strategy 3: Mixed conflicts - apply best resolution
    const best_resolution = conflicts[0].recommended_resolution;
    reasoning += `Apply ${best_resolution.strategy} strategy: ${best_resolution.description}`;

    if (best_resolution.strategy === 'remove') {
      const agents_to_remove = this.identifyAgentsToRemove(conflicts, agents);
      return { removals: agents_to_remove, reasoning };
    } else if (best_resolution.strategy === 'reorder') {
      const reordered = this.reorderAgents(agents, conflicts);
      return { reordering: reordered, reasoning };
    }

    return { reasoning };
  }

  /**
   * Identify agents to remove to resolve conflicts
   */
  private identifyAgentsToRemove(conflicts: ConflictPrediction[], agents: AgentId[]): AgentId[] {
    const conflict_counts = new Map<AgentId, number>();

    // Count conflicts for each agent
    for (const conflict of conflicts) {
      const [a, b] = conflict.agent_pair;
      conflict_counts.set(a, (conflict_counts.get(a) || 0) + 1);
      conflict_counts.set(b, (conflict_counts.get(b) || 0) + 1);
    }

    // Remove agents with most conflicts
    const sorted = Array.from(conflict_counts.entries())
      .sort((a, b) => b[1] - a[1]);

    // Remove top conflicting agents (max 2)
    return sorted.slice(0, 2).map(([agent, _]) => agent);
  }

  /**
   * Reorder agents to respect dependencies
   */
  private reorderAgents(agents: AgentId[], conflicts: ConflictPrediction[]): AgentId[] {
    const reordered = [...agents];

    // Apply ordering dependencies
    for (const conflict of conflicts) {
      if (conflict.predicted_type === 'ordering_dependency') {
        const [agent_a, agent_b] = conflict.agent_pair;

        const idx_a = reordered.indexOf(agent_a);
        const idx_b = reordered.indexOf(agent_b);

        // Ensure agent_a comes before agent_b
        if (idx_a > idx_b) {
          reordered.splice(idx_a, 1);
          reordered.splice(idx_b, 0, agent_a);
        }
      }
    }

    return reordered;
  }

  /**
   * Learn from observed conflicts
   */
  async learnConflict(
    agent_a: AgentId,
    agent_b: AgentId,
    conflict_type: ConflictType,
    severity: number,
    context_tags: string[],
    resolution_used?: ResolutionStrategy,
    resolution_success?: boolean
  ): Promise<void> {
    const pattern_key = this.getPatternKey(agent_a, agent_b);
    const existing = this.conflict_patterns.get(pattern_key);

    if (existing) {
      // Update existing pattern
      existing.frequency += 1;
      existing.last_seen = Date.now();

      // Update severity (exponential moving average)
      existing.severity = existing.severity * 0.8 + severity * 0.2;

      // Add context tags
      for (const tag of context_tags) {
        if (!existing.context_tags.includes(tag)) {
          existing.context_tags.push(tag);
        }
      }

      // Update resolution strategies
      if (resolution_used && resolution_success !== undefined) {
        const idx = existing.resolution_strategies.findIndex(
          s => s.strategy === resolution_used.strategy
        );

        if (idx >= 0) {
          const strategy = existing.resolution_strategies[idx];
          const new_success_rate = strategy.success_rate * 0.9 + (resolution_success ? 1.0 : 0.0) * 0.1;
          strategy.success_rate = new_success_rate;
        } else {
          existing.resolution_strategies.push({
            ...resolution_used,
            success_rate: resolution_success ? 1.0 : 0.0
          });
        }
      }
    } else {
      // Create new pattern
      const new_pattern: ConflictPattern = {
        agent_a,
        agent_b,
        conflict_type,
        severity,
        frequency: 1,
        last_seen: Date.now(),
        resolution_strategies: resolution_used ? [{
          ...resolution_used,
          success_rate: resolution_success ? 1.0 : 0.0
        }] : [],
        context_tags
      };

      this.conflict_patterns.set(pattern_key, new_pattern);
    }

    console.log(`[ConflictDetector] Learned conflict: ${agent_a} <-> ${agent_b} (${conflict_type}, severity: ${severity.toFixed(2)})`);
  }

  /**
   * Get pattern key for agent pair (order-independent)
   */
  private getPatternKey(agent_a: AgentId, agent_b: AgentId): string {
    return [agent_a, agent_b].sort().join('::');
  }

  /**
   * Match context tags for similarity
   */
  private matchContext(
    pattern_tags: string[],
    objective_embedding: SemanticEmbedding,
    context?: ProjectContext
  ): number {
    // Simple tag matching (would use semantic similarity in full system)
    const current_tags = [
      ...Array.from(objective_embedding.intent_scores.keys()),
      ...Array.from(objective_embedding.domain_scores.keys()),
      context?.project_type || ''
    ];

    const matches = pattern_tags.filter(tag => current_tags.includes(tag));
    return pattern_tags.length > 0 ? matches.length / pattern_tags.length : 0.5;
  }

  /**
   * Select best resolution strategy from history
   */
  private selectBestResolution(strategies: ResolutionStrategy[]): ResolutionStrategy {
    if (strategies.length === 0) {
      return {
        strategy: 'reorder',
        description: 'Try reordering agents',
        confidence: 0.5,
        success_rate: 0.6
      };
    }

    // Select strategy with highest success rate
    return strategies.reduce((best, current) =>
      current.success_rate > best.success_rate ? current : best
    );
  }

  /**
   * Get all learned conflict patterns
   */
  getConflictPatterns(): ConflictPattern[] {
    return Array.from(this.conflict_patterns.values());
  }

  /**
   * Clear old conflict patterns
   */
  pruneOldPatterns(max_age_days: number = 90): number {
    const cutoff = Date.now() - (max_age_days * 24 * 60 * 60 * 1000);
    let pruned = 0;

    for (const [key, pattern] of this.conflict_patterns.entries()) {
      if (pattern.last_seen < cutoff) {
        this.conflict_patterns.delete(key);
        pruned += 1;
      }
    }

    console.log(`[ConflictDetector] Pruned ${pruned} old conflict patterns`);
    return pruned;
  }
}

/**
 * Singleton instance
 */
export const conflictDetector = new PredictiveConflictDetector();
