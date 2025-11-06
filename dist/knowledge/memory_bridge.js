/**
 * INTELLIGENT MEMORY BRIDGE
 *
 * Mahoraga-level intelligence for consolidating short-term (RAM) memory
 * into long-term (Mnemosyne) storage.
 *
 * The bridge itself is adaptive - it learns what memories are valuable
 * and only persists what matters.
 *
 * Architecture:
 * - Mahoraga (RAM) → Memory Bridge → Mnemosyne (Persistent Storage)
 * - Selective consolidation based on value scoring
 * - Semantic retrieval for context-aware loading
 * - Adaptive thresholds that improve over time
 */
/**
 * Intelligent Memory Bridge
 *
 * This is the consolidation system that decides:
 * 1. WHAT to persist (scoring & thresholds)
 * 2. WHEN to persist (timing & triggers)
 * 3. HOW to persist (entity/relation structure)
 * 4. WHAT to retrieve (semantic relevance)
 */
export class MemoryBridge {
    mnemosyneClient;
    // Adaptive thresholds - these learn over time
    consolidationThreshold = 0.65; // Only persist memories scoring above this
    minSuccessRate = 0.7; // Execution patterns must succeed at least 70%
    noveltyBonus = 0.15; // Boost score for novel patterns
    // Statistics for adaptation
    stats = {
        memories_scored: 0,
        memories_persisted: 0,
        retrievals_performed: 0,
        successful_retrievals: 0
    };
    constructor(mnemosyneClient // MCP client for Mnemosyne tools
    ) {
        this.mnemosyneClient = mnemosyneClient;
    }
    /**
     * CONSOLIDATION: Mahoraga → Mnemosyne
     *
     * Intelligently decide if an execution pattern should be persisted
     */
    async consolidateExecutionPattern(objective, plan, results, conflicts, gaps, projectContext) {
        // Score the memory
        const score = this.scoreExecutionMemory(objective, plan, results, conflicts, gaps, projectContext);
        this.stats.memories_scored++;
        // Decide if it's worth persisting
        const should_persist = score.value >= this.consolidationThreshold;
        if (!should_persist) {
            return {
                should_persist: false,
                memory_type: 'execution_pattern',
                score,
                entities_to_create: [],
                relations_to_create: []
            };
        }
        // Build knowledge graph structure for Mnemosyne
        const { entities, relations } = this.buildExecutionGraph(objective, plan, results, conflicts, gaps, score, projectContext);
        this.stats.memories_persisted++;
        return {
            should_persist: true,
            memory_type: 'execution_pattern',
            score,
            entities_to_create: entities,
            relations_to_create: relations
        };
    }
    /**
     * CONSOLIDATION: Failure contexts
     *
     * Persist critical failures for future avoidance
     */
    async consolidateFailure(objective, failedAgent, error, errorCategory, precedingAgents, suggestedFix, projectContext) {
        // Score the failure memory
        const score = this.scoreFailureMemory(errorCategory, precedingAgents.length, error);
        this.stats.memories_scored++;
        // Critical failures ALWAYS persist (high severity errors)
        const isCritical = this.isCriticalFailure(errorCategory);
        const should_persist = isCritical || score.value >= this.consolidationThreshold;
        if (!should_persist) {
            return {
                should_persist: false,
                memory_type: 'failure_context',
                score,
                entities_to_create: [],
                relations_to_create: []
            };
        }
        // Build failure graph
        const { entities, relations } = this.buildFailureGraph(objective, failedAgent, error, errorCategory, precedingAgents, suggestedFix, score, projectContext);
        this.stats.memories_persisted++;
        return {
            should_persist: true,
            memory_type: 'failure_context',
            score,
            entities_to_create: entities,
            relations_to_create: relations
        };
    }
    /**
     * RETRIEVAL: Mnemosyne → Mahoraga
     *
     * Semantically retrieve relevant past executions
     */
    async retrieveRelevantPatterns(context) {
        if (!this.mnemosyneClient) {
            return [];
        }
        this.stats.retrievals_performed++;
        try {
            // Use semantic search to find similar objectives
            const searchQuery = this.buildRetrievalQuery(context);
            // Search for execution pattern entities
            const results = await this.mnemosyneClient.semantic_search({
                query: searchQuery,
                entity_types: ['ExecutionPattern', 'SuccessfulOrchestration'],
                limit: context.limit || 10,
                min_similarity: 0.7
            });
            if (results && results.length > 0) {
                this.stats.successful_retrievals++;
                return this.parseExecutionPatterns(results);
            }
            return [];
        }
        catch (error) {
            console.error('Failed to retrieve patterns from Mnemosyne:', error);
            return [];
        }
    }
    /**
     * RETRIEVAL: Get failure contexts for similar objectives
     */
    async retrieveRelevantFailures(context) {
        if (!this.mnemosyneClient) {
            return [];
        }
        try {
            const searchQuery = this.buildRetrievalQuery(context);
            const results = await this.mnemosyneClient.semantic_search({
                query: searchQuery,
                entity_types: ['FailureContext', 'CriticalError'],
                limit: context.limit || 5,
                min_similarity: 0.65
            });
            if (results && results.length > 0) {
                return this.parseFailureContexts(results);
            }
            return [];
        }
        catch (error) {
            console.error('Failed to retrieve failures from Mnemosyne:', error);
            return [];
        }
    }
    /**
     * Score an execution memory's value (0.0 to 1.0)
     */
    scoreExecutionMemory(objective, plan, results, conflicts, gaps, projectContext) {
        // Calculate individual factors
        const success_rate = results.filter(r => r.success).length / results.length;
        const reusability = this.scoreReusability(objective, plan, projectContext);
        const novelty = this.scoreNovelty(plan.agents);
        const impact = this.scoreImpact(results, conflicts, gaps);
        const conflict_severity = this.scoreConflictSeverity(conflicts);
        // Weighted combination
        const value = (success_rate * 0.35 + // Success is critical
            reusability * 0.25 + // Reusable patterns are valuable
            novelty * 0.15 + // Novel solutions get bonus
            impact * 0.15 + // High-impact work matters
            (1 - conflict_severity) * 0.10 // Conflicts reduce value
        );
        const reasoning = this.explainScore(value, {
            success_rate,
            reusability,
            novelty,
            impact,
            conflict_severity
        });
        return {
            value,
            reasoning,
            factors: {
                success_rate,
                reusability,
                novelty,
                impact,
                conflict_severity
            }
        };
    }
    /**
     * Score a failure memory's value
     */
    scoreFailureMemory(errorCategory, precedingAgentCount, errorMessage) {
        // Critical errors always score high
        const isCritical = this.isCriticalFailure(errorCategory);
        const criticality = isCritical ? 0.9 : 0.5;
        // Complex failures (many preceding agents) are more valuable to learn from
        const complexity = Math.min(precedingAgentCount / 5, 1.0) * 0.3;
        // Specific error messages are more valuable than vague ones
        const specificity = errorMessage.length > 100 ? 0.8 : 0.4;
        const value = criticality * 0.5 + complexity * 0.3 + specificity * 0.2;
        return {
            value,
            reasoning: `Failure scored ${(value * 100).toFixed(0)}%: ${isCritical ? 'CRITICAL' : 'standard'} ${errorCategory}`,
            factors: {
                success_rate: 0, // Failures have 0 success
                reusability: complexity,
                novelty: specificity,
                impact: criticality,
                conflict_severity: 1.0
            }
        };
    }
    /**
     * Determine if error is critical (should always persist)
     */
    isCriticalFailure(errorCategory) {
        const criticalCategories = [
            'authentication_error',
            'permission_error',
            'database_error',
            'data_loss',
            'security_vulnerability',
            'resource_exhausted'
        ];
        return criticalCategories.includes(errorCategory);
    }
    /**
     * Score how reusable this pattern is
     */
    scoreReusability(objective, plan, projectContext) {
        let score = 0.5; // Base reusability
        // Generic objectives are more reusable
        const genericKeywords = ['fix', 'implement', 'deploy', 'test', 'scaffold'];
        if (genericKeywords.some(kw => objective.toLowerCase().includes(kw))) {
            score += 0.2;
        }
        // Phased execution is more reusable than ad-hoc
        if (plan.execution_strategy === 'phased') {
            score += 0.15;
        }
        // Standard agent combinations are reusable
        const standardAgents = ['the_architect', 'hollowed_eyes', 'loveless', 'the_scribe'];
        const usesStandard = plan.agents.some(a => standardAgents.includes(a.agent_id));
        if (usesStandard) {
            score += 0.15;
        }
        return Math.min(score, 1.0);
    }
    /**
     * Score how novel this pattern is
     */
    scoreNovelty(agents) {
        // More agents = more complex = potentially more novel
        const complexityScore = Math.min(agents.length / 6, 0.5);
        // Uncommon agents are more novel
        const uncommonAgents = ['the_oracle', 'the_sentinel', 'cinna', 'the_cartographer'];
        const hasUncommon = agents.some(a => uncommonAgents.includes(a.agent_id));
        const noveltyBonus = hasUncommon ? 0.3 : 0.0;
        return Math.min(complexityScore + noveltyBonus, 1.0);
    }
    /**
     * Score the impact of this execution
     */
    scoreImpact(results, conflicts, gaps) {
        // More agents deployed = higher impact
        const agentImpact = Math.min(results.length / 5, 0.4);
        // Resolved conflicts = positive impact
        const conflictImpact = conflicts.length > 0 ? 0.3 : 0.0;
        // Identified gaps = learning impact
        const gapImpact = gaps.length > 0 ? 0.2 : 0.0;
        // High token usage = complex work = high impact
        const totalTokens = results.reduce((sum, r) => sum + (r.tokens_used || 0), 0);
        const tokenImpact = totalTokens > 100000 ? 0.2 : 0.1;
        return Math.min(agentImpact + conflictImpact + gapImpact + tokenImpact, 1.0);
    }
    /**
     * Score conflict severity (0 = no conflicts, 1 = severe conflicts)
     */
    scoreConflictSeverity(conflicts) {
        if (conflicts.length === 0)
            return 0.0;
        // More conflicts = higher severity
        const countSeverity = Math.min(conflicts.length / 3, 0.6);
        // Unresolved conflicts are worse
        const unresolvedCount = conflicts.filter(c => !c.resolution).length;
        const resolutionSeverity = unresolvedCount > 0 ? 0.4 : 0.0;
        return Math.min(countSeverity + resolutionSeverity, 1.0);
    }
    /**
     * Explain why a score was assigned
     */
    explainScore(value, factors) {
        const pct = (value * 100).toFixed(0);
        const topFactor = Object.entries(factors)
            .sort(([, a], [, b]) => b - a)[0];
        return `Scored ${pct}% (driven by ${topFactor[0]}: ${(topFactor[1] * 100).toFixed(0)}%)`;
    }
    /**
     * Build knowledge graph entities and relations for execution pattern
     */
    buildExecutionGraph(objective, plan, results, conflicts, gaps, score, projectContext) {
        const entities = [];
        const relations = [];
        const timestamp = Date.now();
        // Main execution pattern entity
        const patternId = `exec_${timestamp}`;
        entities.push({
            name: `Execution: ${objective.substring(0, 50)}`,
            entityType: 'ExecutionPattern',
            observations: [
                `Objective: ${objective}`,
                `Strategy: ${plan.execution_strategy}`,
                `Agents: ${plan.agents.map(a => a.agent_id).join(', ')}`,
                `Success Rate: ${score.factors.success_rate * 100}%`,
                `Value Score: ${score.value.toFixed(2)}`,
                `Reasoning: ${plan.reasoning}`,
                `Conflicts: ${conflicts.length}`,
                `Gaps: ${gaps.length}`,
                `Timestamp: ${new Date(timestamp).toISOString()}`
            ]
        });
        // Agent entities and relations
        for (const agent of plan.agents) {
            const agentName = agent.agent_id;
            // Create/update agent entity
            entities.push({
                name: agentName,
                entityType: 'Agent',
                observations: [
                    `Task: ${agent.task_description}`,
                    `Priority: ${agent.priority}`
                ]
            });
            // Relation: Pattern USES Agent
            relations.push({
                from: patternId,
                to: agentName,
                relationType: 'uses_agent'
            });
            // Dependency relations
            if (agent.dependencies && agent.dependencies.length > 0) {
                for (const dep of agent.dependencies) {
                    relations.push({
                        from: agentName,
                        to: dep,
                        relationType: 'depends_on'
                    });
                }
            }
        }
        // Project context entity
        if (projectContext) {
            const contextName = `Context: ${projectContext.project_type || 'unknown'}`;
            entities.push({
                name: contextName,
                entityType: 'ProjectContext',
                observations: [
                    `Type: ${projectContext.project_type}`,
                    `Has tests: ${projectContext.has_tests}`
                ]
            });
            relations.push({
                from: patternId,
                to: contextName,
                relationType: 'applied_in_context'
            });
        }
        return { entities, relations };
    }
    /**
     * Build knowledge graph for failure context
     */
    buildFailureGraph(objective, failedAgent, error, errorCategory, precedingAgents, suggestedFix, score, projectContext) {
        const entities = [];
        const relations = [];
        const timestamp = Date.now();
        // Failure context entity
        const failureId = `failure_${timestamp}`;
        entities.push({
            name: `Failure: ${failedAgent} - ${errorCategory}`,
            entityType: 'FailureContext',
            observations: [
                `Objective: ${objective}`,
                `Failed Agent: ${failedAgent}`,
                `Error Category: ${errorCategory}`,
                `Error: ${error.substring(0, 200)}`,
                `Suggested Fix: ${suggestedFix}`,
                `Preceding Agents: ${precedingAgents.join(', ')}`,
                `Severity Score: ${score.value.toFixed(2)}`,
                `Timestamp: ${new Date(timestamp).toISOString()}`
            ]
        });
        // Failed agent entity
        entities.push({
            name: failedAgent,
            entityType: 'Agent',
            observations: [
                `Recent failure: ${errorCategory}`
            ]
        });
        relations.push({
            from: failureId,
            to: failedAgent,
            relationType: 'agent_failed'
        });
        // Preceding agent relations (what led to this)
        for (const agent of precedingAgents) {
            relations.push({
                from: failureId,
                to: agent,
                relationType: 'preceded_by'
            });
        }
        return { entities, relations };
    }
    /**
     * Build semantic search query from retrieval context
     */
    buildRetrievalQuery(context) {
        let query = context.objective;
        if (context.intent) {
            query += ` ${context.intent}`;
        }
        if (context.domain) {
            query += ` ${context.domain}`;
        }
        if (context.project_context?.project_type) {
            query += ` ${context.project_context.project_type}`;
        }
        return query;
    }
    /**
     * Parse Mnemosyne results into ExecutionPattern objects
     */
    parseExecutionPatterns(results) {
        // TODO: Implement parsing from Mnemosyne entity format to ExecutionPattern
        // This requires understanding Mnemosyne's response format
        return [];
    }
    /**
     * Parse Mnemosyne results into FailureContext objects
     */
    parseFailureContexts(results) {
        // TODO: Implement parsing
        return [];
    }
    /**
     * Get bridge statistics (for monitoring health)
     */
    getStats() {
        return {
            ...this.stats,
            consolidation_threshold: this.consolidationThreshold,
            persistence_rate: this.stats.memories_scored > 0
                ? this.stats.memories_persisted / this.stats.memories_scored
                : 0,
            retrieval_success_rate: this.stats.retrievals_performed > 0
                ? this.stats.successful_retrievals / this.stats.retrievals_performed
                : 0
        };
    }
    /**
     * Adapt thresholds based on performance
     * (Mahoraga-style self-improvement)
     */
    adaptThresholds(feedback) {
        // If retrievals are helping, we can be MORE selective (raise threshold)
        if (feedback.retrieval_helped && this.stats.successful_retrievals > 10) {
            this.consolidationThreshold = Math.min(this.consolidationThreshold + 0.02, 0.85);
        }
        // If memories aren't being reused, we're being TOO selective (lower threshold)
        if (!feedback.memory_reused && this.stats.memories_persisted > 20) {
            this.consolidationThreshold = Math.max(this.consolidationThreshold - 0.02, 0.50);
        }
    }
}
/**
 * Global memory bridge instance
 */
export const memoryBridge = new MemoryBridge();
//# sourceMappingURL=memory_bridge.js.map