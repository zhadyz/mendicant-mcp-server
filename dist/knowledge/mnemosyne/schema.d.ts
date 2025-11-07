/**
 * Mnemosyne Knowledge Graph Schema
 *
 * Entity types and relations for persisting agent intelligence in Mnemosyne MCP.
 * Based on ADR-001: Mnemosyne Knowledge Graph Schema
 */
import type { AgentId, ProjectContext } from '../../types.js';
export declare const ENTITY_TYPES: {
    readonly AGENT_PROFILE: "AgentProfile";
    readonly AGENT_EXECUTION: "AgentExecution";
    readonly OBJECTIVE_PATTERN: "ObjectivePattern";
    readonly CONTEXT_SIGNATURE: "ContextSignature";
};
export declare const RELATION_TYPES: {
    readonly EXECUTED: "executed";
    readonly HAS_PATTERN: "has_pattern";
    readonly MATCHES_CONTEXT: "matches_context";
    readonly SIMILAR_TO: "similar_to";
    readonly PRECEDED_BY: "preceded_by";
};
/**
 * AgentProfile - Represents an agent's identity and capabilities
 */
export interface AgentProfile {
    entity_type: typeof ENTITY_TYPES.AGENT_PROFILE;
    name: string;
    specialization: string;
    capabilities: string[];
    tools: string[];
    typical_use_cases: string[];
}
/**
 * AgentExecution - Represents a single agent execution event
 */
export interface AgentExecution {
    entity_type: typeof ENTITY_TYPES.AGENT_EXECUTION;
    name: string;
    agent_id: AgentId;
    objective: string;
    success: boolean;
    tokens_used?: number;
    duration_ms?: number;
    error_message?: string;
    timestamp: number;
    context_signature?: string;
}
/**
 * ObjectivePattern - Represents a recurring objective pattern
 */
export interface ObjectivePattern {
    entity_type: typeof ENTITY_TYPES.OBJECTIVE_PATTERN;
    name: string;
    objective_text: string;
    objective_type: string;
    success_count: number;
    failure_count: number;
    avg_tokens: number;
    avg_duration_ms: number;
    successful_agents: AgentId[];
    failed_agents: AgentId[];
}
/**
 * ContextSignature - Represents unique project context fingerprints
 */
export interface ContextSignature {
    entity_type: typeof ENTITY_TYPES.CONTEXT_SIGNATURE;
    name: string;
    project_type?: string;
    has_tests: boolean;
    other_factors: string[];
}
/**
 * Mnemosyne Entity - Generic type for all entities
 */
export interface MnemosyneEntity {
    name: string;
    entityType: string;
    observations: string[];
}
/**
 * Mnemosyne Relation - Generic type for all relations
 */
export interface MnemosyneRelation {
    from: string;
    to: string;
    relationType: string;
}
/**
 * Convert AgentProfile to Mnemosyne entity format
 */
export declare function agentProfileToEntity(profile: AgentProfile): MnemosyneEntity;
/**
 * Convert AgentExecution to Mnemosyne entity format
 */
export declare function agentExecutionToEntity(execution: AgentExecution): MnemosyneEntity;
/**
 * Convert ObjectivePattern to Mnemosyne entity format
 */
export declare function objectivePatternToEntity(pattern: ObjectivePattern): MnemosyneEntity;
/**
 * Convert ContextSignature to Mnemosyne entity format
 */
export declare function contextSignatureToEntity(signature: ContextSignature): MnemosyneEntity;
/**
 * Generate context signature hash from project context
 *
 * Creates a deterministic hash from objective + project_type + has_tests.
 * This allows us to group executions by similar contexts.
 */
export declare function generateContextHash(objective: string, context?: ProjectContext): string;
/**
 * Create ContextSignature entity from project context
 */
export declare function createContextSignature(objective: string, context?: ProjectContext): ContextSignature;
/**
 * Create relation between agent and execution
 */
export declare function createExecutedRelation(agent_id: AgentId, execution_name: string): MnemosyneRelation;
/**
 * Create relation between execution and context
 */
export declare function createMatchesContextRelation(execution_name: string, context_hash: string): MnemosyneRelation;
/**
 * Create relation between objective patterns
 */
export declare function createSimilarToRelation(pattern_a: string, pattern_b: string): MnemosyneRelation;
/**
 * Create relation for execution ordering
 */
export declare function createPrecededByRelation(execution_a: string, execution_b: string): MnemosyneRelation;
//# sourceMappingURL=schema.d.ts.map