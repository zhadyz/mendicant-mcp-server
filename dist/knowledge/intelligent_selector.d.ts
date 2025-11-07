/**
 * Intelligent Agent Selector
 *
 * Uses Mnemosyne learning to improve agent recommendations beyond semantic analysis.
 * Builds on top of semantic_selector with historical success data and context similarity.
 *
 * Scoring Algorithm:
 * final_score = semantic_base_score (0.3) +
 *               mnemosyne_success_rate (0.4) +
 *               context_similarity (0.3)
 */
import type { AgentCapability, ProjectContext } from '../types.js';
import { type ObjectiveAnalysis } from './semantic_selector.js';
/**
 * Agent recommendation with confidence and reasoning
 */
export interface AgentRecommendation {
    agent: AgentCapability;
    score: number;
    confidence: number;
    reasoning: string[];
    historical_performance?: {
        similar_objectives: number;
        success_in_similar: number;
        avg_tokens_in_similar: number;
    };
}
/**
 * Context signature for similarity matching
 */
export interface ContextSignature {
    objective_type: string;
    project_type?: string;
    has_tests?: boolean;
    tags: string[];
    complexity: string;
}
/**
 * Intelligent Agent Selector with Mnemosyne learning
 */
export declare class IntelligentSelector {
    /**
     * Select agents for objective with Mnemosyne-enhanced intelligence
     */
    selectAgentsForObjective(objective: string, context?: ProjectContext): Promise<AgentRecommendation[]>;
    /**
     * Score agent for given objective and context
     */
    scoreAgent(agent: AgentCapability, objective: string, contextSignature: ContextSignature, semanticAnalysis: ObjectiveAnalysis): Promise<AgentRecommendation>;
    /**
     * Rank agents by historical success in similar contexts
     */
    rankByHistoricalSuccess(agents: AgentCapability[], objective: string, context?: ProjectContext): Promise<AgentCapability[]>;
    /**
     * Create context signature for similarity matching
     */
    private createContextSignature;
    /**
     * Calculate semantic score (how well agent matches intent/domain/task)
     */
    private calculateSemanticScore;
    /**
     * Get historical performance from Mnemosyne
     */
    private getHistoricalPerformance;
    /**
     * Calculate score from historical performance
     */
    private calculateHistoricalScore;
    /**
     * Calculate context similarity using Mnemosyne semantic search
     *
     * Note: Simplified implementation using findSimilarObjectives as a proxy.
     * TODO: When Mnemosyne supports context-specific queries, enhance this method.
     */
    private calculateContextSimilarity;
    /**
     * Calculate confidence in recommendation
     */
    private calculateConfidence;
    /**
     * Extract technology keywords from objective
     */
    private extractTechKeywords;
}
/**
 * Singleton instance
 */
export declare const intelligentSelector: IntelligentSelector;
//# sourceMappingURL=intelligent_selector.d.ts.map