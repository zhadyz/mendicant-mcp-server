import type { ProjectContext, AnalysisResult } from './types.js';
/**
 * Analyzes project health and provides recommendations
 *
 * This examines:
 * - Test status
 * - Build status
 * - Security concerns
 * - Linear issues
 * - Git status
 *
 * And provides actionable recommendations with suggested agents
 */
export declare function analyzeProject(context: ProjectContext): AnalysisResult;
//# sourceMappingURL=analyzer.d.ts.map