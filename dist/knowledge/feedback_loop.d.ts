/**
 * Feedback Loop Engine - Closed-Loop Learning System
 *
 * This is the CRITICAL missing piece that makes Mendicant genuinely adaptive.
 * After EVERY execution, this system feeds results back into ALL intelligence systems:
 * - Semantic Embedder: Learn actual intents/domains from execution patterns
 * - Bayesian Engine: Calibrate confidence predictions against actual outcomes
 * - Temporal Engine: Update pattern relevance and decay rates
 * - Conflict Detector: Learn which agent combinations conflict
 * - Agent Specialization: Update agent expertise profiles
 *
 * Without this loop, Mendicant cannot learn from experience.
 * With this loop, Mendicant becomes genuinely omniscient over time.
 */
import { AgentId, ProjectContext } from '../types.js';
export interface ExecutionFeedback {
    objective: string;
    agents_used: AgentId[];
    predicted_confidence: number;
    predicted_intents: string[];
    predicted_domains: string[];
    actual_success: boolean;
    actual_duration_ms: number;
    actual_tokens_used: number;
    errors_encountered: string[];
    conflicts_detected: ConflictFeedback[];
    user_satisfaction?: number;
    context?: ProjectContext;
    timestamp: number;
}
export interface ConflictFeedback {
    agent_a: AgentId;
    agent_b: AgentId;
    conflict_type: 'resource' | 'semantic' | 'ordering' | 'unknown';
    severity: number;
    resolution_strategy?: string;
}
export interface LearningMetrics {
    patterns_processed: number;
    calibration_improvement: number;
    agent_performance_updates: Map<AgentId, number>;
    semantic_accuracy: number;
    conflict_prediction_accuracy: number;
    temporal_health_improvement: number;
}
/**
 * Feedback Loop Engine - Orchestrates all learning updates
 */
export declare class FeedbackLoopEngine {
    private feedback_history;
    private learning_metrics;
    /**
     * Main feedback processing - called after EVERY execution
     */
    processFeedback(feedback: ExecutionFeedback): Promise<LearningMetrics>;
    /**
     * Update semantic embedder with observed intents and domains
     */
    private updateSemanticLearning;
    /**
     * Infer actual intents from execution patterns
     */
    private inferActualIntents;
    /**
     * Infer actual domains from execution context
     */
    private inferActualDomains;
    /**
     * Calibrate Bayesian confidence model with actual outcomes
     */
    private updateConfidenceCalibration;
    /**
     * Calculate average Brier score over recent predictions
     */
    private calculateAverageBrierScore;
    /**
     * Update agent performance priors based on actual results
     */
    private updateAgentPerformance;
    /**
     * Learn conflict patterns from observed conflicts
     */
    private updateConflictLearning;
    /**
     * Update temporal knowledge with fresh execution data
     */
    private updateTemporalKnowledge;
    /**
     * Calculate temporal health from feedback history
     */
    private calculateTemporalHealthFromHistory;
    /**
     * Create enriched execution pattern from feedback
     */
    private createExecutionPattern;
    /**
     * Get learning statistics
     */
    getMetrics(): LearningMetrics;
    /**
     * Get feedback history for analysis
     */
    getHistory(limit?: number): ExecutionFeedback[];
    /**
     * Clear old feedback (keeps last N entries)
     */
    pruneHistory(keep_count?: number): number;
}
/**
 * Singleton instance
 */
export declare const feedbackLoop: FeedbackLoopEngine;
//# sourceMappingURL=feedback_loop.d.ts.map