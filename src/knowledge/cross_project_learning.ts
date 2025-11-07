/**
 * Cross-Project Learning Service
 *
 * Enables privacy-aware pattern sharing across projects.
 * Uses scoped Mnemosyne storage with automatic anonymization.
 *
 * CYCLE 5 FEATURE 3: Cross-Project Intelligence
 */

import { mnemosyneClient } from './mnemosyne/client.js';
import { ScopedKey, type LearningScope, DataAnonymizer } from './mnemosyne/scope.js';
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
export class CrossProjectLearningService {
  private currentScope: LearningScope;

  constructor(scope?: LearningScope) {
    this.currentScope = scope || {
      level: 'project',
      identifier: 'default',
      canShare: false,
      sensitivity: 'internal'
    };
  }

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
  async storePattern(
    execution: ExecutionRecord,
    scope?: LearningScope
  ): Promise<void> {
    const targetScope = scope || this.currentScope;

    // Store in project scope
    const projectKey = ScopedKey.build('execution', targetScope, execution.agent_id);
    await mnemosyneClient.remember(projectKey, execution);

    console.log(`[CrossProjectLearning] Stored pattern in ${targetScope.level}:${targetScope.identifier}`);

    // If shareable, also store in organization scope (anonymized)
    if (targetScope.canShare && targetScope.sensitivity === 'public') {
      const orgScope: LearningScope = {
        ...targetScope,
        level: 'organization'
      };

      const orgKey = ScopedKey.build('execution', orgScope, execution.agent_id);
      const anonymized = DataAnonymizer.anonymize(execution);

      await mnemosyneClient.remember(orgKey, {
        ...anonymized,
        projectId: targetScope.identifier
      });

      console.log(`[CrossProjectLearning] Promoted anonymized pattern to organization scope`);
    }
  }

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
  async querySimilarProjects(
    currentObjective: string,
    limit = 5
  ): Promise<SimilarProject[]> {
    // Get organization-level patterns
    const orgScope: LearningScope = {
      level: 'organization',
      identifier: this.currentScope.identifier,
      canShare: true,
      sensitivity: 'public'
    };

    const orgKey = ScopedKey.build('execution', orgScope);

    try {
      // Query Mnemosyne for similar patterns
      const patterns = await mnemosyneClient.recall(orgKey);

      if (!patterns || patterns.length === 0) {
        console.log('[CrossProjectLearning] No organization patterns found');
        return [];
      }

      console.log(`[CrossProjectLearning] Found ${patterns.length} organization patterns`);

      // Group by project and calculate similarity
      const projectGroups = this.groupByProject(patterns);
      const similarities = this.calculateProjectSimilarities(
        currentObjective,
        projectGroups
      );

      return similarities.slice(0, limit);
    } catch (error) {
      console.error('[CrossProjectLearning] Failed to query similar projects:', error);
      return [];
    }
  }

  /**
   * Get successful agent patterns from similar projects
   *
   * Queries top similar projects and aggregates their successful agents.
   * Returns agents ranked by success across similar contexts.
   *
   * @param objective Current objective
   * @returns Array of agent IDs that succeeded in similar contexts
   */
  async getSuccessfulAgentsFromSimilarProjects(
    objective: string
  ): Promise<string[]> {
    const similarProjects = await this.querySimilarProjects(objective);

    if (similarProjects.length === 0) {
      console.log('[CrossProjectLearning] No similar projects found');
      return [];
    }

    console.log(`[CrossProjectLearning] Found ${similarProjects.length} similar projects`);

    // Query patterns from top 3 similar projects
    const topProjects = similarProjects.slice(0, 3);
    const successfulAgents = new Set<string>();

    for (const project of topProjects) {
      const scope: LearningScope = {
        level: 'organization',
        identifier: project.projectId,
        canShare: true,
        sensitivity: 'public'
      };

      const key = ScopedKey.build('execution', scope);
      const patterns = await mnemosyneClient.recall(key);

      patterns
        .filter((p: any) => p.success)
        .forEach((p: any) => successfulAgents.add(p.agent_id));
    }

    console.log(`[CrossProjectLearning] Found ${successfulAgents.size} successful agents from similar projects`);

    return Array.from(successfulAgents);
  }

  /**
   * Update current project scope
   *
   * Allows dynamic reconfiguration of learning boundaries.
   *
   * @param scope New learning scope
   */
  setScope(scope: LearningScope): void {
    this.currentScope = scope;
    console.log(`[CrossProjectLearning] Updated scope to ${scope.level}:${scope.identifier}`);
  }

  /**
   * Get current scope
   *
   * @returns Current learning scope
   */
  getScope(): LearningScope {
    return { ...this.currentScope };
  }

  /**
   * Group patterns by project ID
   *
   * @param patterns Array of execution patterns
   * @returns Map of projectId -> patterns
   */
  private groupByProject(patterns: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const pattern of patterns) {
      const projectId = pattern.projectId || 'unknown';
      if (!groups.has(projectId)) {
        groups.set(projectId, []);
      }
      groups.get(projectId)!.push(pattern);
    }

    return groups;
  }

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
  private calculateProjectSimilarities(
    currentObjective: string,
    projectGroups: Map<string, any[]>
  ): SimilarProject[] {
    const similarities: SimilarProject[] = [];

    for (const [projectId, patterns] of projectGroups) {
      // Simple similarity based on objective keyword overlap
      const objectiveTokens = this.tokenize(currentObjective.toLowerCase());

      let totalSimilarity = 0;
      let matchCount = 0;

      for (const pattern of patterns) {
        if (pattern.objective) {
          const patternTokens = this.tokenize(pattern.objective.toLowerCase());
          const overlap = objectiveTokens.filter(t => patternTokens.includes(t)).length;
          const similarity = overlap / Math.max(objectiveTokens.length, 1);

          totalSimilarity += similarity;
          matchCount++;
        }
      }

      const avgSimilarity = matchCount > 0 ? totalSimilarity / matchCount : 0;

      if (avgSimilarity > 0.1) { // Minimum threshold
        similarities.push({
          projectId,
          similarity: avgSimilarity,
          sharedPatterns: patterns.length
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Tokenize text into keywords
   *
   * Simple whitespace-based tokenization.
   * Filters out short tokens (< 3 chars).
   *
   * @param text Text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 2);
  }
}
