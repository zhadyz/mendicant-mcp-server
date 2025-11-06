/**
 * CONFIDENCE VALIDATOR
 *
 * Validates that plans have sufficient confidence before execution.
 * Prevents execution of low-confidence plans that are likely to fail.
 */

import type { AgentId, OrchestrationPlan } from '../types.js';

export interface ConfidenceAnalysis {
  should_execute: boolean;
  overall_confidence: number;
  confidence_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  confidence_sources: ConfidenceSource[];
  warnings: string[];
  recommendations: string[];
}

export interface ConfidenceSource {
  source: string;
  confidence: number;
  weight: number;
  reasoning: string;
}

export interface ConfidenceThresholds {
  minimum_overall?: number;        // Minimum overall confidence (default: 0.3)
  warning_threshold?: number;      // Warn below this (default: 0.5)
  high_confidence?: number;        // Consider high confidence (default: 0.7)
  require_fallback_below?: number; // Require fallback agent below this (default: 0.4)
}

const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  minimum_overall: 0.3,
  warning_threshold: 0.5,
  high_confidence: 0.7,
  require_fallback_below: 0.4
};

/**
 * Validates that a plan has sufficient confidence to execute
 */
export function validateConfidence(
  plan: OrchestrationPlan,
  semanticConfidence?: number,
  mahoragaConfidence?: number,
  patternConfidence?: number,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): ConfidenceAnalysis {
  // Merge provided thresholds with defaults
  const mergedThresholds: Required<ConfidenceThresholds> = {
    minimum_overall: thresholds?.minimum_overall ?? DEFAULT_THRESHOLDS.minimum_overall!,
    warning_threshold: thresholds?.warning_threshold ?? DEFAULT_THRESHOLDS.warning_threshold!,
    high_confidence: thresholds?.high_confidence ?? DEFAULT_THRESHOLDS.high_confidence!,
    require_fallback_below: thresholds?.require_fallback_below ?? DEFAULT_THRESHOLDS.require_fallback_below!
  };

  const confidence_sources: ConfidenceSource[] = [];

  // 1. Semantic Analysis Confidence (high weight)
  if (semanticConfidence !== undefined) {
    confidence_sources.push({
      source: 'semantic_analysis',
      confidence: semanticConfidence,
      weight: 0.4,
      reasoning: `Semantic analysis confidence based on intent/domain/task detection`
    });
  }

  // 2. Mahoraga Predictive Confidence (very high weight)
  if (mahoragaConfidence !== undefined) {
    confidence_sources.push({
      source: 'mahoraga_prediction',
      confidence: mahoragaConfidence,
      weight: 0.4,
      reasoning: `Mahoraga predictive intelligence based on similar past executions`
    });
  }

  // 3. Pattern Matching Confidence (medium weight)
  if (patternConfidence !== undefined) {
    confidence_sources.push({
      source: 'pattern_matching',
      confidence: patternConfidence,
      weight: 0.2,
      reasoning: `Pattern matching confidence from historical patterns`
    });
  }

  // 4. Agent Registry Confidence (low weight)
  // Check if we have historical data for these agents
  const hasUnknownAgents = plan.agents.some(spec =>
    typeof spec === 'object' && spec.agent_id.startsWith('unknown_')
  );
  if (!hasUnknownAgents) {
    confidence_sources.push({
      source: 'agent_registry',
      confidence: 0.7, // Base confidence if agents are known
      weight: 0.1,
      reasoning: `All agents are known and tracked in registry`
    });
  }

  // Calculate weighted average confidence
  const overall_confidence = calculateWeightedConfidence(confidence_sources);

  // Determine confidence level
  const confidence_level = categorizeConfidence(overall_confidence);

  // Check if execution should proceed
  const should_execute = overall_confidence >= mergedThresholds.minimum_overall;

  // Generate warnings
  const warnings: string[] = [];
  if (overall_confidence < mergedThresholds.warning_threshold) {
    warnings.push(`Low confidence (${(overall_confidence * 100).toFixed(0)}%) - execution may fail`);
  }
  if (overall_confidence < mergedThresholds.minimum_overall) {
    warnings.push(`CRITICAL: Confidence below minimum threshold (${(mergedThresholds.minimum_overall * 100).toFixed(0)}%)`);
  }
  if (hasUnknownAgents) {
    warnings.push(`Plan includes agents not in registry - predictions unreliable`);
  }
  if (confidence_sources.length < 2) {
    warnings.push(`Limited confidence sources - predictions less reliable`);
  }

  // Generate recommendations
  const recommendations = generateConfidenceRecommendations(
    overall_confidence,
    confidence_sources,
    mergedThresholds,
    plan
  );

  return {
    should_execute,
    overall_confidence,
    confidence_level,
    confidence_sources,
    warnings,
    recommendations
  };
}

/**
 * Calculates weighted average confidence from multiple sources
 */
function calculateWeightedConfidence(sources: ConfidenceSource[]): number {
  if (sources.length === 0) {
    return 0.0; // No confidence data = zero confidence
  }

  // Calculate weighted sum
  const weightedSum = sources.reduce((sum, source) => {
    return sum + (source.confidence * source.weight);
  }, 0);

  // Calculate total weight
  const totalWeight = sources.reduce((sum, source) => sum + source.weight, 0);

  // Return weighted average
  return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
}

/**
 * Categorizes confidence into human-readable levels
 */
function categorizeConfidence(confidence: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
  if (confidence < 0.3) return 'very_low';
  if (confidence < 0.5) return 'low';
  if (confidence < 0.7) return 'medium';
  if (confidence < 0.85) return 'high';
  return 'very_high';
}

/**
 * Generates recommendations based on confidence analysis
 */
function generateConfidenceRecommendations(
  confidence: number,
  sources: ConfidenceSource[],
  thresholds: Required<ConfidenceThresholds>,
  plan: OrchestrationPlan
): string[] {
  const recommendations: string[] = [];

  // VERY LOW CONFIDENCE (<30%)
  if (confidence < thresholds.minimum_overall) {
    recommendations.push('CRITICAL: Confidence too low - DO NOT EXECUTE without modifications');
    recommendations.push('Invoke the_librarian for requirements clarification');
    recommendations.push('Invoke the_didact for research and investigation');
    recommendations.push('Consider breaking objective into smaller, clearer sub-tasks');
    recommendations.push('Use pattern refinement tools to generate alternative plans');
  }
  // LOW CONFIDENCE (30-50%)
  else if (confidence < thresholds.warning_threshold) {
    recommendations.push('WARNING: Low confidence - proceed with caution');
    recommendations.push('Add the_oracle as validation agent after execution');
    recommendations.push('Consider dry-run or staging environment first');
    recommendations.push('Monitor execution closely for early warning signs');
  }
  // MEDIUM CONFIDENCE (50-70%)
  else if (confidence < thresholds.high_confidence) {
    recommendations.push('Moderate confidence - execution reasonable but not guaranteed');
    recommendations.push('Consider adding the_oracle for validation');
    recommendations.push('Enable verbose logging to track execution');
  }
  // HIGH CONFIDENCE (70%+)
  else {
    recommendations.push('High confidence - execution recommended');
    if (confidence >= 0.9) {
      recommendations.push('Very high confidence - strong historical success patterns');
    }
  }

  // Check for specific confidence source issues
  const hasSemanticConfidence = sources.some(s => s.source === 'semantic_analysis');
  const hasMahoragaConfidence = sources.some(s => s.source === 'mahoraga_prediction');
  const hasPatternConfidence = sources.some(s => s.source === 'pattern_matching');

  if (!hasSemanticConfidence) {
    recommendations.push('No semantic analysis data - intent may be misunderstood');
  }
  if (!hasMahoragaConfidence) {
    recommendations.push('No historical predictions - first-time objective type');
  }
  if (!hasPatternConfidence) {
    recommendations.push('No pattern match found - using custom plan generation');
  }

  // Check agent count
  const agentCount = plan.agents.length;
  if (agentCount === 0) {
    recommendations.push('CRITICAL: No agents selected - plan invalid');
  } else if (agentCount === 1 && confidence < 0.6) {
    recommendations.push('Single agent with low confidence - consider adding support agents');
  } else if (agentCount > 5) {
    recommendations.push(`Large agent count (${agentCount}) - consider simplifying or phasing`);
  }

  return recommendations;
}

/**
 * Determines if plan should include fallback/validation agents
 */
export function shouldAddFallbackAgents(confidence: number, thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS): boolean {
  const mergedThresholds: Required<ConfidenceThresholds> = {
    minimum_overall: thresholds?.minimum_overall ?? DEFAULT_THRESHOLDS.minimum_overall!,
    warning_threshold: thresholds?.warning_threshold ?? DEFAULT_THRESHOLDS.warning_threshold!,
    high_confidence: thresholds?.high_confidence ?? DEFAULT_THRESHOLDS.high_confidence!,
    require_fallback_below: thresholds?.require_fallback_below ?? DEFAULT_THRESHOLDS.require_fallback_below!
  };
  return confidence < mergedThresholds.require_fallback_below;
}

/**
 * Suggests fallback agents to add based on confidence level
 */
export function suggestFallbackAgents(
  confidence: number,
  plan: OrchestrationPlan
): AgentId[] {
  const fallbackAgents: AgentId[] = [];

  // Very low confidence - add the_librarian for clarification
  if (confidence < 0.3) {
    fallbackAgents.push('the_librarian');
  }

  // Low to medium confidence - add the_oracle for validation
  if (confidence < 0.6 && !plan.agents.some(a => typeof a === 'object' && a.agent_id === 'the_oracle')) {
    fallbackAgents.push('the_oracle');
  }

  // If no research agent and low confidence - add the_didact
  if (confidence < 0.5 && !plan.agents.some(a => typeof a === 'object' && a.agent_id === 'the_didact')) {
    fallbackAgents.push('the_didact');
  }

  return fallbackAgents;
}

/**
 * Gets confidence message for user display
 */
export function getConfidenceMessage(analysis: ConfidenceAnalysis): string {
  const percentage = (analysis.overall_confidence * 100).toFixed(0);
  const level = analysis.confidence_level.replace('_', ' ').toUpperCase();

  let message = `Confidence: ${percentage}% (${level})`;

  if (!analysis.should_execute) {
    message += ' - EXECUTION BLOCKED';
  } else if (analysis.warnings.length > 0) {
    message += ` - ${analysis.warnings.length} warning(s)`;
  }

  return message;
}
