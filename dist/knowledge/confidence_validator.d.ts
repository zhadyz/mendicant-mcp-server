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
    minimum_overall?: number;
    warning_threshold?: number;
    high_confidence?: number;
    require_fallback_below?: number;
}
/**
 * Validates that a plan has sufficient confidence to execute
 */
export declare function validateConfidence(plan: OrchestrationPlan, semanticConfidence?: number, mahoragaConfidence?: number, patternConfidence?: number, thresholds?: ConfidenceThresholds): ConfidenceAnalysis;
/**
 * Determines if plan should include fallback/validation agents
 */
export declare function shouldAddFallbackAgents(confidence: number, thresholds?: ConfidenceThresholds): boolean;
/**
 * Suggests fallback agents to add based on confidence level
 */
export declare function suggestFallbackAgents(confidence: number, plan: OrchestrationPlan): AgentId[];
/**
 * Gets confidence message for user display
 */
export declare function getConfidenceMessage(analysis: ConfidenceAnalysis): string;
//# sourceMappingURL=confidence_validator.d.ts.map