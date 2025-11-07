/**
 * Smart Agent Selector
 *
 * Wrapper that adds intelligent mode to semantic_selector.
 * Provides backward-compatible API with optional Mnemosyne enhancement.
 *
 * Usage:
 * - analyzeObjectiveSmart(objective) - Uses semantic selection only
 * - analyzeObjectiveSmart(objective, context, true) - Uses intelligent selection with Mnemosyne
 */
import type { ProjectContext, AgentId } from '../types.js';
import { type ObjectiveAnalysis } from './semantic_selector.js';
import { type AgentRecommendation } from './intelligent_selector.js';
export interface SmartObjectiveAnalysis extends ObjectiveAnalysis {
    intelligent_mode: boolean;
    agent_recommendations?: AgentRecommendation[];
}
/**
 * Analyze objective with optional intelligent mode
 *
 * @param objective - The objective to analyze
 * @param context - Optional project context for intelligent mode
 * @param intelligentMode - Enable Mnemosyne-enhanced selection (default: false)
 */
export declare function analyzeObjectiveSmart(objective: string, context?: ProjectContext, intelligentMode?: boolean): Promise<SmartObjectiveAnalysis>;
/**
 * Get recommended agents with full recommendation details
 *
 * @param objective - The objective to analyze
 * @param context - Optional project context
 */
export declare function getRecommendedAgentsWithDetails(objective: string, context?: ProjectContext): Promise<AgentRecommendation[]>;
/**
 * Rank agents by historical success for an objective
 *
 * @param agentIds - List of agent IDs to rank
 * @param objective - The objective context
 * @param context - Optional project context
 */
export declare function rankAgentsBySuccess(agentIds: AgentId[], objective: string, context?: ProjectContext): Promise<AgentId[]>;
//# sourceMappingURL=smart_selector.d.ts.map