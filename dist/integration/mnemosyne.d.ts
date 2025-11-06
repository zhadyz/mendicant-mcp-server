import type { ExecutionRecord, OrchestrationPlan, AgentId } from '../types.js';
/**
 * Mnemosyne Integration
 *
 * This module provides integration with the mnemosyne MCP server for:
 * - Searching past orchestration executions
 * - Storing new execution records for learning
 * - Retrieving successful patterns
 *
 * Note: The actual MCP calls will be made by Claude Code, not this server.
 * This module provides the data structures and logic for learning from past executions.
 */
export interface PastExecution {
    objective: string;
    plan: OrchestrationPlan;
    agents_used: AgentId[];
    success: boolean;
    duration_ms: number;
    verification_passed: boolean;
    pattern_used?: string;
    timestamp: number;
    tags?: string[];
    project_context?: {
        has_tests?: boolean;
        is_production?: boolean;
        [key: string]: any;
    };
    metadata: {
        verification_passed: boolean;
        success_rate: number;
        [key: string]: any;
    };
}
export interface ExecutionPattern {
    pattern_name: string;
    objectives_matched: string[];
    agents: AgentId[];
    success_rate: number;
    avg_duration_ms: number;
    use_count: number;
}
/**
 * Analyzes a new objective against past executions to find similar patterns
 */
export declare function findSimilarExecutions(objective: string, pastExecutions: PastExecution[]): PastExecution[];
/**
 * Determines if a past execution pattern should be reused for current objective
 */
export declare function shouldReusePattern(pastExecution: PastExecution, currentObjective: string): boolean;
/**
 * Creates an execution record structure for storage in mnemosyne
 */
export declare function createExecutionRecord(objective: string, plan: OrchestrationPlan, agentResults: any[], success: boolean, duration_ms: number): ExecutionRecord;
/**
 * Formats execution data for mnemosyne storage
 */
export declare function formatForMnemosyne(execution: ExecutionRecord): {
    entities: {
        name: string;
        entityType: string;
        observations: string[];
    }[];
    relations: {
        from: string;
        to: string;
        relationType: string;
    }[];
};
/**
 * Analyzes patterns from multiple executions to identify what works
 */
export declare function analyzePatterns(executions: PastExecution[]): ExecutionPattern[];
/**
 * Recommends agents based on past successful executions for similar objectives
 */
export declare function recommendAgents(objective: string, pastExecutions: PastExecution[]): AgentId[];
//# sourceMappingURL=mnemosyne.d.ts.map