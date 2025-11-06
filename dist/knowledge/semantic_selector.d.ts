/**
 * SEMANTIC AGENT SELECTOR
 *
 * Intelligent agent selection based on intent, domain, and task type.
 * Replaces primitive keyword matching with contextual understanding.
 */
import type { AgentId } from '../types.js';
export interface ObjectiveAnalysis {
    intent: Intent;
    domain: Domain;
    task_type: TaskType;
    complexity: 'simple' | 'moderate' | 'complex';
    recommended_agents: AgentId[];
    confidence: number;
    reasoning: string;
}
export type Intent = 'create_new' | 'modify_existing' | 'investigate' | 'validate' | 'document' | 'deploy' | 'fix_issue' | 'optimize' | 'design';
export type Domain = 'code' | 'infrastructure' | 'security' | 'data' | 'ui_ux' | 'documentation' | 'testing' | 'creative' | 'research' | 'architecture';
export type TaskType = 'technical' | 'analytical' | 'creative' | 'operational' | 'communicative';
/**
 * Analyzes an objective to determine intent, domain, and task type
 */
export declare function analyzeObjectiveSemantic(objective: string): ObjectiveAnalysis;
/**
 * Get capabilities for backward compatibility with existing code
 */
export declare function getCapabilitiesFromAnalysis(analysis: ObjectiveAnalysis): string[];
//# sourceMappingURL=semantic_selector.d.ts.map