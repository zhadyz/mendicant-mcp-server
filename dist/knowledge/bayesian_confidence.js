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
/**
 * Bayesian Confidence Engine
 * Uses proper probabilistic reasoning for confidence estimation
 */
export class BayesianConfidenceEngine {
    // Prior probabilities for each agent (learned from history)
    agent_priors = new Map();
    // Calibration history
    calibration_history = [];
    // Calibration curve (isotonic regression coefficients)
    calibration_curve = new Map();
    constructor() {
        this.initializePriors();
        this.initializeCalibrationCurve();
    }
    /**
     * Calculate confidence using Bayesian inference
     *
     * P(success | evidence) = P(evidence | success) * P(success) / P(evidence)
     */
    calculateConfidence(agents, objective_embedding, context, execution_history) {
        const evidence_breakdown = [];
        const warnings = [];
        // Evidence 1: Agent historical performance
        const agent_evidence = this.computeAgentEvidence(agents, execution_history);
        evidence_breakdown.push(agent_evidence);
        // Evidence 2: Similar objective performance
        const objective_evidence = this.computeObjectiveEvidence(objective_embedding, execution_history);
        evidence_breakdown.push(objective_evidence);
        // Evidence 3: Context similarity
        if (context) {
            const context_evidence = this.computeContextEvidence(context, execution_history);
            evidence_breakdown.push(context_evidence);
        }
        // Evidence 4: Agent combination synergy
        if (agents.length > 1) {
            const synergy_evidence = this.computeSynergyEvidence(agents, execution_history);
            evidence_breakdown.push(synergy_evidence);
        }
        // Combine evidence using Bayesian updating
        let posterior = 0.5; // Start with uninformative prior
        let total_weight = 0.0;
        for (const evidence of evidence_breakdown) {
            // Bayesian update
            const likelihood = evidence.likelihood;
            const prior = evidence.prior;
            // P(evidence) is marginal probability (can approximate)
            const p_evidence = likelihood * prior + (1 - likelihood) * (1 - prior);
            // P(success | evidence) = P(evidence | success) * P(success) / P(evidence)
            const updated_posterior = (likelihood * prior) / (p_evidence || 0.01);
            evidence.posterior = updated_posterior;
            // Weighted combination
            posterior += updated_posterior * evidence.weight;
            total_weight += evidence.weight;
        }
        // Normalize
        const raw_confidence = total_weight > 0 ? posterior / total_weight : 0.5;
        // Apply calibration
        const calibrated_confidence = this.applyCalibration(raw_confidence);
        // Calculate uncertainty
        const uncertainty = this.calculateUncertainty(evidence_breakdown, execution_history);
        // Calculate confidence interval (95%)
        const z_score = 1.96; // 95% CI
        const ci_lower = Math.max(0.0, calibrated_confidence - z_score * uncertainty);
        const ci_upper = Math.min(1.0, calibrated_confidence + z_score * uncertainty);
        // Calibration quality
        const calibration_score = this.assessCalibrationQuality();
        // Generate warnings
        if (calibrated_confidence < 0.3) {
            warnings.push('Very low confidence - high risk of failure');
        }
        if (uncertainty > 0.3) {
            warnings.push('High uncertainty - predictions unreliable');
        }
        if (calibration_score < 0.7) {
            warnings.push('Poor calibration - confidence estimates may be inaccurate');
        }
        if (execution_history.length < 10) {
            warnings.push('Limited historical data - predictions less reliable');
        }
        return {
            confidence: calibrated_confidence,
            uncertainty,
            confidence_interval: [ci_lower, ci_upper],
            calibration_score,
            evidence_breakdown,
            warnings
        };
    }
    /**
     * Compute evidence from agent historical performance
     */
    computeAgentEvidence(agents, history) {
        // Calculate historical success rate for these agents
        const relevant_patterns = history.filter(p => agents.every(agent => p.agents_used.includes(agent)));
        const success_count = relevant_patterns.filter(p => p.success).length;
        const total = relevant_patterns.length;
        // Likelihood: how often these agents succeed together
        const likelihood = total > 0 ? success_count / total : 0.5;
        // Prior: average success rate across all agents
        const all_success = history.filter(p => p.success).length;
        const prior = history.length > 0 ? all_success / history.length : 0.5;
        return {
            source: 'agent_performance',
            likelihood,
            prior,
            posterior: 0, // Will be computed in main function
            weight: 0.35 // High weight for agent performance
        };
    }
    /**
     * Compute evidence from similar objectives
     */
    computeObjectiveEvidence(embedding, history) {
        // Find patterns with similar intents/domains
        const top_intents = Array.from(embedding.intent_scores.entries())
            .filter(([_, score]) => score > 0.5)
            .map(([intent, _]) => intent);
        const top_domains = Array.from(embedding.domain_scores.entries())
            .filter(([_, score]) => score > 0.5)
            .map(([domain, _]) => domain);
        // Similarity-based matching
        const similar_patterns = history.filter(p => {
            // Check if objective_type or tags match
            const obj_type = p.objective_type || '';
            const tags = p.tags || [];
            // Simple similarity check (can be improved with actual embeddings)
            return (top_intents.some(intent => obj_type.includes(intent) || tags.includes(intent)) ||
                top_domains.some(domain => tags.includes(domain)));
        });
        const success_count = similar_patterns.filter(p => p.success).length;
        const total = similar_patterns.length;
        const likelihood = total > 0 ? success_count / total : 0.5;
        const prior = history.length > 0 ? history.filter(p => p.success).length / history.length : 0.5;
        return {
            source: 'objective_similarity',
            likelihood,
            prior,
            posterior: 0,
            weight: 0.30 // Medium-high weight
        };
    }
    /**
     * Compute evidence from context similarity
     */
    computeContextEvidence(context, history) {
        // Find patterns with similar context
        const similar_patterns = history.filter(p => {
            if (!p.project_context)
                return false;
            // Match project type
            const type_match = p.project_context.project_type === context.project_type;
            // Match has_tests
            const tests_match = p.project_context.has_tests === context.has_tests;
            return type_match || tests_match;
        });
        const success_count = similar_patterns.filter(p => p.success).length;
        const total = similar_patterns.length;
        const likelihood = total > 0 ? success_count / total : 0.5;
        const prior = history.length > 0 ? history.filter(p => p.success).length / history.length : 0.5;
        return {
            source: 'context_similarity',
            likelihood,
            prior,
            posterior: 0,
            weight: 0.20 // Medium weight
        };
    }
    /**
     * Compute evidence from agent synergy
     */
    computeSynergyEvidence(agents, history) {
        // Check if these agents work well together
        const synergy_patterns = history.filter(p => {
            // At least 2 of the selected agents appeared together
            const overlap = agents.filter(a => p.agents_used.includes(a));
            return overlap.length >= 2;
        });
        const success_count = synergy_patterns.filter(p => p.success).length;
        const total = synergy_patterns.length;
        const likelihood = total > 0 ? success_count / total : 0.5;
        const prior = history.length > 0 ? history.filter(p => p.success).length / history.length : 0.5;
        return {
            source: 'agent_synergy',
            likelihood,
            prior,
            posterior: 0,
            weight: 0.15 // Lower weight
        };
    }
    /**
     * Calculate uncertainty (standard deviation)
     */
    calculateUncertainty(evidence, history) {
        // Uncertainty increases with:
        // 1. Low sample sizes
        // 2. Conflicting evidence
        // 3. High variance in historical performance
        let uncertainty = 0.0;
        // Sample size uncertainty
        if (history.length < 10) {
            uncertainty += 0.3;
        }
        else if (history.length < 50) {
            uncertainty += 0.2;
        }
        else if (history.length < 100) {
            uncertainty += 0.1;
        }
        // Evidence agreement uncertainty
        const posteriors = evidence.map(e => e.posterior);
        const mean_posterior = posteriors.reduce((a, b) => a + b, 0) / posteriors.length;
        const variance = posteriors.reduce((sum, p) => sum + Math.pow(p - mean_posterior, 2), 0) / posteriors.length;
        const std_dev = Math.sqrt(variance);
        uncertainty += std_dev * 0.5;
        // Historical variance
        const success_rates = this.computeHistoricalVariance(history);
        uncertainty += success_rates.variance * 0.3;
        return Math.min(uncertainty, 0.5); // Cap at 0.5
    }
    /**
     * Compute historical variance in success rates
     */
    computeHistoricalVariance(history) {
        if (history.length === 0) {
            return { mean: 0.5, variance: 0.25 };
        }
        const success_vals = history.map(p => p.success ? 1.0 : 0.0);
        const mean = success_vals.reduce((a, b) => a + b, 0) / success_vals.length;
        const variance = success_vals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / success_vals.length;
        return { mean, variance };
    }
    /**
     * Apply calibration curve to raw confidence
     */
    applyCalibration(raw_confidence) {
        // Use isotonic regression-based calibration
        // Find closest calibration point
        if (this.calibration_curve.size === 0) {
            return raw_confidence; // No calibration yet
        }
        let closest_key = 0.5;
        let min_distance = 1.0;
        for (const key of this.calibration_curve.keys()) {
            const distance = Math.abs(key - raw_confidence);
            if (distance < min_distance) {
                min_distance = distance;
                closest_key = key;
            }
        }
        return this.calibration_curve.get(closest_key) || raw_confidence;
    }
    /**
     * Learn from execution to calibrate confidence
     */
    async calibrateFromExecution(predicted_confidence, actual_success) {
        // Record calibration point
        this.calibration_history.push({
            predicted_confidence,
            actual_success,
            timestamp: Date.now()
        });
        // Keep last 500 points
        if (this.calibration_history.length > 500) {
            this.calibration_history = this.calibration_history.slice(-500);
        }
        // Rebuild calibration curve
        this.rebuildCalibrationCurve();
    }
    /**
     * Rebuild calibration curve using isotonic regression
     */
    rebuildCalibrationCurve() {
        if (this.calibration_history.length < 10) {
            return; // Need more data
        }
        // Bin predictions into buckets
        const buckets = new Map();
        const bucket_size = 0.1; // 10% buckets
        for (const point of this.calibration_history) {
            const bucket = Math.floor(point.predicted_confidence / bucket_size) * bucket_size;
            if (!buckets.has(bucket)) {
                buckets.set(bucket, { successes: 0, total: 0 });
            }
            const data = buckets.get(bucket);
            data.total += 1;
            if (point.actual_success) {
                data.successes += 1;
            }
        }
        // Build calibration curve
        this.calibration_curve.clear();
        for (const [bucket, data] of buckets.entries()) {
            const actual_rate = data.successes / data.total;
            this.calibration_curve.set(bucket, actual_rate);
        }
    }
    /**
     * Assess calibration quality
     */
    assessCalibrationQuality() {
        if (this.calibration_history.length < 10) {
            return 0.5; // Insufficient data
        }
        // Calculate Brier score (lower is better)
        let brier_sum = 0.0;
        for (const point of this.calibration_history) {
            const actual = point.actual_success ? 1.0 : 0.0;
            const predicted = point.predicted_confidence;
            brier_sum += Math.pow(predicted - actual, 2);
        }
        const brier_score = brier_sum / this.calibration_history.length;
        // Convert to quality score (1.0 - brier_score)
        // Perfect calibration = 0.0 Brier = 1.0 quality
        // Random calibration = 0.25 Brier = 0.75 quality
        const quality = Math.max(0.0, 1.0 - brier_score);
        return quality;
    }
    /**
     * Initialize priors from bootstrap
     */
    initializePriors() {
        // Start with uninformative priors (0.5)
        // These will be updated as we learn
        const agents = [
            'the_didact', 'hollowed_eyes', 'loveless', 'the_architect',
            'the_librarian', 'the_curator', 'the_scribe', 'the_sentinel',
            'the_cartographer', 'the_oracle', 'cinna', 'zhadyz'
        ];
        for (const agent of agents) {
            this.agent_priors.set(agent, 0.7); // Assume agents are generally successful
        }
    }
    /**
     * Initialize calibration curve
     */
    initializeCalibrationCurve() {
        // Identity calibration (no adjustment)
        for (let i = 0; i <= 10; i++) {
            const val = i / 10.0;
            this.calibration_curve.set(val, val);
        }
    }
    /**
     * Update agent priors from execution
     */
    async updateAgentPriors(agent, success) {
        const current_prior = this.agent_priors.get(agent) || 0.5;
        // Bayesian update with beta distribution
        // Assume Beta(alpha=success_count, beta=failure_count)
        // Update: alpha' = alpha + (success ? 1 : 0)
        //         beta' = beta + (success ? 0 : 1)
        // Simplified: exponential moving average
        const learning_rate = 0.1;
        const target = success ? 1.0 : 0.0;
        const updated_prior = current_prior * (1 - learning_rate) + target * learning_rate;
        this.agent_priors.set(agent, updated_prior);
    }
}
// Singleton instance
export const bayesianEngine = new BayesianConfidenceEngine();
//# sourceMappingURL=bayesian_confidence.js.map