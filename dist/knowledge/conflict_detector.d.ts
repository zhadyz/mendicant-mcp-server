/**
 * ENHANCED CONFLICT DETECTOR
 *
 * Comprehensive conflict detection including:
 * - Circular dependency detection (multi-way, any depth)
 * - Contradictory agent combinations
 * - Resource contention
 * - Execution order violations
 * - Capability conflicts
 */
import type { AgentId, AgentSpec, AgentResult, Conflict } from '../types.js';
export interface ConflictAnalysis {
    conflicts: Conflict[];
    warnings: ConflictWarning[];
    safe_to_execute: boolean;
}
export interface ConflictWarning {
    type: 'potential_conflict' | 'execution_order' | 'resource_contention';
    agents: AgentId[];
    description: string;
    suggestion: string;
}
/**
 * Comprehensive conflict detection for agent specifications (planning phase)
 */
export declare function detectPlanConflicts(agents: AgentSpec[]): ConflictAnalysis;
/**
 * Conflict detection for execution results (coordination phase)
 */
export declare function detectExecutionConflicts(results: AgentResult[]): Conflict[];
//# sourceMappingURL=conflict_detector.d.ts.map