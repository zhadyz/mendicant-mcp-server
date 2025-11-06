/**
 * CONSTRAINT ENFORCER
 *
 * Rigorously enforces constraints: max_agents, max_tokens, etc.
 * Prevents plan generation from violating user-specified limits.
 */

import type { AgentSpec, Constraints } from '../types.js';

export interface ConstraintViolation {
  type: 'max_agents' | 'max_tokens' | 'budget_exceeded';
  limit: number;
  actual: number;
  severity: 'blocking' | 'warning';
  message: string;
}

export interface ConstraintEnforcementResult {
  compliant: boolean;
  violations: ConstraintViolation[];
  adjusted_agents?: AgentSpec[];
  adjusted_estimated_tokens?: number;
}

/**
 * Enforces constraints on a plan
 */
export function enforceConstraints(
  agents: AgentSpec[],
  estimatedTokens: number,
  constraints?: Constraints
): ConstraintEnforcementResult {
  if (!constraints) {
    return { compliant: true, violations: [] };
  }

  const violations: ConstraintViolation[] = [];
  let adjustedAgents = [...agents];
  let adjustedTokens = estimatedTokens;

  // ENFORCE MAX_AGENTS
  if (constraints.max_agents && agents.length > constraints.max_agents) {
    violations.push({
      type: 'max_agents',
      limit: constraints.max_agents,
      actual: agents.length,
      severity: 'blocking',
      message: `Plan requires ${agents.length} agents but limit is ${constraints.max_agents}`
    });

    // AUTO-FIX: Trim to max_agents, keeping highest priority
    adjustedAgents = priorityTrim(agents, constraints.max_agents);
  }

  // ENFORCE MAX_TOKENS
  if (constraints.max_tokens && estimatedTokens > constraints.max_tokens) {
    violations.push({
      type: 'max_tokens',
      limit: constraints.max_tokens,
      actual: estimatedTokens,
      severity: 'blocking',
      message: `Plan estimated at ${estimatedTokens} tokens but limit is ${constraints.max_tokens}`
    });

    // AUTO-FIX: Iteratively remove lowest priority agents until under budget
    const result = budgetTrim(agents, constraints.max_tokens, estimatedTokens);
    adjustedAgents = result.agents;
    adjustedTokens = result.estimatedTokens;
  }

  // If violations exist, plan is not compliant
  const compliant = violations.length === 0;

  return {
    compliant,
    violations,
    adjusted_agents: compliant ? undefined : adjustedAgents,
    adjusted_estimated_tokens: compliant ? undefined : adjustedTokens
  };
}

/**
 * Trim agents to max count, prioritizing critical/high priority agents
 */
function priorityTrim(agents: AgentSpec[], maxAgents: number): AgentSpec[] {
  // Sort by priority (critical > high > medium > low)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...agents].sort((a, b) => {
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    return aPriority - bPriority;
  });

  // Keep top N agents
  const trimmed = sorted.slice(0, maxAgents);

  // CRITICAL: Always keep loveless if it was in the original plan (mandatory for verification)
  const hasLoveless = agents.some(a => a.agent_id === 'loveless');
  const trimmedHasLoveless = trimmed.some(a => a.agent_id === 'loveless');

  if (hasLoveless && !trimmedHasLoveless) {
    // Remove lowest priority non-loveless agent and add loveless
    const lovelessAgent = agents.find(a => a.agent_id === 'loveless')!;
    trimmed.pop();
    trimmed.push(lovelessAgent);
  }

  return trimmed;
}

/**
 * Trim agents to fit token budget
 */
function budgetTrim(
  agents: AgentSpec[],
  maxTokens: number,
  currentEstimate: number
): { agents: AgentSpec[]; estimatedTokens: number } {
  // Sort by priority (keep critical, trim low priority first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...agents].sort((a, b) => {
    return priorityOrder[b.priority] - priorityOrder[a.priority]; // Reverse sort (lowest priority first)
  });

  // Estimate tokens per agent (rough estimate - would need registry for accurate values)
  const avgTokens = currentEstimate / agents.length;

  let currentAgents = [...agents];
  let currentBudget = currentEstimate;

  // Remove lowest priority agents until under budget
  for (const agent of sorted) {
    if (currentBudget <= maxTokens) {
      break;
    }

    // Don't remove critical agents
    if (agent.priority === 'critical') {
      continue;
    }

    // Remove this agent
    currentAgents = currentAgents.filter(a => a.agent_id !== agent.agent_id);
    currentBudget -= avgTokens;
  }

  return {
    agents: currentAgents,
    estimatedTokens: currentBudget
  };
}

/**
 * Check if plan is safe to execute given constraints
 */
export function validatePlan(
  agents: AgentSpec[],
  estimatedTokens: number,
  constraints?: Constraints
): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!constraints) {
    return { safe: true, warnings: [] };
  }

  // Check for warnings (not blocking, but user should be aware)
  if (constraints.max_tokens && estimatedTokens > constraints.max_tokens * 0.8) {
    warnings.push(`Plan uses ${estimatedTokens} tokens, approaching limit of ${constraints.max_tokens}`);
  }

  if (constraints.max_agents && agents.length > constraints.max_agents * 0.8) {
    warnings.push(`Plan uses ${agents.length} agents, approaching limit of ${constraints.max_agents}`);
  }

  // Check for critical issues
  const enforcement = enforceConstraints(agents, estimatedTokens, constraints);

  return {
    safe: enforcement.compliant,
    warnings: [
      ...warnings,
      ...enforcement.violations.map(v => v.message)
    ]
  };
}
