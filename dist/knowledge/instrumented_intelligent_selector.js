/**
 * Instrumented IntelligentSelector
 *
 * Wraps IntelligentSelector with event instrumentation for dashboard visibility.
 * Emits events during agent selection and scoring.
 */
import { IntelligentSelector } from './intelligent_selector.js';
import { SelectorInstrumentation } from '../events/instrumentation.js';
/**
 * Extended IntelligentSelector with event instrumentation
 */
export class InstrumentedIntelligentSelector extends IntelligentSelector {
    /**
     * Select agents for objective with event instrumentation
     */
    async selectAgentsForObjective(objective, context) {
        // Get available agents count for event
        const { agentRegistry } = await import('./agent_registry.js');
        const allAgents = await agentRegistry.getAllAgents();
        const availableCount = Object.keys(allAgents).length;
        // Emit selection started event
        SelectorInstrumentation.selectionStarted(objective, availableCount);
        // Call parent implementation
        const recommendations = await super.selectAgentsForObjective(objective, context);
        // Emit scoring events for each recommendation
        for (const rec of recommendations) {
            SelectorInstrumentation.agentScored(rec.agent_id, rec.score, rec.confidence, rec.reasoning);
        }
        // Emit selection events for top agents
        for (let i = 0; i < Math.min(recommendations.length, 10); i++) {
            const rec = recommendations[i];
            SelectorInstrumentation.agentSelected(rec.agent_id, i + 1, rec.score);
        }
        return recommendations;
    }
    /**
     * Score agent with event instrumentation
     */
    async scoreAgent(agent, objective, contextSignature, semanticAnalysis) {
        // Call parent implementation
        const recommendation = await super.scoreAgent(agent, objective, contextSignature, semanticAnalysis);
        // Emit agent scored event
        SelectorInstrumentation.agentScored(recommendation.agent_id, recommendation.score, recommendation.confidence, recommendation.reasoning);
        return recommendation;
    }
}
/**
 * Export singleton instance
 */
export const instrumentedIntelligentSelector = new InstrumentedIntelligentSelector();
//# sourceMappingURL=instrumented_intelligent_selector.js.map