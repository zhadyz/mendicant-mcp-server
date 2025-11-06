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
export declare function enforceConstraints(agents: AgentSpec[], estimatedTokens: number, constraints?: Constraints): ConstraintEnforcementResult;
/**
 * Check if plan is safe to execute given constraints
 */
export declare function validatePlan(agents: AgentSpec[], estimatedTokens: number, constraints?: Constraints): {
    safe: boolean;
    warnings: string[];
};
//# sourceMappingURL=constraint_enforcer.d.ts.map