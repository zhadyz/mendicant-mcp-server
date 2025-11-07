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
import { analyzeObjectiveSemantic } from './semantic_selector.js';
import { intelligentSelector } from './intelligent_selector.js';
/**
 * Analyze objective with optional intelligent mode
 *
 * @param objective - The objective to analyze
 * @param context - Optional project context for intelligent mode
 * @param intelligentMode - Enable Mnemosyne-enhanced selection (default: false)
 */
export async function analyzeObjectiveSmart(objective, context, intelligentMode = false) {
    // Always start with semantic analysis
    const semanticAnalysis = analyzeObjectiveSemantic(objective);
    if (!intelligentMode) {
        // Semantic mode only (backward compatible)
        return {
            ...semanticAnalysis,
            intelligent_mode: false
        };
    }
    // Intelligent mode - enhance with Mnemosyne learning
    const recommendations = await intelligentSelector.selectAgentsForObjective(objective, context);
    // Replace recommended_agents with intelligent recommendations
    const intelligentAgents = recommendations
        .slice(0, 5) // Top 5 agents
        .map(r => r.agent.name);
    return {
        ...semanticAnalysis,
        recommended_agents: intelligentAgents,
        intelligent_mode: true,
        agent_recommendations: recommendations,
        confidence: calculateAggregateConfidence(recommendations)
    };
}
/**
 * Get recommended agents with full recommendation details
 *
 * @param objective - The objective to analyze
 * @param context - Optional project context
 */
export async function getRecommendedAgentsWithDetails(objective, context) {
    return intelligentSelector.selectAgentsForObjective(objective, context);
}
/**
 * Rank agents by historical success for an objective
 *
 * @param agentIds - List of agent IDs to rank
 * @param objective - The objective context
 * @param context - Optional project context
 */
export async function rankAgentsBySuccess(agentIds, objective, context) {
    const recommendations = await intelligentSelector.selectAgentsForObjective(objective, context);
    // Filter to only requested agents and sort by score
    const filtered = recommendations
        .filter(r => agentIds.includes(r.agent.name))
        .sort((a, b) => b.score - a.score)
        .map(r => r.agent.name);
    // Add any requested agents not in recommendations (at end, in original order)
    const notFound = agentIds.filter(id => !filtered.includes(id));
    return [...filtered, ...notFound];
}
/**
 * Calculate aggregate confidence from recommendations
 */
function calculateAggregateConfidence(recommendations) {
    if (recommendations.length === 0)
        return 0.5;
    // Weight by score - higher scored agents contribute more to confidence
    const weightedConfidence = recommendations
        .slice(0, 3) // Top 3 agents
        .reduce((sum, r, idx) => {
        const weight = 1 / (idx + 1); // 1.0, 0.5, 0.33
        return sum + r.confidence * r.score * weight;
    }, 0);
    const totalWeight = 1 + 0.5 + 0.33;
    return Math.min(weightedConfidence / totalWeight, 1.0);
}
//# sourceMappingURL=smart_selector.js.map