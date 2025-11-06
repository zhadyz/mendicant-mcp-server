/**
 * PREDICTIVE CONFLICT DETECTOR - ADAPTATION 3
 */
import type { AgentId, ProjectContext } from '../types.js';
export interface ToolOverlapMatrix {
    agent_tools: Map<AgentId, Set<string>>;
    tool_conflicts: Map<string, Set<string>>;
    learned_conflicts: ConflictPattern[];
}
export interface ConflictPattern {
    agent_a: AgentId;
    agent_b: AgentId;
    conflict_type: 'resource' | 'semantic' | 'ordering' | 'tool_overlap';
    probability: number;
    observed_count: number;
    success_with_ordering?: {
        a_before_b: boolean;
        success_rate: number;
    };
    context_factors?: string[];
    last_observed: number;
}
export interface ConflictPrediction {
    predicted_conflicts: ConflictPattern[];
    risk_score: number;
    conflict_free_probability: number;
    recommended_reordering?: AgentId[];
    agents_to_remove?: AgentId[];
    warnings: string[];
    safe_to_execute: boolean;
}
export declare class PredictiveConflictDetector {
    private tool_matrix;
    private conflict_patterns;
    private readonly DECAY_HALF_LIFE_DAYS;
    private readonly RISK_THRESHOLD_LOW;
    private readonly RISK_THRESHOLD_MEDIUM;
    private readonly RISK_THRESHOLD_HIGH;
    constructor();
    analyzeConflicts(agents: AgentId[], objective: string, semanticEmbedding: any, context?: ProjectContext): Promise<ConflictPrediction>;
    predictConflicts(agents: AgentId[], context?: ProjectContext): ConflictPrediction;
    learnConflict(agent_a: AgentId, agent_b: AgentId, conflict_type: 'resource' | 'semantic' | 'ordering' | 'tool_overlap', was_resolved: boolean): Promise<void>;
    private calculateToolOverlap;
    private optimizeOrdering;
    private applyTemporalDecay;
    private calculateRiskScore;
    private getConflictPattern;
    private getPatternKey;
    private initializeKnownToolConflicts;
    private initializeAgentToolMappings;
    exportPatterns(): ConflictPattern[];
    importPatterns(patterns: ConflictPattern[]): void;
}
export declare const conflictDetector: PredictiveConflictDetector;
//# sourceMappingURL=predictive_conflict_detector.d.ts.map