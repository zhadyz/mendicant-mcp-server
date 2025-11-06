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
  half_life_days: number;       // How quickly this pattern becomes outdated
  temporal_relevance: number;   // Current relevance (0.0 to 1.0, decays over time)
  context_stability: number;    // How stable is this context (0.0 to 1.0)
  decay_rate: number;           // λ in exponential decay formula
}

/**
 * Temporal Decay Engine
 * Manages time-aware pattern relevance
 */
export class TemporalDecayEngine {
  /**
   * Enrich execution pattern with temporal properties
   */
  enrichPattern(pattern: ExecutionPattern, current_time: number = Date.now()): TemporalPattern {
    // Estimate half-life based on pattern characteristics
    const half_life_days = this.estimateHalfLife(pattern);
    
    // Calculate decay rate (λ = ln(2) / half_life)
    const decay_rate = Math.log(2) / half_life_days;
    
    // Calculate temporal relevance
    const temporal_relevance = this.calculateDecayedScore(pattern, current_time, half_life_days);
    
    // Estimate context stability
    const context_stability = this.estimateContextStability(pattern);
    
    return {
      ...pattern,
      half_life_days,
      temporal_relevance,
      context_stability,
      decay_rate
    };
  }
  
  /**
   * Calculate decayed relevance score
   * 
   * relevance(t) = base_score * exp(-λt)
   * where λ = ln(2) / half_life
   */
  calculateDecayedScore(
    pattern: ExecutionPattern,
    current_time: number,
    half_life_days?: number
  ): number {
    const age_ms = current_time - pattern.timestamp;
    const age_days = age_ms / (1000 * 60 * 60 * 24);
    
    const half_life = half_life_days || this.estimateHalfLife(pattern);
    const lambda = Math.log(2) / half_life;
    
    // Base score (1.0 for success, 0.2 for failure)
    const base_score = pattern.success ? 1.0 : 0.2;
    
    // Exponential decay
    const decayed = base_score * Math.exp(-lambda * age_days);
    
    return Math.max(decayed, 0.01); // Floor at 0.01
  }
  
  /**
   * Estimate half-life based on pattern characteristics
   * 
   * Different domains have different decay rates:
   * - Framework-specific patterns decay FAST (weeks/months)
   * - Core algorithms decay SLOW (years)
   * - Business logic decays MEDIUM (months/year)
   */
  estimateHalfLife(pattern: ExecutionPattern): number {
    const tags = pattern.tags || [];
    const objective_lower = pattern.objective.toLowerCase();
    
    // VERY FAST DECAY (30-60 days) - Rapidly changing tech
    const fast_frameworks = [
      'react', 'nextjs', 'vue', 'angular', 'svelte', 'remix',
      'webpack', 'vite', 'esbuild', 'tailwind', 'shadcn'
    ];
    
    if (fast_frameworks.some(fw => tags.includes(fw) || objective_lower.includes(fw))) {
      return 45; // 1.5 months
    }
    
    // FAST DECAY (90-180 days) - APIs, libraries, tools
    const fast_domains = [
      'api', 'graphql', 'rest', 'grpc', 'trpc',
      'deployment', 'docker', 'kubernetes', 'ci/cd',
      'testing', 'jest', 'vitest', 'cypress', 'playwright'
    ];
    
    if (fast_domains.some(d => tags.includes(d) || objective_lower.includes(d))) {
      return 120; // 4 months
    }
    
    // MEDIUM DECAY (180-365 days) - General implementation patterns
    const medium_domains = [
      'database', 'auth', 'security', 'validation',
      'state management', 'caching', 'optimization'
    ];
    
    if (medium_domains.some(d => tags.includes(d) || objective_lower.includes(d))) {
      return 270; // 9 months
    }
    
    // SLOW DECAY (1-2 years) - Core algorithms, architecture
    const slow_domains = [
      'algorithm', 'data structure', 'architecture', 'design pattern',
      'sorting', 'search', 'graph', 'tree', 'recursion'
    ];
    
    if (slow_domains.some(d => tags.includes(d) || objective_lower.includes(d))) {
      return 550; // 1.5 years
    }
    
    // VERY SLOW DECAY (2+ years) - Fundamental concepts
    const very_slow = [
      'fundamental', 'principle', 'theory', 'mathematics',
      'complexity', 'big-o', 'paradigm'
    ];
    
    if (very_slow.some(v => tags.includes(v) || objective_lower.includes(v))) {
      return 730; // 2 years
    }
    
    // DEFAULT: 6 months
    return 180;
  }
  
  /**
   * Estimate context stability
   * 
   * How likely is this context to remain relevant over time?
   */
  estimateContextStability(pattern: ExecutionPattern): number {
    let stability = 0.5; // Start neutral
    
    const tags = pattern.tags || [];
    const context = pattern.project_context;
    
    // Stable contexts
    if (context) {
      // Well-tested projects are more stable
      if (context.has_tests) {
        stability += 0.2;
      }
      
      // Mature project types are more stable
      const mature_types = ['python', 'java', 'go', 'rust', 'c++'];
      if (mature_types.includes(context.project_type || '')) {
        stability += 0.1;
      }
      
      // Bleeding edge types are less stable
      const bleeding_edge = ['nextjs', 'deno', 'bun'];
      if (bleeding_edge.includes(context.project_type || '')) {
        stability -= 0.2;
      }
    }
    
    // Patterns with many tags are more specific (less stable)
    if (tags.length > 5) {
      stability -= 0.1;
    }
    
    // Successful patterns are more likely to remain relevant
    if (pattern.success) {
      stability += 0.1;
    }
    
    // Patterns with conflicts are less stable
    if ((pattern.conflicts || []).length > 0) {
      stability -= 0.15;
    }
    
    return Math.max(0.0, Math.min(1.0, stability));
  }
  
  /**
   * Filter patterns by temporal relevance threshold
   */
  filterByRelevance(
    patterns: ExecutionPattern[],
    threshold: number = 0.3,
    current_time: number = Date.now()
  ): TemporalPattern[] {
    const enriched = patterns.map(p => this.enrichPattern(p, current_time));
    
    return enriched.filter(p => p.temporal_relevance >= threshold);
  }
  
  /**
   * Sort patterns by temporal relevance
   */
  sortByRelevance(
    patterns: ExecutionPattern[],
    current_time: number = Date.now()
  ): TemporalPattern[] {
    const enriched = patterns.map(p => this.enrichPattern(p, current_time));
    
    return enriched.sort((a, b) => b.temporal_relevance - a.temporal_relevance);
  }
  
  /**
   * Compute weighted relevance considering both success and temporal decay
   */
  computeWeightedRelevance(
    pattern: ExecutionPattern,
    current_time: number = Date.now()
  ): number {
    const temporal = this.enrichPattern(pattern, current_time);
    
    // Combine temporal relevance with context stability
    const base_relevance = temporal.temporal_relevance;
    const stability_boost = temporal.context_stability * 0.2;
    
    return Math.min(1.0, base_relevance + stability_boost);
  }
  
  /**
   * Get patterns relevant for a specific time window
   */
  getRelevantPatternsInWindow(
    patterns: ExecutionPattern[],
    window_days: number,
    current_time: number = Date.now()
  ): TemporalPattern[] {
    const window_ms = window_days * 24 * 60 * 60 * 1000;
    const cutoff_time = current_time - window_ms;
    
    // Filter by time window
    const recent = patterns.filter(p => p.timestamp >= cutoff_time);
    
    // Enrich and sort by relevance
    return this.sortByRelevance(recent, current_time);
  }
  
  /**
   * Predict when a pattern will become irrelevant
   */
  predictIrrelevanceDate(
    pattern: ExecutionPattern,
    relevance_threshold: number = 0.1
  ): Date {
    const enriched = this.enrichPattern(pattern);
    
    // Solve for t when relevance(t) = threshold
    // threshold = base_score * exp(-λt)
    // t = -ln(threshold / base_score) / λ
    
    const base_score = pattern.success ? 1.0 : 0.2;
    const lambda = enriched.decay_rate;
    
    const days_until_irrelevant = -Math.log(relevance_threshold / base_score) / lambda;
    const ms_until_irrelevant = days_until_irrelevant * 24 * 60 * 60 * 1000;
    
    return new Date(pattern.timestamp + ms_until_irrelevant);
  }
  
  /**
   * Batch enrich patterns
   */
  batchEnrich(
    patterns: ExecutionPattern[],
    current_time: number = Date.now()
  ): TemporalPattern[] {
    return patterns.map(p => this.enrichPattern(p, current_time));
  }
  
  /**
   * Calculate aggregate temporal health
   * How "fresh" is our knowledge overall?
   */
  calculateTemporalHealth(
    patterns: ExecutionPattern[],
    current_time: number = Date.now()
  ): {
    average_age_days: number;
    average_relevance: number;
    fresh_patterns: number;  // < 30 days
    stale_patterns: number;  // relevance < 0.3
    health_score: number;    // 0.0 to 1.0
  } {
    if (patterns.length === 0) {
      return {
        average_age_days: 0,
        average_relevance: 0,
        fresh_patterns: 0,
        stale_patterns: 0,
        health_score: 0.5
      };
    }
    
    const enriched = this.batchEnrich(patterns, current_time);
    
    // Calculate metrics
    const total_age_days = enriched.reduce((sum, p) => {
      const age_ms = current_time - p.timestamp;
      return sum + (age_ms / (1000 * 60 * 60 * 24));
    }, 0);
    
    const average_age_days = total_age_days / enriched.length;
    
    const total_relevance = enriched.reduce((sum, p) => sum + p.temporal_relevance, 0);
    const average_relevance = total_relevance / enriched.length;
    
    const fresh_patterns = enriched.filter(p => {
      const age_days = (current_time - p.timestamp) / (1000 * 60 * 60 * 24);
      return age_days < 30;
    }).length;
    
    const stale_patterns = enriched.filter(p => p.temporal_relevance < 0.3).length;
    
    // Health score
    // Higher is better: more recent, more relevant
    const age_score = Math.max(0, 1.0 - (average_age_days / 365)); // Penalize old patterns
    const relevance_score = average_relevance;
    const freshness_ratio = fresh_patterns / enriched.length;
    const staleness_penalty = (stale_patterns / enriched.length) * 0.5;
    
    const health_score = Math.max(0, Math.min(1.0,
      (age_score * 0.3 + relevance_score * 0.4 + freshness_ratio * 0.3) - staleness_penalty
    ));
    
    return {
      average_age_days,
      average_relevance,
      fresh_patterns,
      stale_patterns,
      health_score
    };
  }
}

// Singleton instance
export const temporalEngine = new TemporalDecayEngine();
