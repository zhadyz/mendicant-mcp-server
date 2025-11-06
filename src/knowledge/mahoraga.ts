/**
 * MAHORAGA - Adaptive Intelligence Engine
 *
 * Named after the shikigami that adapts to any phenomenon.
 * This engine learns from every execution and becomes immune to patterns of failure.
 *
 * Core Capabilities:
 * 1. Pattern Recognition - Finds similar past executions
 * 2. Predictive Selection - Predicts agent success before spawning
 * 3. Failure Analysis - Learns WHY things fail, not just that they failed
 * 4. Adaptive Refinement - Automatically improves failed plans
 * 5. Context Awareness - Understands project context and objective similarity
 */

import type {
  ExecutionPattern,
  FailureContext,
  PatternMatch,
  PredictiveScore,
  AdaptiveRefinement,
  AgentId,
  ProjectContext,
  OrchestrationPlan,
  AgentResult,
  Conflict,
  Gap
} from '../types.js';
import { classifyError as classifyErrorEnhanced, getContextualAdvice } from './error_classifier.js';
import { generateBootstrapPatterns } from './bootstrap.js';

/**
 * Mahoraga's memory - stores and retrieves execution patterns
 */
export class MahoragaMemory {
  private patterns: Map<string, ExecutionPattern> = new Map();
  private failures: Map<string, FailureContext> = new Map();

  /**
   * Record a complete execution pattern
   */
  recordPattern(pattern: ExecutionPattern): void {
    this.patterns.set(pattern.id, pattern);

    // If it failed, extract failure context
    if (!pattern.success) {
      const failure = this.extractFailureContext(pattern);
      if (failure) {
        this.failures.set(failure.pattern_id, failure);
      }
    }
  }

  /**
   * Find patterns similar to the given objective
   */
  findSimilarPatterns(
    objective: string,
    projectContext?: ProjectContext,
    limit: number = 10
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const objectiveType = this.extractObjectiveType(objective);
    const objectiveTags = this.extractTags(objective, projectContext);

    for (const pattern of this.patterns.values()) {
      const similarity = this.calculateSimilarity(
        objective,
        objectiveType,
        objectiveTags,
        pattern,
        projectContext
      );

      if (similarity > 0.3) { // Minimum threshold
        matches.push({
          pattern,
          similarity_score: similarity,
          matching_factors: this.getMatchingFactors(pattern, objectiveType, objectiveTags, projectContext),
          success_rate: pattern.success ? 1.0 : 0.0,
          avg_duration_ms: pattern.total_duration_ms,
          recommended_agents: pattern.agents_used
        });
      }
    }

    // Sort by similarity and success
    return matches
      .sort((a, b) => {
        const scoreA = a.similarity_score * (a.success_rate + 0.1);
        const scoreB = b.similarity_score * (b.success_rate + 0.1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get all patterns where a specific agent was used
   */
  getPatternsWithAgent(agentId: AgentId): ExecutionPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.agents_used.includes(agentId));
  }

  /**
   * Get failure patterns for learning
   */
  getFailures(agentId?: AgentId): FailureContext[] {
    const failures = Array.from(this.failures.values());
    return agentId
      ? failures.filter(f => f.failed_agent === agentId)
      : failures;
  }

  /**
   * Clear old patterns (older than 30 days)
   */
  pruneOldPatterns(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const [id, pattern] of this.patterns) {
      if (pattern.timestamp < thirtyDaysAgo) {
        this.patterns.delete(id);
        this.failures.delete(id);
      }
    }
  }

  // Private helpers

  private extractFailureContext(pattern: ExecutionPattern): FailureContext | null {
    const failedResult = pattern.agent_results.find(r => !r.success);
    if (!failedResult) return null;

    const failedIndex = pattern.execution_order.indexOf(failedResult.agent_id);
    const precedingAgents = failedIndex > 0
      ? pattern.execution_order.slice(0, failedIndex)
      : [];

    return {
      pattern_id: pattern.id,
      objective: pattern.objective,
      failed_agent: failedResult.agent_id,
      error_message: failedResult.output,
      error_type: this.classifyError(failedResult.output),
      preceding_agents: precedingAgents,
      project_context: pattern.project_context,
      attempted_dependencies: [],
      learned_avoidance: this.generateAvoidanceRule(pattern, failedResult)
    };
  }

  private classifyError(output: string): string {
    // Use comprehensive error classification with contextual advice
    const classification = classifyErrorEnhanced(output);
    return classification.category;
  }

  private generateAvoidanceRule(pattern: ExecutionPattern, failedResult: AgentResult): string {
    const errorType = this.classifyError(failedResult.output);
    const agent = failedResult.agent_id;
    const context = pattern.project_context;

    if (errorType === 'test_failure' && context?.has_tests === false) {
      return `Avoid ${agent} when project has no existing tests`;
    }

    if (errorType === 'compilation_error') {
      return `${agent} may need architecture review before implementation`;
    }

    return `${agent} failed for ${pattern.objective_type} in ${context?.project_type || 'unknown'} project`;
  }

  private extractObjectiveType(objective: string): string {
    const lower = objective.toLowerCase();
    if (lower.includes('implement') || lower.includes('create') || lower.includes('add')) return 'implement';
    if (lower.includes('fix') || lower.includes('bug')) return 'fix';
    if (lower.includes('test') || lower.includes('verify')) return 'test';
    if (lower.includes('deploy') || lower.includes('release')) return 'deploy';
    if (lower.includes('refactor') || lower.includes('cleanup')) return 'refactor';
    if (lower.includes('document') || lower.includes('readme')) return 'document';
    if (lower.includes('security') || lower.includes('audit')) return 'security';
    if (lower.includes('research') || lower.includes('investigate')) return 'research';
    return 'general';
  }

  private extractTags(objective: string, context?: ProjectContext): string[] {
    const tags: string[] = [];
    const lower = objective.toLowerCase();

    // Technology tags
    if (lower.includes('react')) tags.push('react');
    if (lower.includes('nextjs') || lower.includes('next.js')) tags.push('nextjs');
    if (lower.includes('typescript')) tags.push('typescript');
    if (lower.includes('python')) tags.push('python');
    if (lower.includes('docker')) tags.push('docker');
    if (lower.includes('api')) tags.push('api');
    if (lower.includes('database') || lower.includes('db')) tags.push('database');
    if (lower.includes('auth')) tags.push('auth');
    if (lower.includes('security')) tags.push('security');
    if (lower.includes('ui') || lower.includes('frontend')) tags.push('frontend');
    if (lower.includes('backend')) tags.push('backend');

    // Context tags
    if (context?.project_type) tags.push(context.project_type);
    if (context?.has_tests) tags.push('has_tests');

    return tags;
  }

  private calculateSimilarity(
    objective: string,
    objectiveType: string,
    objectiveTags: string[],
    pattern: ExecutionPattern,
    projectContext?: ProjectContext
  ): number {
    let score = 0.0;
    let weights = 0.0;

    // Objective type match (high weight)
    if (pattern.objective_type === objectiveType) {
      score += 0.4;
    }
    weights += 0.4;

    // Tag overlap (medium weight)
    const patternTags = pattern.tags;
    const commonTags = objectiveTags.filter(t => patternTags.includes(t));
    const tagSimilarity = commonTags.length / Math.max(objectiveTags.length, patternTags.length);
    score += tagSimilarity * 0.3;
    weights += 0.3;

    // Project context match (medium weight)
    if (projectContext?.project_type && pattern.project_context?.project_type) {
      if (projectContext.project_type === pattern.project_context.project_type) {
        score += 0.2;
      }
    }
    weights += 0.2;

    // Objective text similarity (low weight)
    const textSimilarity = this.calculateTextSimilarity(objective, pattern.objective);
    score += textSimilarity * 0.1;
    weights += 0.1;

    return score / weights;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const common = words1.filter(w => words2.includes(w));
    return common.length / Math.max(words1.length, words2.length);
  }

  private getMatchingFactors(
    pattern: ExecutionPattern,
    objectiveType: string,
    objectiveTags: string[],
    projectContext?: ProjectContext
  ): string[] {
    const factors: string[] = [];

    if (pattern.objective_type === objectiveType) {
      factors.push('objective_type');
    }

    const commonTags = objectiveTags.filter(t => pattern.tags.includes(t));
    if (commonTags.length > 0) {
      factors.push(`tags:${commonTags.join(',')}`);
    }

    if (projectContext?.project_type && pattern.project_context?.project_type === projectContext.project_type) {
      factors.push('project_type');
    }

    return factors;
  }
}

/**
 * Predictive agent selector - uses learned patterns to predict success
 */
export class PredictiveSelector {
  constructor(private memory: MahoragaMemory) {}

  /**
   * Score agents based on how likely they are to succeed for this objective
   */
  predictAgentSuccess(
    agents: AgentId[],
    objective: string,
    projectContext?: ProjectContext
  ): PredictiveScore[] {
    const scores: PredictiveScore[] = [];
    const similarPatterns = this.memory.findSimilarPatterns(objective, projectContext, 20);

    for (const agentId of agents) {
      const score = this.calculatePredictiveScore(agentId, similarPatterns);
      scores.push(score);
    }

    return scores.sort((a, b) => b.predicted_success_rate - a.predicted_success_rate);
  }

  private calculatePredictiveScore(agentId: AgentId, similarPatterns: PatternMatch[]): PredictiveScore {
    // Find patterns where this agent was used
    const patternsWithAgent = similarPatterns.filter(m =>
      m.pattern.agents_used.includes(agentId)
    );

    if (patternsWithAgent.length === 0) {
      // No data - return baseline
      return {
        agent_id: agentId,
        predicted_success_rate: 0.5,
        confidence: 0.0,
        reasoning: ['No historical data for this agent in similar contexts'],
        historical_performance: {
          similar_objectives: 0,
          success_in_similar: 0,
          avg_tokens_in_similar: 0
        }
      };
    }

    // Calculate success rate in similar contexts
    const successfulPatterns = patternsWithAgent.filter(m => m.pattern.success);
    const successRate = successfulPatterns.length / patternsWithAgent.length;

    // Weight by similarity score
    const weightedSuccessRate = patternsWithAgent.reduce((sum, m) => {
      const success = m.pattern.success ? 1 : 0;
      return sum + (success * m.similarity_score);
    }, 0) / patternsWithAgent.reduce((sum, m) => sum + m.similarity_score, 0);

    // Calculate average tokens
    const avgTokens = patternsWithAgent.reduce((sum, m) => {
      const result = m.pattern.agent_results.find(r => r.agent_id === agentId);
      return sum + (result?.tokens_used || 0);
    }, 0) / patternsWithAgent.length;

    // Confidence based on sample size
    const confidence = Math.min(patternsWithAgent.length / 10, 1.0);

    // Generate reasoning
    const reasoning: string[] = [];
    reasoning.push(`Used in ${patternsWithAgent.length} similar executions`);
    reasoning.push(`Success rate in similar contexts: ${(successRate * 100).toFixed(0)}%`);

    if (weightedSuccessRate > 0.8) {
      reasoning.push('Strong performer in similar scenarios');
    } else if (weightedSuccessRate < 0.5) {
      reasoning.push('Historically struggled with similar objectives');
    }

    return {
      agent_id: agentId,
      predicted_success_rate: weightedSuccessRate,
      confidence,
      reasoning,
      historical_performance: {
        similar_objectives: patternsWithAgent.length,
        success_in_similar: successfulPatterns.length,
        avg_tokens_in_similar: Math.round(avgTokens)
      }
    };
  }
}

/**
 * Failure analyzer - learns from what went wrong
 */
export class FailureAnalyzer {
  constructor(private memory: MahoragaMemory) {}

  /**
   * Analyze a failure and learn how to avoid it
   */
  analyzeFailure(
    objective: string,
    failedAgentId: AgentId,
    error: string,
    precedingAgents: AgentId[],
    projectContext?: ProjectContext
  ): FailureContext {
    // Get comprehensive error classification with contextual advice
    const errorClassification = classifyErrorEnhanced(error);

    // Get similar failures
    const allFailures = this.memory.getFailures(failedAgentId);
    const similarFailures = allFailures.filter(f =>
      this.isSimilarFailure(f, objective, error, projectContext)
    );

    // Generate learned avoidance
    const avoidance = this.generateAvoidanceRule(
      failedAgentId,
      error,
      similarFailures,
      projectContext
    );

    // Suggest fix based on pattern and enhanced classification
    let suggestedFix = this.suggestFix(
      failedAgentId,
      error,
      precedingAgents,
      similarFailures
    );

    // Enhance with contextual advice from error classifier
    if (errorClassification.suggested_fix && errorClassification.confidence >= 0.7) {
      suggestedFix = `${suggestedFix} | Enhanced: ${errorClassification.suggested_fix}`;
    }

    // Add related agent if available
    if (errorClassification.related_agent) {
      suggestedFix = `${suggestedFix} | Consider involving: ${errorClassification.related_agent}`;
    }

    return {
      pattern_id: `failure_${Date.now()}`,
      objective,
      failed_agent: failedAgentId,
      error_message: error,
      error_type: errorClassification.category,
      preceding_agents: precedingAgents,
      project_context: projectContext,
      attempted_dependencies: precedingAgents,
      suggested_fix: suggestedFix,
      learned_avoidance: avoidance
    };
  }

  private isSimilarFailure(
    failure: FailureContext,
    objective: string,
    error: string,
    projectContext?: ProjectContext
  ): boolean {
    // Same error type
    const errorType = this.classifyError(error);
    if (failure.error_type !== errorType) return false;

    // Similar project context
    if (projectContext?.project_type && failure.project_context?.project_type) {
      if (projectContext.project_type !== failure.project_context.project_type) {
        return false;
      }
    }

    return true;
  }

  private classifyError(error: string): string {
    // Use comprehensive error classification with contextual advice
    const classification = classifyErrorEnhanced(error);
    return classification.category;
  }

  private generateAvoidanceRule(
    agentId: AgentId,
    error: string,
    similarFailures: FailureContext[],
    projectContext?: ProjectContext
  ): string {
    const errorType = this.classifyError(error);

    if (similarFailures.length >= 3) {
      return `${agentId} consistently fails with ${errorType} in ${projectContext?.project_type || 'this'} projects - consider alternative approach`;
    }

    if (errorType === 'test_failure') {
      return `Ensure tests are properly configured before running ${agentId}`;
    }

    if (errorType === 'compilation_error') {
      return `Run the_architect before ${agentId} for complex implementations`;
    }

    if (errorType === 'missing_dependency') {
      return `Verify all dependencies are installed before ${agentId}`;
    }

    return `Exercise caution when using ${agentId} for this type of objective`;
  }

  private suggestFix(
    failedAgentId: AgentId,
    error: string,
    precedingAgents: AgentId[],
    similarFailures: FailureContext[]
  ): string {
    const errorType = this.classifyError(error);

    if (errorType === 'compilation_error' && !precedingAgents.includes('the_architect')) {
      return 'Add the_architect before implementation to design proper architecture';
    }

    if (errorType === 'test_failure' && failedAgentId === 'loveless') {
      return 'hollowed_eyes implementation may need fixes - review test output';
    }

    if (errorType === 'missing_dependency') {
      return 'Add the_curator to manage dependencies before implementation';
    }

    // Learn from similar failures
    if (similarFailures.length > 0) {
      const commonPreceding = this.findCommonPrecedingAgents(similarFailures);
      if (commonPreceding.length > 0) {
        return `Try adding [${commonPreceding.join(', ')}] before ${failedAgentId}`;
      }
    }

    return 'Review error details and adjust agent sequence or dependencies';
  }

  private findCommonPrecedingAgents(failures: FailureContext[]): AgentId[] {
    if (failures.length === 0) return [];

    // Find agents that appear in most failure contexts
    const agentCounts = new Map<AgentId, number>();

    for (const failure of failures) {
      for (const agent of failure.preceding_agents) {
        agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
      }
    }

    // Return agents that appear in >50% of failures
    const threshold = failures.length * 0.5;
    return Array.from(agentCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([agent]) => agent);
  }
}

/**
 * Adaptive plan refiner - automatically improves failed plans
 */
export class AdaptivePlanner {
  constructor(
    private memory: MahoragaMemory,
    private failureAnalyzer: FailureAnalyzer
  ) {}

  /**
   * Refine a failed plan based on learned patterns
   * NOW WITH ADAPTIVE CREATIVITY - adjusts strategy based on confidence
   */
  refinePlan(
    originalPlan: OrchestrationPlan,
    failureContext: FailureContext,
    objective: string,
    projectContext?: ProjectContext
  ): AdaptiveRefinement {
    // Find successful patterns for similar objectives
    const successfulPatterns = this.memory
      .findSimilarPatterns(objective, projectContext, 10)
      .filter(m => m.pattern.success);

    // Calculate confidence FIRST to determine strategy
    const confidence = this.calculateRefinementConfidence(successfulPatterns, failureContext);

    // ADAPTIVE STRATEGY SELECTION based on confidence
    let suggestedChanges: AdaptiveRefinement['suggested_changes'];
    let strategyUsed: string;

    if (confidence < 0.3) {
      // LOW CONFIDENCE → AGGRESSIVE EXPERIMENTAL REFINEMENT
      suggestedChanges = this.generateAggressiveRefinement(
        originalPlan,
        failureContext,
        objective,
        projectContext
      );
      strategyUsed = 'aggressive_experimental';
    } else if (confidence < 0.7) {
      // MEDIUM CONFIDENCE → HYBRID PATTERN MIXING
      suggestedChanges = this.hybridizePatterns(
        successfulPatterns,
        originalPlan,
        failureContext
      );
      strategyUsed = 'hybrid_cross_pollination';
    } else {
      // HIGH CONFIDENCE → CONSERVATIVE REFINEMENT
      suggestedChanges = this.determinePlanChanges(
        originalPlan,
        failureContext,
        successfulPatterns
      );
      strategyUsed = 'conservative_evidence_based';
    }

    // Generate refined plan
    const refinedPlan = this.applyChanges(originalPlan, suggestedChanges);

    // Generate reasoning with strategy context
    const reasoning = `[Strategy: ${strategyUsed}, Confidence: ${(confidence * 100).toFixed(0)}%] ` +
      this.generateRefinementReasoning(
        suggestedChanges,
        failureContext,
        successfulPatterns
      );

    return {
      original_plan: originalPlan,
      failure_analysis: failureContext,
      suggested_changes: suggestedChanges,
      refined_plan: refinedPlan,
      confidence,
      reasoning
    };
  }

  private determinePlanChanges(
    plan: OrchestrationPlan,
    failure: FailureContext,
    successfulPatterns: PatternMatch[]
  ): AdaptiveRefinement['suggested_changes'] {
    const changes: AdaptiveRefinement['suggested_changes'] = {
      agents_to_add: [],
      agents_to_remove: [],
      agents_to_reorder: [],
      dependency_changes: []
    };

    // Analyze what successful patterns have that we don't
    if (successfulPatterns.length > 0) {
      const commonAgents = this.findCommonAgents(successfulPatterns);
      const currentAgents = plan.agents.map(a => a.agent_id);

      for (const agent of commonAgents) {
        if (!currentAgents.includes(agent)) {
          changes.agents_to_add.push(agent);
        }
      }
    }

    // Remove failed agent if it consistently fails
    const failures = this.memory.getFailures(failure.failed_agent);
    if (failures.length >= 3) {
      changes.agents_to_remove.push(failure.failed_agent);
    }

    // Add missing dependencies based on error type
    if (failure.error_type === 'compilation_error') {
      if (!plan.agents.some(a => a.agent_id === 'the_architect')) {
        changes.agents_to_add.push('the_architect');
      }
    }

    if (failure.error_type === 'test_failure') {
      if (!plan.agents.some(a => a.agent_id === 'the_scribe')) {
        changes.agents_to_add.push('the_scribe'); // Document before testing
      }
    }

    return changes;
  }

  private findCommonAgents(patterns: PatternMatch[]): AgentId[] {
    const agentCounts = new Map<AgentId, number>();

    for (const match of patterns) {
      for (const agent of match.pattern.agents_used) {
        agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
      }
    }

    // Return agents that appear in >70% of successful patterns
    const threshold = patterns.length * 0.7;
    return Array.from(agentCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([agent]) => agent);
  }

  private applyChanges(
    plan: OrchestrationPlan,
    changes: AdaptiveRefinement['suggested_changes']
  ): OrchestrationPlan {
    // This is a simplified version - in reality we'd need to properly
    // reconstruct the plan with new agents, dependencies, etc.
    const newAgents = [...plan.agents]
      .filter(a => !changes.agents_to_remove.includes(a.agent_id));

    // Add new agents (would need proper specs in real implementation)
    // This is placeholder logic

    return {
      ...plan,
      agents: newAgents,
      reasoning: `Refined plan based on learned patterns`
    };
  }

  private calculateRefinementConfidence(
    successfulPatterns: PatternMatch[],
    failure: FailureContext
  ): number {
    if (successfulPatterns.length === 0) return 0.2;
    if (successfulPatterns.length >= 5) return 0.9;
    return successfulPatterns.length / 5;
  }

  /**
   * AGGRESSIVE REFINEMENT - When confidence is low, get creative
   * This is where Mahoraga truly adapts like its namesake
   */
  private generateAggressiveRefinement(
    plan: OrchestrationPlan,
    failure: FailureContext,
    objective: string,
    projectContext?: ProjectContext
  ): AdaptiveRefinement['suggested_changes'] {
    const changes: AdaptiveRefinement['suggested_changes'] = {
      agents_to_add: [],
      agents_to_remove: [],
      agents_to_reorder: [],
      dependency_changes: []
    };

    console.log('[Mahoraga] Low confidence detected - engaging AGGRESSIVE REFINEMENT');

    // Strategy 1: Cross-domain learning - look at ALL successful patterns regardless of similarity
    const allPatterns = Array.from(this.memory['patterns'].values())
      .filter(p => p.success);

    if (allPatterns.length > 0) {
      // Find agents that frequently appear in successful executions
      const agentFrequency = new Map<AgentId, number>();
      for (const pattern of allPatterns) {
        for (const agent of pattern.agents_used) {
          agentFrequency.set(agent, (agentFrequency.get(agent) || 0) + 1);
        }
      }

      // Get top 3 most successful agents not in current plan
      const currentAgents = plan.agents.map(a => a.agent_id);
      const topAgents = Array.from(agentFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([agent]) => agent)
        .filter(agent => !currentAgents.includes(agent))
        .slice(0, 3);

      changes.agents_to_add.push(...topAgents);
    }

    // Strategy 2: Add exploratory agents for uncertain situations
    if (!plan.agents.some(a => a.agent_id === 'the_didact')) {
      changes.agents_to_add.push('the_didact'); // Research when uncertain
    }

    if (!plan.agents.some(a => a.agent_id === 'the_oracle')) {
      changes.agents_to_add.push('the_oracle'); // Strategic validation
    }

    // Strategy 3: Error-specific experimental additions
    if (failure.error_type === 'unknown' || failure.error_type === 'compilation_error') {
      // Add architect for complex problems
      if (!plan.agents.some(a => a.agent_id === 'the_architect')) {
        changes.agents_to_add.push('the_architect');
      }
    }

    if (failure.error_type === 'test_failure') {
      // Add more verification layers
      if (!plan.agents.some(a => a.agent_id === 'the_scribe')) {
        changes.agents_to_add.push('the_scribe'); // Better docs might help tests
      }
    }

    // Strategy 4: Remove failed agent if it failed multiple times
    const pastFailures = this.memory.getFailures(failure.failed_agent);
    if (pastFailures.length >= 2) { // More aggressive than before (was 3)
      changes.agents_to_remove.push(failure.failed_agent);
      console.log(`[Mahoraga] Removing ${failure.failed_agent} - failed ${pastFailures.length} times`);
    }

    // Strategy 5: Parallel execution optimization is implicit in phased strategies
    // The refined plan will use phased execution when appropriate

    return changes;
  }

  /**
   * HYBRID APPROACH - Mix successful patterns from different domains
   * When we have some data but not enough, cross-pollinate
   */
  private hybridizePatterns(
    successfulPatterns: PatternMatch[],
    plan: OrchestrationPlan,
    failure: FailureContext
  ): AdaptiveRefinement['suggested_changes'] {
    const changes: AdaptiveRefinement['suggested_changes'] = {
      agents_to_add: [],
      agents_to_remove: [],
      agents_to_reorder: [],
      dependency_changes: []
    };

    console.log('[Mahoraga] Medium confidence - hybridizing successful patterns');

    // Take agents from top 3 most similar successful patterns
    const topPatterns = successfulPatterns.slice(0, 3);
    const agentCombinations = new Set<AgentId>();

    for (const match of topPatterns) {
      for (const agent of match.pattern.agents_used) {
        agentCombinations.add(agent);
      }
    }

    // Add agents that appear in successful patterns but not in failed plan
    const currentAgents = plan.agents.map(a => a.agent_id);
    for (const agent of agentCombinations) {
      if (!currentAgents.includes(agent)) {
        changes.agents_to_add.push(agent);
      }
    }

    // If still low number of additions, be more aggressive
    if (changes.agents_to_add.length < 2) {
      // Add verification if missing
      if (!agentCombinations.has('loveless')) {
        changes.agents_to_add.push('loveless');
      }

      // Add research if complex
      if (!agentCombinations.has('the_didact') && failure.error_type !== 'test_failure') {
        changes.agents_to_add.push('the_didact');
      }
    }

    return changes;
  }

  private generateRefinementReasoning(
    changes: AdaptiveRefinement['suggested_changes'],
    failure: FailureContext,
    successfulPatterns: PatternMatch[]
  ): string {
    let reasoning = `Original plan failed with ${failure.error_type}. `;

    if (changes.agents_to_add.length > 0) {
      reasoning += `Adding [${changes.agents_to_add.join(', ')}] based on ${successfulPatterns.length} similar successful executions. `;
    }

    if (changes.agents_to_remove.length > 0) {
      reasoning += `Removing [${changes.agents_to_remove.join(', ')}] due to consistent failures. `;
    }

    reasoning += failure.learned_avoidance || '';

    return reasoning;
  }
}

/**
 * Mahoraga Engine - orchestrates all adaptive intelligence
 */
export class MahoragaEngine {
  private memory: MahoragaMemory;
  private predictor: PredictiveSelector;
  private analyzer: FailureAnalyzer;
  private planner: AdaptivePlanner;

  private isBootstrapped: boolean = false;

  constructor() {
    this.memory = new MahoragaMemory();
    this.predictor = new PredictiveSelector(this.memory);
    this.analyzer = new FailureAnalyzer(this.memory);
    this.planner = new AdaptivePlanner(this.memory, this.analyzer);
  }

  /**
   * Initialize Mahoraga with bootstrap data if memory is empty
   * This solves the cold-start problem by providing synthetic training data
   */
  private ensureBootstrapped(): void {
    if (this.isBootstrapped) return;

    // Check if memory is empty (cold-start)
    const hasPatterns = this.memory['patterns'].size > 0;

    if (!hasPatterns) {
      console.log('[Mahoraga] Cold-start detected. Loading bootstrap patterns...');
      const bootstrapPatterns = generateBootstrapPatterns(100);

      for (const pattern of bootstrapPatterns) {
        this.memory.recordPattern(pattern);
      }

      console.log(`[Mahoraga] Loaded ${bootstrapPatterns.length} bootstrap patterns. Ready for adaptive intelligence.`);
    }

    this.isBootstrapped = true;
  }

  /**
   * Record execution for learning
   */
  recordExecution(
    objective: string,
    plan: OrchestrationPlan,
    results: AgentResult[],
    conflicts: Conflict[],
    gaps: Gap[],
    projectContext?: ProjectContext
  ): void {
    const pattern: ExecutionPattern = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      objective,
      objective_type: this.extractObjectiveType(objective),
      project_context: projectContext,
      agents_used: plan.agents.map(a => a.agent_id),
      execution_order: results.map(r => r.agent_id),
      agent_results: results,
      success: results.every(r => r.success),
      total_duration_ms: results.reduce((sum, r) => sum + (r.duration_ms || 0), 0),
      total_tokens: results.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      conflicts,
      gaps,
      verification_passed: results.some(r => r.agent_id === 'loveless' && r.success),
      failure_reason: results.find(r => !r.success)?.output,
      tags: this.extractTags(objective, projectContext)
    };

    this.memory.recordPattern(pattern);
  }

  /**
   * Get predictive scores for agents
   */
  predictAgents(
    agents: AgentId[],
    objective: string,
    projectContext?: ProjectContext
  ): PredictiveScore[] {
    this.ensureBootstrapped();
    return this.predictor.predictAgentSuccess(agents, objective, projectContext);
  }

  /**
   * Analyze a failure
   */
  analyzeFailure(
    objective: string,
    failedAgentId: AgentId,
    error: string,
    precedingAgents: AgentId[],
    projectContext?: ProjectContext
  ): FailureContext {
    return this.analyzer.analyzeFailure(objective, failedAgentId, error, precedingAgents, projectContext);
  }

  /**
   * Refine a failed plan
   */
  refinePlan(
    originalPlan: OrchestrationPlan,
    failureContext: FailureContext,
    objective: string,
    projectContext?: ProjectContext
  ): AdaptiveRefinement {
    this.ensureBootstrapped();
    return this.planner.refinePlan(originalPlan, failureContext, objective, projectContext);
  }

  /**
   * Find similar successful patterns
   */
  findSimilarSuccessfulPatterns(
    objective: string,
    projectContext?: ProjectContext,
    limit?: number
  ): PatternMatch[] {
    this.ensureBootstrapped();
    return this.memory
      .findSimilarPatterns(objective, projectContext, limit)
      .filter(m => m.pattern.success);
  }

  // Private helpers

  private extractObjectiveType(objective: string): string {
    const lower = objective.toLowerCase();
    if (lower.includes('implement') || lower.includes('create') || lower.includes('add')) return 'implement';
    if (lower.includes('fix') || lower.includes('bug')) return 'fix';
    if (lower.includes('test') || lower.includes('verify')) return 'test';
    if (lower.includes('deploy') || lower.includes('release')) return 'deploy';
    if (lower.includes('refactor') || lower.includes('cleanup')) return 'refactor';
    if (lower.includes('document') || lower.includes('readme')) return 'document';
    if (lower.includes('security') || lower.includes('audit')) return 'security';
    if (lower.includes('research') || lower.includes('investigate')) return 'research';
    return 'general';
  }

  private extractTags(objective: string, context?: ProjectContext): string[] {
    const tags: string[] = [];
    const lower = objective.toLowerCase();

    // Technology tags
    if (lower.includes('react')) tags.push('react');
    if (lower.includes('nextjs') || lower.includes('next.js')) tags.push('nextjs');
    if (lower.includes('typescript')) tags.push('typescript');
    if (lower.includes('python')) tags.push('python');
    if (lower.includes('docker')) tags.push('docker');
    if (lower.includes('api')) tags.push('api');
    if (lower.includes('database') || lower.includes('db')) tags.push('database');
    if (lower.includes('auth')) tags.push('auth');
    if (lower.includes('security')) tags.push('security');
    if (lower.includes('ui') || lower.includes('frontend')) tags.push('frontend');
    if (lower.includes('backend')) tags.push('backend');

    // Context tags
    if (context?.project_type) tags.push(context.project_type);
    if (context?.has_tests) tags.push('has_tests');

    return tags;
  }
}

// Singleton instance
export const mahoraga = new MahoragaEngine();
