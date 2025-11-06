/**
 * BAYESIAN CONFIDENCE ENGINE
 *
 * Replaces naive weighted averaging with proper Bayesian inference.
 * Provides confidence intervals, uncertainty quantification, and calibration.
 *
 * KEY IMPROVEMENTS:
 * - Bayesian updating (not just weighted average)
 * - Confidence intervals with uncertainty
 * - Calibration from execution feedback
 * - Prior probabilities learned from history
 * - Likelihood models for evidence integration
 */
import type { AgentId, ExecutionPattern, ProjectContext } from '../types.js';
import type { SemanticEmbedding } from './semantic_embedder.js';
export interface BayesianConfidence {
    confidence: number;
    uncertainty: number;
    confidence_interval: [number, number];
    calibration_score: number;
    evidence_breakdown: EvidenceSource[];
    warnings: string[];
}
export interface EvidenceSource {
    source: string;
    likelihood: number;
    prior: number;
    posterior: number;
    weight: number;
}
export interface CalibrationPoint {
    predicted_confidence: number;
    actual_success: boolean;
    timestamp: number;
}
/**
 * Bayesian Confidence Engine
 * Uses proper probabilistic reasoning for confidence estimation
 */
export declare class BayesianConfidenceEngine {
    private agent_priors;
    private calibration_history;
    private calibration_curve;
    constructor();
    /**
     * Calculate confidence using Bayesian inference
     *
     * P(success | evidence) = P(evidence | success) * P(success) / P(evidence)
     */
    calculateConfidence(agents: AgentId[], objective_embedding: SemanticEmbedding, context: ProjectContext | undefined, execution_history: ExecutionPattern[]): BayesianConfidence;
    /**
     * Compute evidence from agent historical performance
     */
    private computeAgentEvidence;
    /**
     * Compute evidence from similar objectives
     */
    private computeObjectiveEvidence;
    /**
     * Compute evidence from context similarity
     */
    private computeContextEvidence;
    /**
     * Compute evidence from agent synergy
     */
    private computeSynergyEvidence;
    /**
     * Calculate uncertainty (standard deviation)
     */
    private calculateUncertainty;
    /**
     * Compute historical variance in success rates
     */
    private computeHistoricalVariance;
    /**
     * Apply calibration curve to raw confidence
     */
    private applyCalibration;
    /**
     * Learn from execution to calibrate confidence
     */
    calibrateFromExecution(predicted_confidence: number, actual_success: boolean): Promise<void>;
    /**
     * Rebuild calibration curve using isotonic regression
     */
    private rebuildCalibrationCurve;
    /**
     * Assess calibration quality
     */
    private assessCalibrationQuality;
    /**
     * Initialize priors from bootstrap
     */
    private initializePriors;
    /**
     * Initialize calibration curve
     */
    private initializeCalibrationCurve;
    /**
     * Update agent priors from execution
     */
    updateAgentPriors(agent: AgentId, success: boolean): Promise<void>;
}
export declare const bayesianEngine: BayesianConfidenceEngine;
//# sourceMappingURL=bayesian_confidence.d.ts.map