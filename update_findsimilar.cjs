const fs = require('fs');
const file = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/knowledge/mahoraga.ts';
let content = fs.readFileSync(file, 'utf8');

const oldMethod = `  /**
   * Find patterns similar to the given objective
   */
  findSimilarPatterns(
    objective: string,
    projectContext?: ProjectContext,
    limit: number = 10
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const objectiveType = this.extractObjectiveType(objective);
    const objectiveTags = this.extractTags(objective, projectContext);

    for (const pattern of this.patterns.values()) {
      const similarity = this.calculateSimilarity(
        objective,
        objectiveType,
        objectiveTags,
        pattern,
        projectContext
      );

      if (similarity > 0.3) { // Minimum threshold
        matches.push({
          pattern,
          similarity_score: similarity,
          matching_factors: this.getMatchingFactors(pattern, objectiveType, objectiveTags, projectContext),
          success_rate: pattern.success ? 1.0 : 0.0,
          avg_duration_ms: pattern.total_duration_ms,
          recommended_agents: pattern.agents_used
        });
      }
    }

    // Sort by similarity and success
    return matches
      .sort((a, b) => {
        const scoreA = a.similarity_score * (a.success_rate + 0.1);
        const scoreB = b.similarity_score * (b.success_rate + 0.1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }`;

const newMethod = `  /**
   * Find patterns similar to the given objective
   * ADAPTATION 6: Uses KD-tree for O(log n) similarity search instead of O(n) linear search
   */
  findSimilarPatterns(
    objective: string,
    projectContext?: ProjectContext,
    limit: number = 10
  ): PatternMatch[] {
    const objectiveType = this.extractObjectiveType(objective);
    const objectiveTags = this.extractTags(objective, projectContext);

    // ADAPTATION 6: Use KD-tree k-NN search for O(log n) performance
    const queryFeatures = this.featureExtractor.extractQueryFeatures(
      objective,
      objectiveType,
      objectiveTags,
      projectContext?.project_type
    );

    // Get more candidates than needed since we'll filter by threshold
    const candidates = this.kdTree.kNearestNeighbors(queryFeatures, limit * 3);

    const matches: PatternMatch[] = [];

    // Calculate actual similarity and filter by threshold
    for (const candidate of candidates) {
      const pattern = candidate.data;
      const similarity = this.calculateSimilarity(
        objective,
        objectiveType,
        objectiveTags,
        pattern,
        projectContext
      );

      if (similarity > 0.3) { // Minimum threshold
        matches.push({
          pattern,
          similarity_score: similarity,
          matching_factors: this.getMatchingFactors(pattern, objectiveType, objectiveTags, projectContext),
          success_rate: pattern.success ? 1.0 : 0.0,
          avg_duration_ms: pattern.total_duration_ms,
          recommended_agents: pattern.agents_used
        });
      }
    }

    // Sort by similarity and success
    return matches
      .sort((a, b) => {
        const scoreA = a.similarity_score * (a.success_rate + 0.1);
        const scoreB = b.similarity_score * (b.success_rate + 0.1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }`;

content = content.replace(oldMethod, newMethod);
fs.writeFileSync(file, content);
console.log('Updated findSimilarPatterns to use KD-tree');
