/**
 * Instrumented IntelligentSelector
 *
 * Wraps IntelligentSelector with event instrumentation for dashboard visibility.
 * Emits events during agent selection and scoring.
 */
import { IntelligentSelector, type AgentRecommendation } from './intelligent_selector.js';
import type { ProjectContext, AgentCapability } from '../types.js';
/**
 * Extended IntelligentSelector with event instrumentation
 */
export declare class InstrumentedIntelligentSelector extends IntelligentSelector {
    /**
     * Select agents for objective with event instrumentation
     */
    selectAgentsForObjective(objective: string, context?: ProjectContext): Promise<AgentRecommendation[]>;
    /**
     * Score agent with event instrumentation
     */
    scoreAgent(agent: AgentCapability, objective: string, contextSignature: any, semanticAnalysis: any): Promise<AgentRecommendation>;
}
/**
 * Export singleton instance
 */
export declare const instrumentedIntelligentSelector: InstrumentedIntelligentSelector;
//# sourceMappingURL=instrumented_intelligent_selector.d.ts.map