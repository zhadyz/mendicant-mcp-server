export type AgentId = string;
export type ExecutionStrategy = "sequential" | "parallel" | "phased";
export type Priority = "critical" | "high" | "medium" | "low";
export interface AgentSpec {
    agent_id: AgentId;
    task_description: string;
    prompt: string;
    dependencies: string[];
    priority: Priority;
}
export interface Phase {
    phase_name: string;
    agents: AgentId[];
    can_run_parallel: boolean;
}
export interface OrchestrationPlan {
    agents: AgentSpec[];
    execution_strategy: ExecutionStrategy;
    phases?: Phase[];
    success_criteria: string;
    estimated_tokens: number;
    reasoning?: string;
}
export interface ProjectContext {
    project_type?: string;
    has_tests?: boolean;
    linear_issues?: any[];
    recent_errors?: any[];
    git_status?: string;
    test_results?: any;
    build_status?: string;
    recent_commits?: any[];
}
export interface Constraints {
    max_agents?: number;
    prefer_parallel?: boolean;
    max_tokens?: number;
}
export interface AgentResult {
    agent_id: AgentId;
    output: string;
    success: boolean;
    duration_ms?: number;
    tokens_used?: number;
}
export interface CoordinationResult {
    synthesis: string;
    conflicts: Conflict[];
    gaps: Gap[];
    recommendations: string[];
    verification_needed: boolean;
}
export interface Conflict {
    agents: AgentId[];
    description: string;
    resolution: string;
}
export interface Gap {
    description: string;
    suggested_action: string;
}
export interface AnalysisResult {
    health_score: number;
    critical_issues: Issue[];
    recommendations: Recommendation[];
    suggested_agents: AgentId[];
}
export interface Issue {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    suggested_fix: string;
}
export interface Recommendation {
    action: string;
    priority: Priority;
    agents: AgentId[];
    reasoning: string;
}
export interface AgentCapability {
    name: AgentId;
    specialization: string;
    capabilities: string[];
    tools: string[];
    typical_use_cases: string[];
    avg_token_usage: number;
    success_rate: number;
    mandatory_for?: string[];
}
export interface Pattern {
    name: string;
    description: string;
    generatePlan: (context?: ProjectContext) => OrchestrationPlan;
}
export interface ExecutionRecord {
    objective: string;
    agents: AgentId[];
    success: boolean;
    duration_ms: number;
    pattern_used?: string;
    verification_passed?: boolean;
}
export interface LearnedAgent {
    agent_id: AgentId;
    discovered_at: number;
    last_used: number;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    avg_token_usage: number;
    specialization?: string;
    capabilities?: string[];
    tools?: string[];
    typical_use_cases?: string[];
}
export interface AgentFeedback {
    agent_id: AgentId;
    success: boolean;
    tokens_used?: number;
    duration_ms?: number;
    error?: string;
}
export interface AgentDiscoveryContext {
    available_agents?: AgentId[];
    feedback?: AgentFeedback[];
}
/**
 * Complete execution context - stores EVERYTHING about what happened
 * This is Mahoraga's "memory" of phenomena
 */
export interface ExecutionPattern {
    id: string;
    timestamp: number;
    objective: string;
    objective_type: string;
    project_context?: ProjectContext;
    agents_used: AgentId[];
    execution_order: AgentId[];
    agent_results: AgentResult[];
    success: boolean;
    total_duration_ms: number;
    total_tokens: number;
    conflicts: Conflict[];
    gaps: Gap[];
    verification_passed?: boolean;
    failure_reason?: string;
    tags: string[];
}
/**
 * Rich failure context - WHY did it fail?
 * Mahoraga analyzes the attack's nature, not just that it got hit
 */
export interface FailureContext {
    pattern_id: string;
    objective: string;
    failed_agent: AgentId;
    error_message?: string;
    error_type?: string;
    preceding_agents: AgentId[];
    project_context?: ProjectContext;
    attempted_dependencies: string[];
    suggested_fix?: string;
    learned_avoidance?: string;
}
/**
 * Pattern matching score - how similar is current objective to past execution?
 */
export interface PatternMatch {
    pattern: ExecutionPattern;
    similarity_score: number;
    matching_factors: string[];
    success_rate: number;
    avg_duration_ms: number;
    recommended_agents: AgentId[];
}
/**
 * Predictive agent scoring - will this agent succeed?
 * Based on learned patterns, not just global success rate
 */
export interface PredictiveScore {
    agent_id: AgentId;
    predicted_success_rate: number;
    confidence: number;
    reasoning: string[];
    historical_performance: {
        similar_objectives: number;
        success_in_similar: number;
        avg_tokens_in_similar: number;
    };
}
/**
 * Adaptive refinement - how to improve a failed plan
 * Mahoraga's adaptation in action
 */
export interface AdaptiveRefinement {
    original_plan: OrchestrationPlan;
    failure_analysis: FailureContext;
    suggested_changes: {
        agents_to_add: AgentId[];
        agents_to_remove: AgentId[];
        agents_to_reorder: {
            from: number;
            to: number;
        }[];
        dependency_changes: {
            agent: AgentId;
            add_deps: AgentId[];
            remove_deps: AgentId[];
        }[];
    };
    refined_plan: OrchestrationPlan;
    confidence: number;
    reasoning: string;
}
//# sourceMappingURL=types.d.ts.map