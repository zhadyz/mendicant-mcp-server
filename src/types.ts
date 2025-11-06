// Core types for mendicant orchestration

// AgentId is now dynamic - accepts any string for custom agents
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

// Dynamic agent learning types
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
