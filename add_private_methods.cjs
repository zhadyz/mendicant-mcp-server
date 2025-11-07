const fs = require('fs');
const file = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/knowledge/mahoraga.ts';
let content = fs.readFileSync(file, 'utf8');

// Find the end of the MahoragaMemory class (before the export)
// Add private methods before the closing brace of the class

const privateMethods = `
  /**
   * ADAPTATION 7: Update aggregate statistics with new pattern
   */
  private updateAggregateStats(pattern: ExecutionPattern): void {
    // Incremental update
    const n = this.aggregateStats.total_executions;
    const success = pattern.success ? 1 : 0;

    // Update running averages
    this.aggregateStats.total_executions = n + 1;
    this.aggregateStats.success_rate = (this.aggregateStats.success_rate * n + success) / (n + 1);
    this.aggregateStats.avg_duration_ms = (this.aggregateStats.avg_duration_ms * n + pattern.total_duration_ms) / (n + 1);
    this.aggregateStats.avg_tokens = (this.aggregateStats.avg_tokens * n + pattern.total_tokens) / (n + 1);

    // Update agent usage frequency
    for (const agent of pattern.agents_used) {
      const count = this.aggregateStats.most_used_agents.get(agent) || 0;
      this.aggregateStats.most_used_agents.set(agent, count + 1);
    }

    // Update error frequency
    if (!pattern.success && pattern.failure_reason) {
      const errorType = pattern.failure_reason.split(':')[0];
      const count = this.aggregateStats.error_frequency.get(errorType) || 0;
      this.aggregateStats.error_frequency.set(errorType, count + 1);
    }

    // Update hourly success rate
    const hour = new Date(pattern.timestamp).getHours();
    const hourBucket = this.aggregateStats.hourly_success_rate[hour] || 0;
    this.aggregateStats.hourly_success_rate[hour] = (hourBucket + success) / 2;
  }

  /**
   * ADAPTATION 7: Recalculate aggregate statistics from scratch
   */
  private recalculateAggregateStats(): void {
    this.aggregateStats = {
      total_executions: 0,
      success_rate: 0.0,
      avg_duration_ms: 0,
      avg_tokens: 0,
      most_used_agents: new Map(),
      error_frequency: new Map(),
      hourly_success_rate: new Array(24).fill(0)
    };

    const windowStart = Date.now() - this.ROLLING_WINDOW_MS;
    const windowPatterns = Array.from(this.patterns.values())
      .filter(p => p.timestamp >= windowStart);

    for (const pattern of windowPatterns) {
      this.updateAggregateStats(pattern);
    }
  }

  /**
   * ADAPTATION 6: Rebuild KD-tree from scratch
   */
  private rebuildKDTree(): void {
    this.kdTree = new KDTree<ExecutionPattern>(12);
    for (const pattern of this.patterns.values()) {
      const features = this.featureExtractor.extractFeatures(pattern);
      this.kdTree.insert(features, pattern);
    }
  }
`;

// Find a good insertion point - before the end of MahoragaMemory class
// Look for the last method before the class closing brace
const classEndPattern = /(\n})\n\nexport class PredictiveSelector/;
content = content.replace(classEndPattern, privateMethods + '$1\n\nexport class PredictiveSelector');

fs.writeFileSync(file, content);
console.log('Added private helper methods to MahoragaMemory class');
