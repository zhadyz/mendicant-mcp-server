/**
 * Cross-Project Learning Service
 *
 * Enables privacy-aware pattern sharing across projects.
 * Uses scoped Mnemosyne storage with automatic anonymization.
 *
 * CYCLE 5 FEATURE 3: Cross-Project Intelligence
 */
import { type LearningScope } from './mnemosyne/scope.js';
import type { ExecutionRecord } from './mnemosyne/client.js';
export interface ProjectPattern {
    agentId: string;
    objective: string;
    success: boolean;
    projectId: string;
    timestamp: number;
    anonymized: boolean;
}
export interface SimilarProject {
    projectId: string;
    similarity: number;
    sharedPatterns: number;
}
/**
 * Cross-Project Learning Service
 *
 * Manages privacy-aware pattern sharing across organizational boundaries.
 * Automatically anonymizes data when promoting to broader scopes.
 */
export declare class CrossProjectLearningService {
    private currentScope;
    constructor(scope?: LearningScope);
    /**
     * Store execution pattern with appropriate scoping
     *
     * - Stores in project scope for private learning
     * - If shareable, also stores in organization scope (anonymized)
     * - Respects privacy settings and sensitivity levels
     *
     * @param execution Execution record to store
     * @param scope Optional scope override
     */
    storePattern(execution: ExecutionRecord, scope?: LearningScope): Promise<void>;
    /**
     * Query patterns from similar projects
     *
     * Uses semantic matching to find projects with similar objectives.
     * Only queries organization-scoped data (anonymized).
     *
     * @param currentObjective Current objective to match against
     * @param limit Maximum number of similar projects to return
     * @returns Array of similar projects with similarity scores
     */
    querySimilarProjects(currentObjective: string, limit?: number): Promise<SimilarProject[]>;
    /**
     * Get successful agent patterns from similar projects
     *
     * Queries top similar projects and aggregates their successful agents.
     * Returns agents ranked by success across similar contexts.
     *
     * @param objective Current objective
     * @returns Array of agent IDs that succeeded in similar contexts
     */
    getSuccessfulAgentsFromSimilarProjects(objective: string): Promise<string[]>;
    /**
     * Update current project scope
     *
     * Allows dynamic reconfiguration of learning boundaries.
     *
     * @param scope New learning scope
     */
    setScope(scope: LearningScope): void;
    /**
     * Get current scope
     *
     * @returns Current learning scope
     */
    getScope(): LearningScope;
    /**
     * Group patterns by project ID
     *
     * @param patterns Array of execution patterns
     * @returns Map of projectId -> patterns
     */
    private groupByProject;
    /**
     * Calculate project similarities based on objective matching
     *
     * Uses simple token-based similarity (keyword overlap).
     * More sophisticated semantic matching could be added later.
     *
     * @param currentObjective Current objective text
     * @param projectGroups Map of project patterns
     * @returns Array of similar projects sorted by similarity
     */
    private calculateProjectSimilarities;
    /**
     * Tokenize text into keywords
     *
     * Simple whitespace-based tokenization.
     * Filters out short tokens (< 3 chars).
     *
     * @param text Text to tokenize
     * @returns Array of tokens
     */
    private tokenize;
}
//# sourceMappingURL=cross_project_learning.d.ts.map