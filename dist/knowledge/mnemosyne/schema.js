/**
 * Mnemosyne Knowledge Graph Schema
 *
 * Entity types and relations for persisting agent intelligence in Mnemosyne MCP.
 * Based on ADR-001: Mnemosyne Knowledge Graph Schema
 */
import { createHash } from 'crypto';
// Entity Type Constants
export const ENTITY_TYPES = {
    AGENT_PROFILE: 'AgentProfile',
    AGENT_EXECUTION: 'AgentExecution',
    OBJECTIVE_PATTERN: 'ObjectivePattern',
    CONTEXT_SIGNATURE: 'ContextSignature'
};
// Relation Type Constants
// NOTE: Intentional deviation from ADR-001 relation types:
// - ADR-001 specified: for_objective, in_context, specializes_in, performs_well_in
// - Implemented: executed, has_pattern, matches_context, similar_to, preceded_by
// Rationale: The implemented types better capture the actual data relationships:
//   - 'executed' links agents to their execution records (more precise than 'for_objective')
//   - 'matches_context' links executions to context signatures (clearer than 'in_context')
//   - 'has_pattern' and 'similar_to' enable pattern-based learning
//   - 'preceded_by' enables execution ordering for workflow analysis
// These types emerged during implementation as more semantically accurate for knowledge graph queries.
export const RELATION_TYPES = {
    EXECUTED: 'executed',
    HAS_PATTERN: 'has_pattern',
    MATCHES_CONTEXT: 'matches_context',
    SIMILAR_TO: 'similar_to',
    PRECEDED_BY: 'preceded_by'
};
/**
 * Convert AgentProfile to Mnemosyne entity format
 */
export function agentProfileToEntity(profile) {
    return {
        name: profile.name,
        entityType: ENTITY_TYPES.AGENT_PROFILE,
        observations: [
            `Specialization: ${profile.specialization}`,
            `Capabilities: ${profile.capabilities.join(', ')}`,
            `Tools: ${profile.tools.join(', ')}`,
            `Use Cases: ${profile.typical_use_cases.join(', ')}`
        ]
    };
}
/**
 * Convert AgentExecution to Mnemosyne entity format
 */
export function agentExecutionToEntity(execution) {
    const observations = [
        `Agent: ${execution.agent_id}`,
        `Objective: ${execution.objective}`,
        `Success: ${execution.success}`,
        `Timestamp: ${new Date(execution.timestamp).toISOString()}`
    ];
    if (execution.tokens_used !== undefined) {
        observations.push(`Tokens: ${execution.tokens_used}`);
    }
    if (execution.duration_ms !== undefined) {
        observations.push(`Duration: ${execution.duration_ms}ms`);
    }
    if (execution.error_message) {
        observations.push(`Error: ${execution.error_message}`);
    }
    if (execution.context_signature) {
        observations.push(`Context: ${execution.context_signature}`);
    }
    return {
        name: execution.name,
        entityType: ENTITY_TYPES.AGENT_EXECUTION,
        observations
    };
}
/**
 * Convert ObjectivePattern to Mnemosyne entity format
 */
export function objectivePatternToEntity(pattern) {
    return {
        name: pattern.name,
        entityType: ENTITY_TYPES.OBJECTIVE_PATTERN,
        observations: [
            `Objective: ${pattern.objective_text}`,
            `Type: ${pattern.objective_type}`,
            `Success Count: ${pattern.success_count}`,
            `Failure Count: ${pattern.failure_count}`,
            `Avg Tokens: ${pattern.avg_tokens}`,
            `Avg Duration: ${pattern.avg_duration_ms}ms`,
            `Successful Agents: ${pattern.successful_agents.join(', ')}`,
            `Failed Agents: ${pattern.failed_agents.join(', ')}`
        ]
    };
}
/**
 * Convert ContextSignature to Mnemosyne entity format
 */
export function contextSignatureToEntity(signature) {
    const observations = [
        `Has Tests: ${signature.has_tests}`
    ];
    if (signature.project_type) {
        observations.push(`Project Type: ${signature.project_type}`);
    }
    if (signature.other_factors.length > 0) {
        observations.push(`Factors: ${signature.other_factors.join(', ')}`);
    }
    return {
        name: signature.name,
        entityType: ENTITY_TYPES.CONTEXT_SIGNATURE,
        observations
    };
}
/**
 * Generate context signature hash from project context
 *
 * Creates a deterministic hash from objective + project_type + has_tests.
 * This allows us to group executions by similar contexts.
 */
export function generateContextHash(objective, context) {
    const factors = [
        `obj:${objective.toLowerCase().trim()}`
    ];
    if (context?.project_type) {
        factors.push(`type:${context.project_type}`);
    }
    if (context?.has_tests !== undefined) {
        factors.push(`tests:${context.has_tests}`);
    }
    const input = factors.join('|');
    const hash = createHash('sha256').update(input).digest('hex');
    // Return first 16 characters for readability
    return `ctx_${hash.substring(0, 16)}`;
}
/**
 * Create ContextSignature entity from project context
 */
export function createContextSignature(objective, context) {
    const hash = generateContextHash(objective, context);
    const other_factors = [];
    // Add any other relevant context factors
    if (context?.recent_errors && context.recent_errors.length > 0) {
        other_factors.push('has_recent_errors');
    }
    if (context?.linear_issues && context.linear_issues.length > 0) {
        other_factors.push('has_linear_issues');
    }
    return {
        entity_type: ENTITY_TYPES.CONTEXT_SIGNATURE,
        name: hash,
        project_type: context?.project_type,
        has_tests: context?.has_tests ?? false,
        other_factors
    };
}
/**
 * Create relation between agent and execution
 */
export function createExecutedRelation(agent_id, execution_name) {
    return {
        from: agent_id,
        to: execution_name,
        relationType: RELATION_TYPES.EXECUTED
    };
}
/**
 * Create relation between execution and context
 */
export function createMatchesContextRelation(execution_name, context_hash) {
    return {
        from: execution_name,
        to: context_hash,
        relationType: RELATION_TYPES.MATCHES_CONTEXT
    };
}
/**
 * Create relation between objective patterns
 */
export function createSimilarToRelation(pattern_a, pattern_b) {
    return {
        from: pattern_a,
        to: pattern_b,
        relationType: RELATION_TYPES.SIMILAR_TO
    };
}
/**
 * Create relation for execution ordering
 */
export function createPrecededByRelation(execution_a, execution_b) {
    return {
        from: execution_a,
        to: execution_b,
        relationType: RELATION_TYPES.PRECEDED_BY
    };
}
//# sourceMappingURL=schema.js.map