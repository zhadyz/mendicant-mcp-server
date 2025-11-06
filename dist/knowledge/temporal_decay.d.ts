/**
 * TEMPORAL DECAY ENGINE
 *
 * Adds time-awareness to execution patterns.
 * Knowledge decays at different rates based on domain and context.
 *
 * KEY FEATURES:
 * - Exponential decay based on half-life
 * - Domain-specific decay rates
 * - Context stability estimation
 * - Temporal relevance scoring
 */
import type { ExecutionPattern } from '../types.js';
export interface TemporalPattern extends ExecutionPattern {
    half_life_days: number;
    temporal_relevance: number;
    context_stability: number;
    decay_rate: number;
}
/**
 * Temporal Decay Engine
 * Manages time-aware pattern relevance
 */
export declare class TemporalDecayEngine {
    /**
     * Enrich execution pattern with temporal properties
     */
    enrichPattern(pattern: ExecutionPattern, current_time?: number): TemporalPattern;
    /**
     * Calculate decayed relevance score
     *
     * relevance(t) = base_score * exp(-λt)
     * where λ = ln(2) / half_life
     */
    calculateDecayedScore(pattern: ExecutionPattern, current_time: number, half_life_days?: number): number;
    /**
     * Estimate half-life based on pattern characteristics
     *
     * Different domains have different decay rates:
     * - Framework-specific patterns decay FAST (weeks/months)
     * - Core algorithms decay SLOW (years)
     * - Business logic decays MEDIUM (months/year)
     */
    estimateHalfLife(pattern: ExecutionPattern): number;
    /**
     * Estimate context stability
     *
     * How likely is this context to remain relevant over time?
     */
    estimateContextStability(pattern: ExecutionPattern): number;
    /**
     * Filter patterns by temporal relevance threshold
     */
    filterByRelevance(patterns: ExecutionPattern[], threshold?: number, current_time?: number): TemporalPattern[];
    /**
     * Sort patterns by temporal relevance
     */
    sortByRelevance(patterns: ExecutionPattern[], current_time?: number): TemporalPattern[];
    /**
     * Compute weighted relevance considering both success and temporal decay
     */
    computeWeightedRelevance(pattern: ExecutionPattern, current_time?: number): number;
    /**
     * Get patterns relevant for a specific time window
     */
    getRelevantPatternsInWindow(patterns: ExecutionPattern[], window_days: number, current_time?: number): TemporalPattern[];
    /**
     * Predict when a pattern will become irrelevant
     */
    predictIrrelevanceDate(pattern: ExecutionPattern, relevance_threshold?: number): Date;
    /**
     * Batch enrich patterns
     */
    batchEnrich(patterns: ExecutionPattern[], current_time?: number): TemporalPattern[];
    /**
     * Calculate aggregate temporal health
     * How "fresh" is our knowledge overall?
     */
    calculateTemporalHealth(patterns: ExecutionPattern[], current_time?: number): {
        average_age_days: number;
        average_relevance: number;
        fresh_patterns: number;
        stale_patterns: number;
        health_score: number;
    };
}
export declare const temporalEngine: TemporalDecayEngine;
//# sourceMappingURL=temporal_decay.d.ts.map