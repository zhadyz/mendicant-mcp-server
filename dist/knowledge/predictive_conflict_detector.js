/**
 * PREDICTIVE CONFLICT DETECTOR - ADAPTATION 3
 */
export class PredictiveConflictDetector {
    tool_matrix;
    conflict_patterns;
    DECAY_HALF_LIFE_DAYS = 30;
    RISK_THRESHOLD_LOW = 0.3;
    RISK_THRESHOLD_MEDIUM = 0.6;
    RISK_THRESHOLD_HIGH = 0.8;
    constructor() {
        this.tool_matrix = { agent_tools: new Map(), tool_conflicts: new Map(), learned_conflicts: [] };
        this.conflict_patterns = new Map();
        this.initializeKnownToolConflicts();
        this.initializeAgentToolMappings();
    }
    async analyzeConflicts(agents, objective, semanticEmbedding, context) {
        const predicted_conflicts = [];
        const warnings = [];
        const agents_to_remove = [];
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const agent_a = agents[i], agent_b = agents[j];
                const pattern = this.getConflictPattern(agent_a, agent_b);
                if (pattern) {
                    const decayed_probability = this.applyTemporalDecay(pattern);
                    if (decayed_probability > this.RISK_THRESHOLD_LOW) {
                        predicted_conflicts.push({ ...pattern, probability: decayed_probability });
                        if (decayed_probability > this.RISK_THRESHOLD_HIGH && !pattern.success_with_ordering) {
                            if (!agents_to_remove.includes(agent_b)) {
                                agents_to_remove.push(agent_b);
                            }
                        }
                    }
                }
                const overlap = this.calculateToolOverlap(agent_a, agent_b);
                if (overlap.score > 0.5)
                    warnings.push('Tool overlap detected');
            }
        }
        const risk_score = this.calculateRiskScore(predicted_conflicts);
        const conflict_free_probability = 1.0 - risk_score;
        let recommended_reordering;
        if (predicted_conflicts.length > 0)
            recommended_reordering = this.optimizeOrdering(agents, predicted_conflicts);
        return {
            predicted_conflicts,
            risk_score,
            conflict_free_probability,
            recommended_reordering,
            agents_to_remove: agents_to_remove.length > 0 ? agents_to_remove : undefined,
            warnings,
            safe_to_execute: risk_score < this.RISK_THRESHOLD_HIGH
        };
    }
    predictConflicts(agents, context) {
        const predicted_conflicts = [];
        const warnings = [];
        const agents_to_remove = [];
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const agent_a = agents[i], agent_b = agents[j];
                const pattern = this.getConflictPattern(agent_a, agent_b);
                if (pattern) {
                    const decayed_probability = this.applyTemporalDecay(pattern);
                    if (decayed_probability > this.RISK_THRESHOLD_LOW) {
                        predicted_conflicts.push({ ...pattern, probability: decayed_probability });
                        if (decayed_probability > this.RISK_THRESHOLD_HIGH && !pattern.success_with_ordering) {
                            if (!agents_to_remove.includes(agent_b)) {
                                agents_to_remove.push(agent_b);
                            }
                        }
                    }
                }
                const overlap = this.calculateToolOverlap(agent_a, agent_b);
                if (overlap.score > 0.5)
                    warnings.push('Tool overlap detected');
            }
        }
        const risk_score = this.calculateRiskScore(predicted_conflicts);
        const conflict_free_probability = 1.0 - risk_score;
        let recommended_reordering;
        if (predicted_conflicts.length > 0)
            recommended_reordering = this.optimizeOrdering(agents, predicted_conflicts);
        return {
            predicted_conflicts,
            risk_score,
            conflict_free_probability,
            recommended_reordering,
            agents_to_remove: agents_to_remove.length > 0 ? agents_to_remove : undefined,
            warnings,
            safe_to_execute: risk_score < this.RISK_THRESHOLD_HIGH
        };
    }
    async learnConflict(agent_a, agent_b, conflict_type, was_resolved) {
        const pattern_key = this.getPatternKey(agent_a, agent_b);
        const existing = this.conflict_patterns.get(pattern_key);
        if (existing) {
            const alpha = 0.3;
            existing.probability = existing.probability * (1 - alpha) + (was_resolved ? 0.0 : 1.0) * alpha;
            existing.observed_count += 1;
            existing.last_observed = Date.now();
            this.conflict_patterns.set(pattern_key, existing);
        }
        else {
            const new_pattern = { agent_a, agent_b, conflict_type, probability: was_resolved ? 0.3 : 0.8, observed_count: 1, last_observed: Date.now() };
            this.conflict_patterns.set(pattern_key, new_pattern);
        }
        this.tool_matrix.learned_conflicts = Array.from(this.conflict_patterns.values());
    }
    calculateToolOverlap(agent_a, agent_b) {
        const tools_a = this.tool_matrix.agent_tools.get(agent_a) || new Set();
        const tools_b = this.tool_matrix.agent_tools.get(agent_b) || new Set();
        const overlapping = new Set();
        for (const tool of tools_a)
            if (tools_b.has(tool))
                overlapping.add(tool);
        const conflicting_tools = Array.from(overlapping);
        const total_tools = tools_a.size + tools_b.size;
        return { score: total_tools > 0 ? (overlapping.size / total_tools) : 0, conflicting_tools };
    }
    optimizeOrdering(agents, conflicts) {
        const graph = new Map();
        const in_degree = new Map();
        for (const agent of agents) {
            graph.set(agent, new Set());
            in_degree.set(agent, 0);
        }
        for (const conflict of conflicts) {
            if (conflict.success_with_ordering) {
                const { a_before_b } = conflict.success_with_ordering;
                if (a_before_b) {
                    const edges = graph.get(conflict.agent_a);
                    if (!edges.has(conflict.agent_b)) {
                        edges.add(conflict.agent_b);
                        in_degree.set(conflict.agent_b, (in_degree.get(conflict.agent_b) || 0) + 1);
                    }
                }
                else {
                    const edges = graph.get(conflict.agent_b);
                    if (!edges.has(conflict.agent_a)) {
                        edges.add(conflict.agent_a);
                        in_degree.set(conflict.agent_a, (in_degree.get(conflict.agent_a) || 0) + 1);
                    }
                }
            }
        }
        const queue = [], result = [];
        for (const agent of agents)
            if (in_degree.get(agent) === 0)
                queue.push(agent);
        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);
            const neighbors = graph.get(current) || new Set();
            for (const neighbor of neighbors) {
                in_degree.set(neighbor, in_degree.get(neighbor) - 1);
                if (in_degree.get(neighbor) === 0)
                    queue.push(neighbor);
            }
        }
        return result.length === agents.length ? result : agents;
    }
    applyTemporalDecay(pattern) {
        const age_ms = Date.now() - pattern.last_observed;
        const age_days = age_ms / (1000 * 60 * 60 * 24);
        const lambda = Math.log(2) / this.DECAY_HALF_LIFE_DAYS;
        return pattern.probability * Math.exp(-lambda * age_days);
    }
    calculateRiskScore(conflicts) {
        if (conflicts.length === 0)
            return 0.0;
        let total_weight = 0, weighted_sum = 0;
        for (const conflict of conflicts) {
            const weight = conflict.conflict_type === 'resource' || conflict.conflict_type === 'ordering' ? 1.5 : 1.0;
            weighted_sum += conflict.probability * weight;
            total_weight += weight;
        }
        return Math.min(1.0, weighted_sum / total_weight);
    }
    getConflictPattern(agent_a, agent_b) {
        return this.conflict_patterns.get(this.getPatternKey(agent_a, agent_b)) || null;
    }
    getPatternKey(agent_a, agent_b) {
        const sorted = [agent_a, agent_b].sort();
        return sorted[0] + ':' + sorted[1];
    }
    initializeKnownToolConflicts() {
        this.tool_matrix.tool_conflicts.set('edit_file', new Set(['write_file', 'delete_file']));
        this.tool_matrix.tool_conflicts.set('write_file', new Set(['edit_file', 'delete_file']));
        this.tool_matrix.tool_conflicts.set('npm_install', new Set(['npm_uninstall']));
        this.tool_matrix.tool_conflicts.set('build', new Set(['run_tests']));
    }
    initializeAgentToolMappings() {
        this.tool_matrix.agent_tools.set('hollowed_eyes', new Set(['edit_file', 'write_file', 'read_file']));
        this.tool_matrix.agent_tools.set('the_curator', new Set(['npm_install', 'npm_uninstall', 'edit_file']));
        this.tool_matrix.agent_tools.set('loveless', new Set(['run_tests', 'read_file']));
        this.tool_matrix.agent_tools.set('the_architect', new Set(['write_file', 'create_directory']));
        this.tool_matrix.agent_tools.set('the_sentinel', new Set(['run_tests', 'build']));
        this.tool_matrix.agent_tools.set('the_didact', new Set(['web_search', 'write_file']));
    }
    exportPatterns() { return Array.from(this.conflict_patterns.values()); }
    importPatterns(patterns) {
        this.conflict_patterns.clear();
        for (const pattern of patterns)
            this.conflict_patterns.set(this.getPatternKey(pattern.agent_a, pattern.agent_b), pattern);
        this.tool_matrix.learned_conflicts = patterns;
    }
}
export const conflictDetector = new PredictiveConflictDetector();
//# sourceMappingURL=predictive_conflict_detector.js.map