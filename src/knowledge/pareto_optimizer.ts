/**
 * Pareto Optimizer - Multi-Objective Optimization
 *
 * Mendicant must balance multiple competing objectives:
 * - ACCURACY: Success rate, result quality
 * - COST: Token usage, API calls, compute resources
 * - LATENCY: Execution time, user wait time
 *
 * A Pareto-optimal solution is one where you cannot improve any objective
 * without degrading at least one other. The Pareto frontier is the set of
 * all such non-dominated solutions.
 *
 * Example:
 * Plan A: 95% accuracy, 10k tokens, 5s  → Pareto-optimal
 * Plan B: 90% accuracy, 5k tokens, 2s   → Pareto-optimal (faster, cheaper)
 * Plan C: 92% accuracy, 8k tokens, 4s   → Dominated by A (A is better)
 *
 * This optimizer:
 * 1. Generates multiple candidate plans
 * 2. Evaluates them on all objectives
 * 3. Finds the Pareto frontier
 * 4. Selects optimal solution based on user preferences
 * 5. Learns preferences over time
 */

import { AgentId, ExecutionPattern, ProjectContext } from '../types.js';
import { bayesianEngine } from './bayesian_confidence.js';
import { semanticEmbedder, SemanticEmbedding } from './semantic_embedder.js';

/**
 * Multi-objective scores for a plan
 */
export interface ObjectiveScores {
  accuracy: number;     // 0.0 to 1.0 (predicted success rate)
  cost: number;         // 0.0 to 1.0 (normalized, lower is better)
  latency: number;      // 0.0 to 1.0 (normalized, lower is better)
}

/**
 * A candidate plan with its objective scores
 */
export interface ParetoCandidate {
  plan_id: string;
  agents: AgentId[];
  scores: ObjectiveScores;
  raw_metrics: {
    estimated_tokens: number;
    estimated_duration_ms: number;
    confidence: number;
  };
  is_pareto_optimal: boolean;
  dominance_count: number; // How many solutions this dominates
}

/**
 * User preferences for objective weights
 */
export interface UserPreferences {
  accuracy_weight: number;   // 0.0 to 1.0
  cost_weight: number;       // 0.0 to 1.0
  latency_weight: number;    // 0.0 to 1.0
  preference_strength: number; // How confident we are in these preferences
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  pareto_frontier: ParetoCandidate[];
  recommended_plan: ParetoCandidate;
  all_candidates: ParetoCandidate[];
  user_preferences: UserPreferences;
  reasoning: string;
}

/**
 * Pareto Optimizer - Finds optimal trade-offs between objectives
 */
export class ParetoOptimizer {
  private user_preferences: UserPreferences = {
    accuracy_weight: 0.5,
    cost_weight: 0.25,
    latency_weight: 0.25,
    preference_strength: 0.3 // Low initial confidence
  };
  private preference_history: Array<{ choice: string; alternatives: string[]; timestamp: number }> = [];

  /**
   * Optimize agent selection for multiple objectives
   */
  async optimize(
    objective: string,
    candidate_plans: AgentId[][],
    objective_embedding: SemanticEmbedding,
    context?: ProjectContext,
    execution_history?: ExecutionPattern[]
  ): Promise<OptimizationResult> {
    console.log(`[ParetoOptimizer] Optimizing ${candidate_plans.length} candidate plans`);

    // Evaluate all candidates
    const candidates = await this.evaluateCandidates(
      candidate_plans,
      objective_embedding,
      context,
      execution_history
    );

    // Find Pareto frontier
    const pareto_frontier = this.findParetoFrontier(candidates);

    console.log(`[ParetoOptimizer] Pareto frontier contains ${pareto_frontier.length} optimal solutions`);

    // Select best solution based on user preferences
    const recommended_plan = this.selectBestPlan(pareto_frontier, this.user_preferences);

    const reasoning = this.explainChoice(recommended_plan, pareto_frontier, this.user_preferences);

    return {
      pareto_frontier,
      recommended_plan,
      all_candidates: candidates,
      user_preferences: { ...this.user_preferences },
      reasoning
    };
  }

  /**
   * Evaluate all candidate plans on all objectives
   */
  private async evaluateCandidates(
    plans: AgentId[][],
    objective_embedding: SemanticEmbedding,
    context?: ProjectContext,
    execution_history?: ExecutionPattern[]
  ): Promise<ParetoCandidate[]> {
    const candidates: ParetoCandidate[] = [];

    for (let i = 0; i < plans.length; i++) {
      const agents = plans[i];
      const plan_id = `plan_${i}`;

      // Estimate accuracy (from Bayesian confidence)
      const confidence_result = bayesianEngine.calculateConfidence(
        agents,
        objective_embedding,
        context,
        execution_history || []
      );
      const accuracy = confidence_result.confidence;

      // Estimate cost (token usage)
      const estimated_tokens = this.estimateTokens(agents);
      const cost = this.normalizeTokens(estimated_tokens);

      // Estimate latency (duration)
      const estimated_duration_ms = this.estimateDuration(agents);
      const latency = this.normalizeDuration(estimated_duration_ms);

      candidates.push({
        plan_id,
        agents,
        scores: { accuracy, cost, latency },
        raw_metrics: {
          estimated_tokens,
          estimated_duration_ms,
          confidence: accuracy
        },
        is_pareto_optimal: false,
        dominance_count: 0
      });
    }

    return candidates;
  }

  /**
   * Find Pareto frontier - all non-dominated solutions
   */
  private findParetoFrontier(candidates: ParetoCandidate[]): ParetoCandidate[] {
    const frontier: ParetoCandidate[] = [];

    for (const candidate of candidates) {
      let is_dominated = false;

      // Check if this candidate is dominated by any other
      for (const other of candidates) {
        if (candidate.plan_id === other.plan_id) continue;

        if (this.dominates(other, candidate)) {
          is_dominated = true;
          break;
        }
      }

      if (!is_dominated) {
        candidate.is_pareto_optimal = true;

        // Count how many solutions this dominates
        candidate.dominance_count = candidates.filter(
          c => c.plan_id !== candidate.plan_id && this.dominates(candidate, c)
        ).length;

        frontier.push(candidate);
      }
    }

    // Sort frontier by dominance count (more dominant = better)
    frontier.sort((a, b) => b.dominance_count - a.dominance_count);

    return frontier;
  }

  /**
   * Check if plan A dominates plan B
   * A dominates B if A is better or equal in ALL objectives and strictly better in at least one
   */
  private dominates(a: ParetoCandidate, b: ParetoCandidate): boolean {
    const a_scores = a.scores;
    const b_scores = b.scores;

    // For accuracy: higher is better
    // For cost and latency: lower is better (we store normalized 0-1, lower is better)

    const accuracy_better_or_equal = a_scores.accuracy >= b_scores.accuracy;
    const cost_better_or_equal = a_scores.cost <= b_scores.cost;
    const latency_better_or_equal = a_scores.latency <= b_scores.latency;

    const accuracy_strictly_better = a_scores.accuracy > b_scores.accuracy;
    const cost_strictly_better = a_scores.cost < b_scores.cost;
    const latency_strictly_better = a_scores.latency < b_scores.latency;

    const all_better_or_equal = accuracy_better_or_equal && cost_better_or_equal && latency_better_or_equal;
    const at_least_one_strictly_better = accuracy_strictly_better || cost_strictly_better || latency_strictly_better;

    return all_better_or_equal && at_least_one_strictly_better;
  }

  /**
   * Select best plan from Pareto frontier based on user preferences
   */
  private selectBestPlan(
    frontier: ParetoCandidate[],
    preferences: UserPreferences
  ): ParetoCandidate {
    if (frontier.length === 0) {
      throw new Error('Pareto frontier is empty');
    }

    if (frontier.length === 1) {
      return frontier[0];
    }

    // Calculate weighted utility for each plan
    let best_plan = frontier[0];
    let best_utility = -Infinity;

    for (const plan of frontier) {
      const utility = this.calculateUtility(plan, preferences);

      if (utility > best_utility) {
        best_utility = utility;
        best_plan = plan;
      }
    }

    return best_plan;
  }

  /**
   * Calculate utility score for a plan given user preferences
   */
  private calculateUtility(plan: ParetoCandidate, preferences: UserPreferences): number {
    const { accuracy, cost, latency } = plan.scores;
    const { accuracy_weight, cost_weight, latency_weight } = preferences;

    // Normalize weights to sum to 1.0
    const total_weight = accuracy_weight + cost_weight + latency_weight;
    const norm_accuracy_w = accuracy_weight / total_weight;
    const norm_cost_w = cost_weight / total_weight;
    const norm_latency_w = latency_weight / total_weight;

    // For cost and latency, we want to minimize, so we use (1 - score)
    const utility =
      accuracy * norm_accuracy_w +
      (1 - cost) * norm_cost_w +
      (1 - latency) * norm_latency_w;

    return utility;
  }

  /**
   * Explain why a plan was chosen
   */
  private explainChoice(
    chosen: ParetoCandidate,
    frontier: ParetoCandidate[],
    preferences: UserPreferences
  ): string {
    const { accuracy, cost, latency } = chosen.scores;
    const { estimated_tokens, estimated_duration_ms, confidence } = chosen.raw_metrics;

    let reasoning = `Selected plan with ${chosen.agents.length} agents:\n`;
    reasoning += `  • Accuracy: ${(accuracy * 100).toFixed(1)}% (confidence: ${(confidence * 100).toFixed(1)}%)\n`;
    reasoning += `  • Cost: ~${estimated_tokens.toLocaleString()} tokens\n`;
    reasoning += `  • Latency: ~${(estimated_duration_ms / 1000).toFixed(1)}s\n\n`;

    // Explain trade-offs
    if (frontier.length > 1) {
      reasoning += `This plan is on the Pareto frontier with ${frontier.length - 1} alternative(s).\n`;

      // Find what makes this plan special
      const best_accuracy = Math.max(...frontier.map(p => p.scores.accuracy));
      const best_cost = Math.min(...frontier.map(p => p.scores.cost));
      const best_latency = Math.min(...frontier.map(p => p.scores.latency));

      if (accuracy === best_accuracy) {
        reasoning += `  ✓ Highest accuracy among optimal solutions\n`;
      }
      if (cost === best_cost) {
        reasoning += `  ✓ Lowest cost among optimal solutions\n`;
      }
      if (latency === best_latency) {
        reasoning += `  ✓ Fastest execution among optimal solutions\n`;
      }

      reasoning += `\nBased on your preferences (accuracy: ${(preferences.accuracy_weight * 100).toFixed(0)}%, `;
      reasoning += `cost: ${(preferences.cost_weight * 100).toFixed(0)}%, `;
      reasoning += `latency: ${(preferences.latency_weight * 100).toFixed(0)}%), this offers the best trade-off.`;
    } else {
      reasoning += `This is the only Pareto-optimal solution - it strictly dominates all other plans.`;
    }

    return reasoning;
  }

  /**
   * Learn user preferences from their choices
   */
  async learnPreferences(
    chosen_plan: ParetoCandidate,
    rejected_plans: ParetoCandidate[]
  ): Promise<void> {
    console.log(`[ParetoOptimizer] Learning from user choice: ${chosen_plan.plan_id}`);

    // Record choice
    this.preference_history.push({
      choice: chosen_plan.plan_id,
      alternatives: rejected_plans.map(p => p.plan_id),
      timestamp: Date.now()
    });

    // Analyze what the user preferred
    const chosen_scores = chosen_plan.scores;

    // Calculate average scores of rejected plans
    const avg_rejected = {
      accuracy: rejected_plans.reduce((sum, p) => sum + p.scores.accuracy, 0) / rejected_plans.length,
      cost: rejected_plans.reduce((sum, p) => sum + p.scores.cost, 0) / rejected_plans.length,
      latency: rejected_plans.reduce((sum, p) => sum + p.scores.latency, 0) / rejected_plans.length
    };

    // Update preferences based on differences
    const accuracy_preference = chosen_scores.accuracy - avg_rejected.accuracy;
    const cost_preference = avg_rejected.cost - chosen_scores.cost; // Reversed (lower is better)
    const latency_preference = avg_rejected.latency - chosen_scores.latency; // Reversed

    // Apply learning (exponential moving average)
    const learning_rate = 0.1;
    const old_prefs = this.user_preferences;

    this.user_preferences.accuracy_weight += accuracy_preference * learning_rate;
    this.user_preferences.cost_weight += cost_preference * learning_rate;
    this.user_preferences.latency_weight += latency_preference * learning_rate;

    // Normalize weights
    const total = this.user_preferences.accuracy_weight +
                  this.user_preferences.cost_weight +
                  this.user_preferences.latency_weight;

    this.user_preferences.accuracy_weight /= total;
    this.user_preferences.cost_weight /= total;
    this.user_preferences.latency_weight /= total;

    // Increase preference strength with more data
    this.user_preferences.preference_strength = Math.min(
      1.0,
      this.user_preferences.preference_strength + 0.05
    );

    console.log(`[ParetoOptimizer] Updated preferences:`);
    console.log(`  Accuracy: ${(old_prefs.accuracy_weight * 100).toFixed(1)}% → ${(this.user_preferences.accuracy_weight * 100).toFixed(1)}%`);
    console.log(`  Cost: ${(old_prefs.cost_weight * 100).toFixed(1)}% → ${(this.user_preferences.cost_weight * 100).toFixed(1)}%`);
    console.log(`  Latency: ${(old_prefs.latency_weight * 100).toFixed(1)}% → ${(this.user_preferences.latency_weight * 100).toFixed(1)}%`);
  }

  /**
   * Estimate token usage for a plan
   */
  private estimateTokens(agents: AgentId[]): number {
    // Baseline: 1000 tokens per agent
    let tokens = agents.length * 1000;

    // Complex agents use more tokens
    for (const agent of agents) {
      if (agent.includes('six_eyes') || agent.includes('limitless')) {
        tokens += 500; // Complex analysis
      }
      if (agent.includes('implement') || agent.includes('construction')) {
        tokens += 300; // Implementation details
      }
    }

    return tokens;
  }

  /**
   * Normalize token count to 0.0-1.0 scale (lower is better)
   */
  private normalizeTokens(tokens: number): number {
    // Assume 20k tokens is "expensive" (1.0), 1k is "cheap" (0.0)
    const min_tokens = 1000;
    const max_tokens = 20000;

    const normalized = (tokens - min_tokens) / (max_tokens - min_tokens);
    return Math.max(0.0, Math.min(1.0, normalized));
  }

  /**
   * Estimate execution duration for a plan
   */
  private estimateDuration(agents: AgentId[]): number {
    // Baseline: 2 seconds per agent
    let duration_ms = agents.length * 2000;

    // Complex agents take longer
    for (const agent of agents) {
      if (agent.includes('six_eyes') || agent.includes('mahoraga')) {
        duration_ms += 1000; // Complex analysis
      }
      if (agent.includes('implement') || agent.includes('construction')) {
        duration_ms += 500; // Implementation time
      }
    }

    return duration_ms;
  }

  /**
   * Normalize duration to 0.0-1.0 scale (lower is better)
   */
  private normalizeDuration(duration_ms: number): number {
    // Assume 30 seconds is "slow" (1.0), 2 seconds is "fast" (0.0)
    const min_duration = 2000;
    const max_duration = 30000;

    const normalized = (duration_ms - min_duration) / (max_duration - min_duration);
    return Math.max(0.0, Math.min(1.0, normalized));
  }

  /**
   * Get current user preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.user_preferences };
  }

  /**
   * Manually set user preferences
   */
  setPreferences(preferences: Partial<UserPreferences>): void {
    if (preferences.accuracy_weight !== undefined) {
      this.user_preferences.accuracy_weight = preferences.accuracy_weight;
    }
    if (preferences.cost_weight !== undefined) {
      this.user_preferences.cost_weight = preferences.cost_weight;
    }
    if (preferences.latency_weight !== undefined) {
      this.user_preferences.latency_weight = preferences.latency_weight;
    }
    if (preferences.preference_strength !== undefined) {
      this.user_preferences.preference_strength = preferences.preference_strength;
    }

    // Normalize weights
    const total = this.user_preferences.accuracy_weight +
                  this.user_preferences.cost_weight +
                  this.user_preferences.latency_weight;

    this.user_preferences.accuracy_weight /= total;
    this.user_preferences.cost_weight /= total;
    this.user_preferences.latency_weight /= total;
  }

  /**
   * Get preference learning history
   */
  getPreferenceHistory(): Array<{ choice: string; alternatives: string[]; timestamp: number }> {
    return [...this.preference_history];
  }
}

/**
 * Singleton instance
 */
export const paretoOptimizer = new ParetoOptimizer();
