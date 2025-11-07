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
import { analyzeObjectiveSemantic } from './semantic_selector.js';
import { mnemosyneClient } from './mnemosyne/client.js';
import { agentRegistry } from './agent_registry.js';
/**
 * Intelligent Agent Selector with Mnemosyne learning
 */
export class IntelligentSelector {
    /**
     * Select agents for objective with Mnemosyne-enhanced intelligence
     */
    async selectAgentsForObjective(objective, context) {
        console.log('[IntelligentSelector] Selecting agents for:', objective);
        // Step 1: Get semantic baseline
        const semanticAnalysis = analyzeObjectiveSemantic(objective);
        // Step 2: Get all available agents
        const allAgents = await agentRegistry.getAllAgents();
        const agentsList = Object.values(allAgents);
        // Step 3: Create context signature
        const contextSignature = this.createContextSignature(objective, context, semanticAnalysis);
        // Step 4: Score each agent
        const recommendations = [];
        for (const agent of agentsList) {
            const score = await this.scoreAgent(agent, objective, contextSignature, semanticAnalysis);
            if (score.score > 0.3) { // Threshold for inclusion
                recommendations.push(score);
            }
        }
        // Step 5: Sort by score descending
        recommendations.sort((a, b) => b.score - a.score);
        console.log(`[IntelligentSelector] Selected ${recommendations.length} agents`);
        return recommendations;
    }
    /**
     * Score agent for given objective and context
     */
    async scoreAgent(agent, objective, contextSignature, semanticAnalysis) {
        const reasoning = [];
        let totalScore = 0;
        // Component 1: Semantic baseline (weight: 0.3)
        const semanticScore = this.calculateSemanticScore(agent, semanticAnalysis);
        totalScore += semanticScore * 0.3;
        reasoning.push(`Semantic match: ${(semanticScore * 100).toFixed(0)}%`);
        // Component 2: Historical success rate (weight: 0.4)
        const historicalPerf = await this.getHistoricalPerformance(agent.name, contextSignature);
        const historicalScore = this.calculateHistoricalScore(historicalPerf);
        totalScore += historicalScore * 0.4;
        reasoning.push(`Historical success: ${(historicalScore * 100).toFixed(0)}%`);
        // Component 3: Context similarity (weight: 0.3)
        const contextScore = await this.calculateContextSimilarity(agent.name, contextSignature);
        totalScore += contextScore * 0.3;
        reasoning.push(`Context similarity: ${(contextScore * 100).toFixed(0)}%`);
        // Confidence calculation (based on data availability)
        const confidence = this.calculateConfidence(semanticScore, historicalPerf, contextScore);
        return {
            agent,
            score: totalScore,
            confidence,
            reasoning,
            historical_performance: historicalPerf
        };
    }
    /**
     * Rank agents by historical success in similar contexts
     */
    async rankByHistoricalSuccess(agents, objective, context) {
        const semanticAnalysis = analyzeObjectiveSemantic(objective);
        const contextSignature = this.createContextSignature(objective, context, semanticAnalysis);
        const scored = await Promise.all(agents.map(async (agent) => {
            const historicalPerf = await this.getHistoricalPerformance(agent.name, contextSignature);
            const score = this.calculateHistoricalScore(historicalPerf);
            return { agent, score };
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.agent);
    }
    // Private methods
    /**
     * Create context signature for similarity matching
     */
    createContextSignature(objective, context, semanticAnalysis) {
        const tags = [];
        // Add intent, domain, task_type as tags
        tags.push(semanticAnalysis.intent);
        tags.push(semanticAnalysis.domain);
        tags.push(semanticAnalysis.task_type);
        // Add project type
        if (context?.project_type) {
            tags.push(context.project_type);
        }
        // Extract technology keywords from objective
        const techKeywords = this.extractTechKeywords(objective);
        tags.push(...techKeywords);
        return {
            objective_type: semanticAnalysis.intent,
            project_type: context?.project_type,
            has_tests: context?.has_tests,
            tags,
            complexity: semanticAnalysis.complexity
        };
    }
    /**
     * Calculate semantic score (how well agent matches intent/domain/task)
     */
    calculateSemanticScore(agent, analysis) {
        // Check if agent is in semantic recommendations
        const isRecommended = analysis.recommended_agents.includes(agent.name);
        if (isRecommended) {
            // Base score from semantic recommendation
            return Math.min(analysis.confidence, 1.0);
        }
        // Not recommended semantically, but check for partial matches
        const agentSpec = agent.specialization.toLowerCase();
        const useCases = agent.typical_use_cases.join(' ').toLowerCase();
        const intentMatch = useCases.includes(analysis.intent);
        const domainMatch = agentSpec.includes(analysis.domain);
        if (intentMatch && domainMatch)
            return 0.6;
        if (intentMatch || domainMatch)
            return 0.3;
        return 0.1; // Minimal score for all agents
    }
    /**
     * Get historical performance from Mnemosyne
     */
    async getHistoricalPerformance(agentId, context) {
        if (!mnemosyneClient.isConnected()) {
            return {
                similar_objectives: 0,
                success_in_similar: 0,
                avg_tokens_in_similar: 0
            };
        }
        try {
            // Use queryAgentPerformance to get direct metrics
            const metrics = await mnemosyneClient.queryAgentPerformance(agentId);
            if (!metrics) {
                return {
                    similar_objectives: 0,
                    success_in_similar: 0,
                    avg_tokens_in_similar: 0
                };
            }
            // Return metrics as historical performance
            // Note: This doesn't filter by context, but provides general agent performance
            // TODO: When Mnemosyne supports context-filtered queries, update this
            return {
                similar_objectives: metrics.total_executions,
                success_in_similar: metrics.successful_executions,
                avg_tokens_in_similar: metrics.avg_tokens
            };
        }
        catch (err) {
            console.error('[IntelligentSelector] Failed to get historical performance:', err);
            return {
                similar_objectives: 0,
                success_in_similar: 0,
                avg_tokens_in_similar: 0
            };
        }
    }
    /**
     * Calculate score from historical performance
     */
    calculateHistoricalScore(perf) {
        if (perf.similar_objectives === 0) {
            // No historical data, use neutral score
            return 0.5;
        }
        // Success rate in similar contexts
        const successRate = perf.success_in_similar / perf.similar_objectives;
        // Confidence factor (more data = more reliable)
        const confidenceFactor = Math.min(perf.similar_objectives / 10, 1.0);
        // Blend success rate with confidence
        return successRate * confidenceFactor + 0.5 * (1 - confidenceFactor);
    }
    /**
     * Calculate context similarity using Mnemosyne semantic search
     *
     * Note: Simplified implementation using findSimilarObjectives as a proxy.
     * TODO: When Mnemosyne supports context-specific queries, enhance this method.
     */
    async calculateContextSimilarity(agentId, context) {
        if (!mnemosyneClient.isConnected()) {
            return 0.5; // Neutral score when Mnemosyne unavailable
        }
        try {
            // Use findSimilarObjectives with context type as query
            // This is a simplified approach - ideally we'd have context-specific search
            const query = context.tags.join(' ');
            const results = await mnemosyneClient.findSimilarObjectives(query, 5);
            if (results.length === 0) {
                return 0.4; // Low score for no matching context
            }
            // Check if agentId appears in recommended agents of similar objectives
            let maxSimilarity = 0;
            for (const result of results) {
                if (result.recommended_agents.includes(agentId)) {
                    // Agent was successful in similar context
                    maxSimilarity = Math.max(maxSimilarity, result.similarity_score * result.success_rate);
                }
            }
            return maxSimilarity > 0 ? maxSimilarity : 0.4;
        }
        catch (err) {
            console.error('[IntelligentSelector] Failed to calculate context similarity:', err);
            return 0.5;
        }
    }
    /**
     * Calculate confidence in recommendation
     */
    calculateConfidence(semanticScore, historicalPerf, contextScore) {
        let confidence = 0;
        // Component 1: Semantic confidence (always available)
        confidence += 0.4;
        // Component 2: Historical data availability
        if (historicalPerf.similar_objectives > 0) {
            const dataConfidence = Math.min(historicalPerf.similar_objectives / 20, 1.0);
            confidence += 0.3 * dataConfidence;
        }
        // Component 3: Context matching availability
        if (contextScore > 0.4) {
            confidence += 0.3;
        }
        return Math.min(confidence, 1.0);
    }
    /**
     * Extract technology keywords from objective
     */
    extractTechKeywords(objective) {
        const keywords = [];
        const lower = objective.toLowerCase();
        const techPatterns = {
            'nextjs': 'nextjs',
            'next.js': 'nextjs',
            'react': 'react',
            'typescript': 'typescript',
            'javascript': 'javascript',
            'python': 'python',
            'rust': 'rust',
            'go': 'golang',
            'java': 'java',
            'docker': 'docker',
            'kubernetes': 'kubernetes',
            'k8s': 'kubernetes',
            'vercel': 'vercel',
            'aws': 'aws',
            'azure': 'azure',
            'gcp': 'gcp',
            'postgres': 'postgresql',
            'mongodb': 'mongodb',
            'redis': 'redis',
            'graphql': 'graphql',
            'rest': 'rest_api',
            'api': 'api'
        };
        for (const [pattern, keyword] of Object.entries(techPatterns)) {
            if (lower.includes(pattern)) {
                keywords.push(keyword);
            }
        }
        return Array.from(new Set(keywords));
    }
}
/**
 * Singleton instance
 */
export const intelligentSelector = new IntelligentSelector();
//# sourceMappingURL=intelligent_selector.js.map