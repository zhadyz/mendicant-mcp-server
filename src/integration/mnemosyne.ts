import type { ExecutionRecord, OrchestrationPlan, AgentId } from '../types.js';

/**
 * Mnemosyne Integration
 * 
 * This module provides integration with the mnemosyne MCP server for:
 * - Searching past orchestration executions
 * - Storing new execution records for learning
 * - Retrieving successful patterns
 * 
 * Note: The actual MCP calls will be made by Claude Code, not this server.
 * This module provides the data structures and logic for learning from past executions.
 */

export interface PastExecution {
  objective: string;
  plan: OrchestrationPlan;
  agents_used: AgentId[];
  success: boolean;
  duration_ms: number;
  verification_passed: boolean;
  pattern_used?: string;
  timestamp: number;
  metadata: {
    verification_passed: boolean;
    success_rate: number;
    [key: string]: any;
  };
}

export interface ExecutionPattern {
  pattern_name: string;
  objectives_matched: string[];
  agents: AgentId[];
  success_rate: number;
  avg_duration_ms: number;
  use_count: number;
}

/**
 * Analyzes a new objective against past executions to find similar patterns
 */
export function findSimilarExecutions(
  objective: string,
  pastExecutions: PastExecution[]
): PastExecution[] {
  // Filter for successful executions with good verification
  return pastExecutions.filter(ex => 
    ex.success && 
    ex.metadata.verification_passed &&
    ex.metadata.success_rate > 0.8
  );
}

/**
 * Determines if a past execution pattern should be reused for current objective
 */
export function shouldReusePattern(
  pastExecution: PastExecution,
  currentObjective: string
): boolean {
  const similarity = calculateSimilarity(pastExecution.objective, currentObjective);
  return similarity > 0.7 && pastExecution.metadata.verification_passed;
}

/**
 * Simple similarity calculation (can be enhanced with embeddings)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Creates an execution record structure for storage in mnemosyne
 */
export function createExecutionRecord(
  objective: string,
  plan: OrchestrationPlan,
  agentResults: any[],
  success: boolean,
  duration_ms: number
): ExecutionRecord {
  const agents = plan.agents.map(a => a.agent_id);
  const verification_passed = agentResults.every(r => r.success);
  
  return {
    objective,
    agents,
    success,
    duration_ms,
    pattern_used: plan.reasoning,
    verification_passed
  };
}

/**
 * Formats execution data for mnemosyne storage
 */
export function formatForMnemosyne(execution: ExecutionRecord) {
  return {
    entities: [{
      name: `execution_${Date.now()}`,
      entityType: 'orchestration_execution',
      observations: [
        `Objective: ${execution.objective}`,
        `Agents: ${execution.agents.join(', ')}`,
        `Success: ${execution.success}`,
        `Duration: ${execution.duration_ms}ms`,
        `Pattern: ${execution.pattern_used || 'custom'}`,
        `Verification: ${execution.verification_passed ? 'passed' : 'failed'}`
      ]
    }],
    relations: execution.agents.map(agent => ({
      from: `execution_${Date.now()}`,
      to: agent,
      relationType: 'used_agent'
    }))
  };
}

/**
 * Analyzes patterns from multiple executions to identify what works
 */
export function analyzePatterns(executions: PastExecution[]): ExecutionPattern[] {
  const patternMap = new Map<string, ExecutionPattern>();
  
  for (const exec of executions) {
    const key = exec.pattern_used || 'custom';
    
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        pattern_name: key,
        objectives_matched: [],
        agents: exec.agents_used,
        success_rate: 0,
        avg_duration_ms: 0,
        use_count: 0
      });
    }
    
    const pattern = patternMap.get(key)!;
    pattern.objectives_matched.push(exec.objective);
    pattern.use_count++;
    
    // Update running averages
    const totalSuccess = pattern.success_rate * (pattern.use_count - 1);
    pattern.success_rate = (totalSuccess + (exec.success ? 1 : 0)) / pattern.use_count;
    
    const totalDuration = pattern.avg_duration_ms * (pattern.use_count - 1);
    pattern.avg_duration_ms = (totalDuration + exec.duration_ms) / pattern.use_count;
  }
  
  return Array.from(patternMap.values())
    .sort((a, b) => b.success_rate - a.success_rate);
}

/**
 * Recommends agents based on past successful executions for similar objectives
 */
export function recommendAgents(
  objective: string,
  pastExecutions: PastExecution[]
): AgentId[] {
  const similarExecutions = findSimilarExecutions(objective, pastExecutions);
  
  if (similarExecutions.length === 0) {
    return [];
  }
  
  // Count agent usage in successful executions
  const agentCounts = new Map<AgentId, number>();
  
  for (const exec of similarExecutions) {
    for (const agent of exec.agents_used) {
      agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
    }
  }
  
  // Sort by usage frequency
  return Array.from(agentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([agent]) => agent);
}
