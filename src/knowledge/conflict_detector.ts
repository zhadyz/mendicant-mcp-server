/**
 * ENHANCED CONFLICT DETECTOR
 *
 * Comprehensive conflict detection including:
 * - Circular dependency detection (multi-way, any depth)
 * - Contradictory agent combinations
 * - Resource contention
 * - Execution order violations
 * - Capability conflicts
 */

import type { AgentId, AgentSpec, AgentResult, Conflict } from '../types.js';

export interface ConflictAnalysis {
  conflicts: Conflict[];
  warnings: ConflictWarning[];
  safe_to_execute: boolean;
}

export interface ConflictWarning {
  type: 'potential_conflict' | 'execution_order' | 'resource_contention';
  agents: AgentId[];
  description: string;
  suggestion: string;
}

/**
 * Comprehensive conflict detection for agent specifications (planning phase)
 */
export function detectPlanConflicts(agents: AgentSpec[]): ConflictAnalysis {
  const conflicts: Conflict[] = [];
  const warnings: ConflictWarning[] = [];

  // 1. CIRCULAR DEPENDENCY DETECTION
  const circularDeps = detectCircularDependencies(agents);
  if (circularDeps.length > 0) {
    conflicts.push(...circularDeps.map(cycle => ({
      agents: cycle,
      description: `Circular dependency detected: ${cycle.join(' → ')} → ${cycle[0]}`,
      resolution: 'Remove or reorder dependencies to break the cycle'
    })));
  }

  // 2. CONTRADICTORY AGENT COMBINATIONS
  const contradictions = detectContradictoryAgents(agents);
  conflicts.push(...contradictions);

  // 3. EXECUTION ORDER VIOLATIONS
  const orderViolations = detectExecutionOrderViolations(agents);
  warnings.push(...orderViolations);

  // 4. RESOURCE CONTENTION (agents that might modify same resources)
  const resourceConflicts = detectResourceContention(agents);
  warnings.push(...resourceConflicts);

  return {
    conflicts,
    warnings,
    safe_to_execute: conflicts.length === 0
  };
}

/**
 * Conflict detection for execution results (coordination phase)
 */
export function detectExecutionConflicts(results: AgentResult[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // 1. OUTPUT CONFLICTS - Agents producing contradictory outputs
  const outputConflicts = detectOutputConflicts(results);
  conflicts.push(...outputConflicts);

  // 2. TESTING FAILURES - Implementation vs QA conflicts
  const testingConflicts = detectTestingConflicts(results);
  conflicts.push(...testingConflicts);

  // 3. ARCHITECTURE MISMATCHES - Design vs implementation conflicts
  const architectureConflicts = detectArchitectureConflicts(results);
  conflicts.push(...architectureConflicts);

  // 4. SECURITY CONFLICTS - Security findings vs implementation
  const securityConflicts = detectSecurityConflicts(results);
  conflicts.push(...securityConflicts);

  return conflicts;
}

/**
 * Detects circular dependencies using depth-first search
 * Can detect cycles of any length (A→B→C→A, etc.)
 */
function detectCircularDependencies(agents: AgentSpec[]): AgentId[][] {
  const cycles: AgentId[][] = [];
  const visited = new Set<AgentId>();
  const recursionStack = new Set<AgentId>();
  const path: AgentId[] = [];

  // Build adjacency list
  const graph = new Map<AgentId, AgentId[]>();
  for (const agent of agents) {
    graph.set(agent.agent_id, agent.dependencies || []);
  }

  // DFS to detect cycles
  function dfs(agentId: AgentId): boolean {
    if (recursionStack.has(agentId)) {
      // Found a cycle! Extract it from path
      const cycleStart = path.indexOf(agentId);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart));
      }
      return true;
    }

    if (visited.has(agentId)) {
      return false; // Already processed this node
    }

    visited.add(agentId);
    recursionStack.add(agentId);
    path.push(agentId);

    const dependencies = graph.get(agentId) || [];
    for (const dep of dependencies) {
      dfs(dep);
    }

    recursionStack.delete(agentId);
    path.pop();
    return false;
  }

  // Check all agents
  for (const agent of agents) {
    if (!visited.has(agent.agent_id)) {
      dfs(agent.agent_id);
    }
  }

  return cycles;
}

/**
 * Detects contradictory agent combinations
 */
function detectContradictoryAgents(agents: AgentSpec[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const agentIds = agents.map(a => a.agent_id);

  // Define mutually exclusive agent combinations
  const contradictions: Record<string, { agents: AgentId[]; reason: string; resolution: string }> = {
    'optimize_vs_debug': {
      agents: ['performance_optimizer', 'the_didact'],
      reason: 'Performance optimization may remove debug info that research needs',
      resolution: 'Run the_didact first to gather info before optimization'
    },
    'cleanup_vs_preserve': {
      agents: ['the_curator', 'the_cartographer'],
      reason: 'Cleanup may remove code that cartographer needs to document',
      resolution: 'Run the_cartographer first to document before cleanup'
    }
  };

  // Check for contradictory combinations
  for (const [key, contradiction] of Object.entries(contradictions)) {
    const hasAll = contradiction.agents.every(agentId => agentIds.includes(agentId));
    if (hasAll) {
      conflicts.push({
        agents: contradiction.agents,
        description: contradiction.reason,
        resolution: contradiction.resolution
      });
    }
  }

  // Check for conflicting priorities
  const criticalAgents = agents.filter(a => a.priority === 'critical');
  if (criticalAgents.length > 3) {
    conflicts.push({
      agents: criticalAgents.map(a => a.agent_id),
      description: `Too many critical priority agents (${criticalAgents.length}). This may indicate unclear prioritization.`,
      resolution: 'Review and adjust priorities. Not everything can be critical.'
    });
  }

  return conflicts;
}

/**
 * Detects execution order violations based on dependencies
 */
function detectExecutionOrderViolations(agents: AgentSpec[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];

  // Check for agents with dependencies that aren't in the plan
  for (const agent of agents) {
    if (!agent.dependencies || agent.dependencies.length === 0) continue;

    const agentIds = agents.map(a => a.agent_id);
    const missingDeps = agent.dependencies.filter(dep => !agentIds.includes(dep));

    if (missingDeps.length > 0) {
      warnings.push({
        type: 'execution_order',
        agents: [agent.agent_id, ...missingDeps],
        description: `${agent.agent_id} depends on ${missingDeps.join(', ')} which are not in the plan`,
        suggestion: `Add ${missingDeps.join(', ')} to the plan or remove the dependency`
      });
    }
  }

  // Check for dependency chains that are too long (>5 levels)
  const depthMap = calculateDependencyDepth(agents);
  for (const [agentId, depth] of depthMap.entries()) {
    if (depth > 5) {
      warnings.push({
        type: 'execution_order',
        agents: [agentId],
        description: `${agentId} has a very long dependency chain (${depth} levels deep)`,
        suggestion: 'Consider simplifying the dependency structure or using parallel execution'
      });
    }
  }

  return warnings;
}

/**
 * Detects potential resource contention between agents
 */
function detectResourceContention(agents: AgentSpec[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];

  // Agents that commonly modify the same resources
  const contentionGroups: Record<string, AgentId[]> = {
    'code_modification': ['hollowed_eyes', 'the_curator', 'the_cartographer'],
    'deployment': ['the_sentinel', 'the_curator'],
    'documentation': ['the_scribe', 'the_cartographer'],
    'testing': ['loveless', 'hollowed_eyes']
  };

  for (const [resource, groupAgents] of Object.entries(contentionGroups)) {
    const presentAgents = agents
      .filter(a => groupAgents.includes(a.agent_id))
      .map(a => a.agent_id);

    // If multiple agents in the same group are running in parallel
    if (presentAgents.length > 1) {
      const hasParallelExecution = presentAgents.some(agentId => {
        const agent = agents.find(a => a.agent_id === agentId);
        const deps = agent?.dependencies || [];
        // If this agent doesn't depend on the other agents in the group, it's parallel
        return !presentAgents.some(other => other !== agentId && deps.includes(other));
      });

      if (hasParallelExecution) {
        warnings.push({
          type: 'resource_contention',
          agents: presentAgents,
          description: `Agents ${presentAgents.join(', ')} may modify ${resource} simultaneously`,
          suggestion: 'Add dependencies to ensure sequential execution or verify they target different files'
        });
      }
    }
  }

  return warnings;
}

/**
 * Detects output conflicts in execution results
 */
function detectOutputConflicts(results: AgentResult[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check for contradictory conclusions
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const r1 = results[i];
      const r2 = results[j];

      // Skip if either failed
      if (!r1.success || !r2.success) continue;

      // Check for contradictory statements
      const contradictory = detectContradictoryOutputs(r1.output, r2.output);
      if (contradictory) {
        conflicts.push({
          agents: [r1.agent_id, r2.agent_id],
          description: `${r1.agent_id} and ${r2.agent_id} produced contradictory outputs`,
          resolution: 'Review both outputs and reconcile the contradiction'
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detects testing conflicts (implementation vs QA)
 */
function detectTestingConflicts(results: AgentResult[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const testing = results.find(r => r.agent_id === 'loveless');
  const implementation = results.find(r => r.agent_id === 'hollowed_eyes');

  if (testing && implementation && testing.success) {
    const testOutput = testing.output.toLowerCase();

    // Check for test failures
    if (
      testOutput.includes('fail') ||
      testOutput.includes('error') ||
      testOutput.includes('✗') ||
      /\d+\s+failing/.test(testOutput)
    ) {
      conflicts.push({
        agents: ['hollowed_eyes', 'loveless'],
        description: 'Implementation has issues detected by testing',
        resolution: 'hollowed_eyes should fix issues identified by loveless'
      });
    }

    // Check for security vulnerabilities
    if (
      testOutput.includes('vulnerability') ||
      testOutput.includes('security') ||
      testOutput.includes('cve')
    ) {
      conflicts.push({
        agents: ['hollowed_eyes', 'loveless'],
        description: 'Security issues detected in implementation',
        resolution: 'Address security vulnerabilities before deployment'
      });
    }
  }

  return conflicts;
}

/**
 * Detects architecture conflicts (design vs implementation)
 */
function detectArchitectureConflicts(results: AgentResult[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const architect = results.find(r => r.agent_id === 'the_architect');
  const implementation = results.find(r => r.agent_id === 'hollowed_eyes');

  if (architect && implementation && architect.success && implementation.success) {
    // Extract technologies mentioned
    const archTechs = extractTechnologies(architect.output);
    const implTechs = extractTechnologies(implementation.output);

    // Check for mismatches
    const onlyInArch = archTechs.filter(t => !implTechs.includes(t));
    if (onlyInArch.length > 0) {
      conflicts.push({
        agents: ['the_architect', 'hollowed_eyes'],
        description: `Architecture specified ${onlyInArch.join(', ')} but implementation may have used different approach`,
        resolution: 'Verify implementation follows architecture design'
      });
    }
  }

  return conflicts;
}

/**
 * Detects security conflicts
 */
function detectSecurityConflicts(results: AgentResult[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const security = results.find(r => r.agent_id === 'the_sentinel');
  const implementation = results.find(r => r.agent_id === 'hollowed_eyes');

  if (security && implementation && security.success) {
    const secOutput = security.output.toLowerCase();

    // Check for security issues
    if (
      secOutput.includes('vulnerability') ||
      secOutput.includes('insecure') ||
      secOutput.includes('exploit') ||
      secOutput.includes('critical')
    ) {
      conflicts.push({
        agents: ['hollowed_eyes', 'the_sentinel'],
        description: 'Security analysis found vulnerabilities in implementation',
        resolution: 'Fix security issues before deploying'
      });
    }
  }

  return conflicts;
}

/**
 * Helper: Calculate dependency depth for each agent
 */
function calculateDependencyDepth(agents: AgentSpec[]): Map<AgentId, number> {
  const depthMap = new Map<AgentId, number>();
  const graph = new Map<AgentId, AgentId[]>();

  // Build graph
  for (const agent of agents) {
    graph.set(agent.agent_id, agent.dependencies || []);
  }

  // Calculate depth using topological sort
  function getDepth(agentId: AgentId, visited: Set<AgentId> = new Set()): number {
    if (depthMap.has(agentId)) {
      return depthMap.get(agentId)!;
    }

    if (visited.has(agentId)) {
      return 0; // Circular dependency, return 0 to avoid infinite loop
    }

    visited.add(agentId);
    const deps = graph.get(agentId) || [];

    if (deps.length === 0) {
      depthMap.set(agentId, 0);
      return 0;
    }

    const maxDepth = Math.max(...deps.map(dep => getDepth(dep, new Set(visited))));
    const depth = maxDepth + 1;
    depthMap.set(agentId, depth);
    return depth;
  }

  for (const agent of agents) {
    getDepth(agent.agent_id);
  }

  return depthMap;
}

/**
 * Helper: Extract technology names from text
 */
function extractTechnologies(text: string): string[] {
  const techPatterns = [
    /\b(react|vue|angular|svelte|next\.?js|nuxt|remix)\b/gi,
    /\b(typescript|javascript|python|rust|go|java|ruby)\b/gi,
    /\b(postgres|mysql|mongodb|redis|sqlite)\b/gi,
    /\b(docker|kubernetes|vercel|netlify|aws|azure|gcp)\b/gi,
    /\b(graphql|rest|grpc|websocket)\b/gi,
    /\b(jest|vitest|cypress|playwright|mocha)\b/gi
  ];

  const techs = new Set<string>();
  for (const pattern of techPatterns) {
    const matches = text.match(pattern) || [];
    matches.forEach(m => techs.add(m.toLowerCase()));
  }

  return Array.from(techs);
}

/**
 * Helper: Detect contradictory outputs
 */
function detectContradictoryOutputs(output1: string, output2: string): boolean {
  const lower1 = output1.toLowerCase();
  const lower2 = output2.toLowerCase();

  // Look for contradictory statements
  const contradictions = [
    // One says yes, other says no
    { positive: /\b(yes|correct|true|valid|works|safe)\b/, negative: /\b(no|incorrect|false|invalid|broken|unsafe)\b/ },
    // One recommends, other warns against
    { positive: /\b(recommend|should use|best to)\b/, negative: /\b(avoid|should not|don't use)\b/ },
    // One says ready, other says not ready
    { positive: /\b(ready|complete|finished|done)\b/, negative: /\b(not ready|incomplete|unfinished|todo)\b/ }
  ];

  for (const { positive, negative } of contradictions) {
    const hasPositive1 = positive.test(lower1);
    const hasNegative1 = negative.test(lower1);
    const hasPositive2 = positive.test(lower2);
    const hasNegative2 = negative.test(lower2);

    // If one output is positive and the other is negative
    if ((hasPositive1 && hasNegative2) || (hasNegative1 && hasPositive2)) {
      return true;
    }
  }

  return false;
}
