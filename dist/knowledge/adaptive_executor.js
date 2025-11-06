/**
 * Adaptive Executor - Real-Time Plan Modification
 *
 * This is what makes Mendicant truly adaptive like Mahoraga - the ability to
 * modify execution plans IN REAL-TIME based on what's actually happening.
 *
 * Traditional executors follow a fixed plan. Adaptive executors:
 * - Monitor execution health in real-time
 * - Detect when plans are failing
 * - Generate recovery strategies on-the-fly
 * - Substitute agents when needed
 * - Adapt to resource constraints dynamically
 * - Learn optimal recovery patterns
 *
 * This is the difference between "learning from past executions" and
 * "adapting DURING execution" - true Mahoraga-style adaptation.
 */
import { feedbackLoop } from './feedback_loop.js';
/**
 * Adaptive Executor - Monitors and modifies execution in real-time
 */
export class AdaptiveExecutor {
    execution_state;
    adaptation_history = [];
    recovery_patterns = new Map();
    /**
     * Initialize adaptive execution
     */
    async startExecution(objective, initial_plan, context) {
        this.execution_state = {
            objective,
            original_plan: initial_plan,
            current_plan: initial_plan,
            completed_agents: [],
            pending_agents: [...initial_plan.agents],
            status: 'running',
            adaptations: [],
            resource_usage: {
                total_duration_ms: 0,
                total_tokens: 0,
                max_parallel_agents: 0
            },
            start_time: Date.now(),
            context
        };
        console.log(`[AdaptiveExecutor] Started execution: ${objective.slice(0, 60)}...`);
        console.log(`[AdaptiveExecutor] Initial plan: ${initial_plan.agents.length} agents, confidence: ${(initial_plan.confidence * 100).toFixed(1)}%`);
        return this.execution_state;
    }
    /**
     * Process agent result and adapt if needed
     */
    async processAgentResult(result) {
        if (!this.execution_state) {
            throw new Error('No active execution state');
        }
        console.log(`[AdaptiveExecutor] Agent ${result.agent_id} ${result.success ? 'succeeded' : 'FAILED'} in ${result.duration_ms}ms`);
        // Update state
        this.execution_state.completed_agents.push(result);
        this.execution_state.pending_agents = this.execution_state.pending_agents.filter(a => a !== result.agent_id);
        this.execution_state.resource_usage.total_duration_ms += result.duration_ms;
        this.execution_state.resource_usage.total_tokens += result.tokens_used;
        // Check if adaptation needed
        if (!result.success) {
            console.log(`[AdaptiveExecutor] Agent failure detected - initiating recovery`);
            this.execution_state.status = 'recovering';
            await this.handleFailure(result);
        }
        else {
            // Check if plan needs optimization
            const needs_optimization = await this.shouldOptimizePlan(result);
            if (needs_optimization) {
                console.log(`[AdaptiveExecutor] Plan optimization triggered`);
                this.execution_state.status = 'adapting';
                await this.optimizePlan();
            }
        }
        // Check if execution complete
        if (this.execution_state.pending_agents.length === 0) {
            this.execution_state.status = 'completed';
            await this.finalizeExecution();
        }
        else {
            this.execution_state.status = 'running';
        }
        return this.execution_state;
    }
    /**
     * Handle agent failure with recovery strategy
     */
    async handleFailure(failed_result) {
        if (!this.execution_state)
            return;
        const failed_agent = failed_result.agent_id;
        const error = failed_result.error || 'Unknown error';
        console.log(`[AdaptiveExecutor] Analyzing failure: ${failed_agent}`);
        console.log(`[AdaptiveExecutor] Error: ${error.slice(0, 100)}...`);
        // Find or generate recovery strategy
        const strategy = await this.findRecoveryStrategy(failed_agent, error);
        console.log(`[AdaptiveExecutor] Recovery strategy: ${strategy.strategy_type}`);
        console.log(`[AdaptiveExecutor] Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
        // Apply recovery strategy
        await this.applyRecoveryStrategy(strategy);
        // Learn from this recovery
        await this.learnRecoveryPattern(failed_agent, error, strategy);
    }
    /**
     * Find or generate recovery strategy for failed agent
     */
    async findRecoveryStrategy(failed_agent, error) {
        // Check if we've seen this failure pattern before
        const pattern_key = `${failed_agent}:${this.classifyError(error)}`;
        const learned_strategies = this.recovery_patterns.get(pattern_key);
        if (learned_strategies && learned_strategies.length > 0) {
            // Use learned strategy with highest confidence
            const best_strategy = learned_strategies.reduce((best, current) => current.confidence > best.confidence ? current : best);
            console.log(`[AdaptiveExecutor] Using learned recovery strategy (confidence: ${(best_strategy.confidence * 100).toFixed(1)}%)`);
            return best_strategy;
        }
        // Generate new recovery strategy
        return await this.generateRecoveryStrategy(failed_agent, error);
    }
    /**
     * Generate new recovery strategy
     */
    async generateRecoveryStrategy(failed_agent, error) {
        const error_type = this.classifyError(error);
        // Strategy 1: Retry for transient errors
        if (error_type === 'transient' || error_type === 'timeout') {
            return {
                strategy_type: 'retry',
                failed_agent,
                replacement_agents: [failed_agent],
                confidence: 0.6,
                reasoning: 'Transient error - retry same agent'
            };
        }
        // Strategy 2: Substitute for capability errors
        if (error_type === 'capability' || error_type === 'not_found') {
            const alternative_agents = await this.findAlternativeAgents(failed_agent);
            return {
                strategy_type: 'substitute',
                failed_agent,
                replacement_agents: alternative_agents,
                confidence: 0.7,
                reasoning: 'Capability mismatch - substituting with alternative agents'
            };
        }
        // Strategy 3: Skip for non-critical errors
        if (error_type === 'non_critical') {
            return {
                strategy_type: 'skip',
                failed_agent,
                replacement_agents: [],
                confidence: 0.5,
                reasoning: 'Non-critical error - skipping agent'
            };
        }
        // Strategy 4: Alternative path for logical errors
        if (error_type === 'logical' || error_type === 'validation') {
            const alternative_agents = await this.findAlternativeAgents(failed_agent);
            return {
                strategy_type: 'alternative_path',
                failed_agent,
                replacement_agents: alternative_agents,
                confidence: 0.65,
                reasoning: 'Logical error - trying alternative approach'
            };
        }
        // Default: Retry with lower confidence
        return {
            strategy_type: 'retry',
            failed_agent,
            replacement_agents: [failed_agent],
            confidence: 0.4,
            reasoning: 'Unknown error type - attempting retry'
        };
    }
    /**
     * Classify error type
     */
    classifyError(error) {
        const error_lower = error.toLowerCase();
        if (error_lower.includes('timeout') || error_lower.includes('timed out')) {
            return 'timeout';
        }
        if (error_lower.includes('not found') || error_lower.includes('does not exist')) {
            return 'not_found';
        }
        if (error_lower.includes('capability') || error_lower.includes('cannot perform')) {
            return 'capability';
        }
        if (error_lower.includes('validation') || error_lower.includes('invalid')) {
            return 'validation';
        }
        if (error_lower.includes('warning') || error_lower.includes('non-critical')) {
            return 'non_critical';
        }
        if (error_lower.includes('network') || error_lower.includes('connection')) {
            return 'transient';
        }
        return 'logical';
    }
    /**
     * Find alternative agents for failed agent
     */
    async findAlternativeAgents(failed_agent) {
        // In a full implementation, this would:
        // 1. Analyze failed agent's intended task
        // 2. Query agent registry for similar capabilities
        // 3. Use Bayesian confidence to rank alternatives
        // 4. Return top N alternatives
        // Simplified: Return generic alternatives based on agent type
        const alternatives = [];
        if (failed_agent.includes('debug') || failed_agent.includes('analyze')) {
            alternatives.push('hollowed_eyes', 'reverse_cursed_technique');
        }
        else if (failed_agent.includes('implement') || failed_agent.includes('build')) {
            alternatives.push('limitless', 'construction');
        }
        else if (failed_agent.includes('test')) {
            alternatives.push('six_eyes', 'divine_dogs');
        }
        // Remove the failed agent from alternatives
        return alternatives.filter(a => a !== failed_agent).slice(0, 2);
    }
    /**
     * Apply recovery strategy to execution plan
     */
    async applyRecoveryStrategy(strategy) {
        if (!this.execution_state)
            return;
        const old_plan = [...this.execution_state.current_plan.agents];
        // Remove failed agent from pending
        this.execution_state.pending_agents = this.execution_state.pending_agents.filter(a => a !== strategy.failed_agent);
        // Apply strategy
        switch (strategy.strategy_type) {
            case 'retry':
                // Add failed agent back to pending (at the beginning for immediate retry)
                this.execution_state.pending_agents.unshift(strategy.failed_agent);
                console.log(`[AdaptiveExecutor] Retrying agent: ${strategy.failed_agent}`);
                break;
            case 'substitute':
                // Replace with alternative agents
                this.execution_state.pending_agents.unshift(...strategy.replacement_agents);
                console.log(`[AdaptiveExecutor] Substituted ${strategy.failed_agent} with ${strategy.replacement_agents.join(', ')}`);
                break;
            case 'skip':
                // Do nothing - agent already removed from pending
                console.log(`[AdaptiveExecutor] Skipped agent: ${strategy.failed_agent}`);
                break;
            case 'alternative_path':
                // Insert alternative agents
                this.execution_state.pending_agents.unshift(...strategy.replacement_agents);
                console.log(`[AdaptiveExecutor] Alternative path with ${strategy.replacement_agents.join(', ')}`);
                break;
            case 'rollback':
                // Rollback would require state management - simplified here
                console.log(`[AdaptiveExecutor] Rollback requested (not implemented)`);
                break;
        }
        // Update current plan
        this.execution_state.current_plan.agents = [
            ...this.execution_state.completed_agents.map(r => r.agent_id),
            ...this.execution_state.pending_agents
        ];
        // Record adaptation
        const adaptation = {
            type: 'recovery_strategy',
            reason: strategy.reasoning,
            original_plan: old_plan,
            adapted_plan: this.execution_state.current_plan.agents,
            confidence: strategy.confidence,
            timestamp: Date.now()
        };
        this.execution_state.adaptations.push(adaptation);
        this.adaptation_history.push(adaptation);
    }
    /**
     * Learn recovery pattern for future use
     */
    async learnRecoveryPattern(failed_agent, error, strategy) {
        const pattern_key = `${failed_agent}:${this.classifyError(error)}`;
        const strategies = this.recovery_patterns.get(pattern_key) || [];
        strategies.push(strategy);
        // Keep only top 5 strategies
        strategies.sort((a, b) => b.confidence - a.confidence);
        this.recovery_patterns.set(pattern_key, strategies.slice(0, 5));
        console.log(`[AdaptiveExecutor] Learned recovery pattern: ${pattern_key}`);
    }
    /**
     * Check if plan needs optimization based on execution progress
     */
    async shouldOptimizePlan(result) {
        if (!this.execution_state)
            return false;
        // Optimize if we're significantly over budget
        const original_estimate = this.execution_state.original_plan.estimated_duration_ms;
        const current_duration = this.execution_state.resource_usage.total_duration_ms;
        if (current_duration > original_estimate * 1.5) {
            console.log(`[AdaptiveExecutor] Execution over time budget (${current_duration}ms vs ${original_estimate}ms)`);
            return true;
        }
        // Optimize if token usage is high
        const original_tokens = this.execution_state.original_plan.estimated_tokens;
        const current_tokens = this.execution_state.resource_usage.total_tokens;
        if (current_tokens > original_tokens * 1.5) {
            console.log(`[AdaptiveExecutor] Execution over token budget (${current_tokens} vs ${original_tokens})`);
            return true;
        }
        return false;
    }
    /**
     * Optimize plan based on current execution state
     */
    async optimizePlan() {
        if (!this.execution_state)
            return;
        console.log(`[AdaptiveExecutor] Optimizing plan with ${this.execution_state.pending_agents.length} pending agents`);
        // Analyze remaining agents
        const remaining_agents = this.execution_state.pending_agents;
        // Remove redundant agents (agents that would duplicate work)
        const optimized_agents = this.removeRedundantAgents(remaining_agents);
        const old_plan = [...this.execution_state.current_plan.agents];
        // Update plan
        this.execution_state.pending_agents = optimized_agents;
        this.execution_state.current_plan.agents = [
            ...this.execution_state.completed_agents.map(r => r.agent_id),
            ...optimized_agents
        ];
        // Record adaptation
        const adaptation = {
            type: 'resource_optimization',
            reason: 'Removed redundant agents to optimize resource usage',
            original_plan: old_plan,
            adapted_plan: this.execution_state.current_plan.agents,
            confidence: 0.75,
            timestamp: Date.now()
        };
        this.execution_state.adaptations.push(adaptation);
        this.adaptation_history.push(adaptation);
        console.log(`[AdaptiveExecutor] Plan optimized: ${remaining_agents.length} → ${optimized_agents.length} agents`);
    }
    /**
     * Remove redundant agents from plan
     */
    removeRedundantAgents(agents) {
        // Simple heuristic: remove duplicate agent types
        const seen = new Set();
        const optimized = [];
        for (const agent of agents) {
            // Extract agent type (e.g., "debug" from "hollowed_eyes_debug")
            const type = agent.split('_').slice(-1)[0];
            if (!seen.has(type)) {
                seen.add(type);
                optimized.push(agent);
            }
        }
        return optimized;
    }
    /**
     * Finalize execution and send feedback
     */
    async finalizeExecution() {
        if (!this.execution_state)
            return;
        const duration = Date.now() - this.execution_state.start_time;
        const success = this.execution_state.completed_agents.every(r => r.success);
        console.log(`[AdaptiveExecutor] Execution ${success ? 'COMPLETED' : 'FAILED'} in ${duration}ms`);
        console.log(`[AdaptiveExecutor] Adaptations made: ${this.execution_state.adaptations.length}`);
        // Send feedback to learning loop
        const feedback = {
            objective: this.execution_state.objective,
            agents_used: this.execution_state.completed_agents.map(r => r.agent_id),
            predicted_confidence: this.execution_state.original_plan.confidence,
            predicted_intents: [], // Would come from semantic embedder
            predicted_domains: [], // Would come from semantic embedder
            actual_success: success,
            actual_duration_ms: duration,
            actual_tokens_used: this.execution_state.resource_usage.total_tokens,
            errors_encountered: this.execution_state.completed_agents
                .filter(r => !r.success)
                .map(r => r.error || 'Unknown error'),
            conflicts_detected: [],
            timestamp: Date.now(),
            context: this.execution_state.context
        };
        await feedbackLoop.processFeedback(feedback);
    }
    /**
     * Get current execution state
     */
    getState() {
        return this.execution_state ? { ...this.execution_state } : undefined;
    }
    /**
     * Get adaptation history
     */
    getAdaptationHistory() {
        return [...this.adaptation_history];
    }
    /**
     * Get learned recovery patterns
     */
    getRecoveryPatterns() {
        return new Map(this.recovery_patterns);
    }
}
/**
 * Singleton instance
 */
export const adaptiveExecutor = new AdaptiveExecutor();
//# sourceMappingURL=adaptive_executor.js.map