import type { OrchestrationPlan, ProjectContext, Constraints, AgentSpec, AgentId } from './types.js';
import { selectAgentsFromRegistry, estimateTokensFromRegistry, getAgentSpec } from './knowledge/agent_specs.js';
import { matchPattern } from './knowledge/patterns.js';
import type { PastExecution } from './integration/mnemosyne.js';
import { findSimilarExecutions, shouldReusePattern, recommendAgents } from './integration/mnemosyne.js';
import { mahoraga } from './knowledge/mahoraga.js';

/**
 * Creates an orchestration plan for a given objective
 * 
 * Strategy:
 * 1. Check mnemosyne for similar past executions (if provided)
 * 2. Try to match against common patterns
 * 3. Generate custom plan if no pattern matches
 */
export async function createPlan(
  objective: string,
  context?: ProjectContext,
  constraints?: Constraints,
  pastExecutions?: PastExecution[]
): Promise<OrchestrationPlan> {
  
  // 1. Try to reuse a proven pattern from past executions
  if (pastExecutions && pastExecutions.length > 0) {
    const similarExecutions = findSimilarExecutions(objective, pastExecutions);
    
    for (const pastExec of similarExecutions) {
      if (shouldReusePattern(pastExec, objective)) {
        return {
          ...pastExec.plan,
          reasoning: `Reusing proven pattern from past successful execution. Success rate: ${pastExec.metadata.success_rate}`
        };
      }
    }
  }
  
  // 2. Try to match against common patterns
  const pattern = matchPattern(objective);
  if (pattern) {
    const plan = pattern.generatePlan(context);
    return {
      ...plan,
      reasoning: `Matched common pattern: ${pattern.name}. ${plan.reasoning || ''}`
    };
  }
  
  // 3. Generate custom plan
  return generateCustomPlan(objective, context, constraints, pastExecutions);
}

/**
 * Generates a custom orchestration plan from scratch
 */
async function generateCustomPlan(
  objective: string,
  context?: ProjectContext,
  constraints?: Constraints,
  pastExecutions?: PastExecution[]
): Promise<OrchestrationPlan> {

  // Analyze objective to determine required capabilities
  const requiredCapabilities = analyzeObjective(objective);

  // Select agents based on capabilities (using registry)
  let agents = await selectAgentsFromRegistry(requiredCapabilities);

  // Consider recommendations from past executions
  if (pastExecutions && pastExecutions.length > 0) {
    const recommended = recommendAgents(objective, pastExecutions);
    if (recommended.length > 0) {
      // Merge with selected agents, preferring recommended ones
      agents = [...new Set([...recommended, ...agents])];
    }
  }

  // Use Mahoraga predictive intelligence to rank agents by predicted success
  const predictiveScores = mahoraga.predictAgents(agents, objective, context);

  // Sort agents by predicted success rate (highest first)
  agents = predictiveScores
    .sort((a, b) => b.predicted_success_rate - a.predicted_success_rate)
    .map(score => score.agent_id);

  // Apply constraints
  if (constraints?.max_agents && agents.length > constraints.max_agents) {
    agents = agents.slice(0, constraints.max_agents);
  }

  // Create agent specs with prompts (async now)
  const agentSpecs: AgentSpec[] = await Promise.all(
    agents.map(agentId => createAgentSpec(agentId, objective, context))
  );

  // Determine execution strategy
  const execution_strategy = determineExecutionStrategy(agentSpecs, constraints);

  // Build phases if phased execution
  const phases = execution_strategy === 'phased'
    ? buildPhases(agentSpecs)
    : undefined;

  // Estimate tokens using registry
  const estimated_tokens = await estimateTokensFromRegistry(agents);

  // Build reasoning with Mahoraga insights
  let reasoning = `Custom plan generated for objective. Selected agents based on required capabilities: ${requiredCapabilities.join(', ')}.`;

  if (predictiveScores.length > 0) {
    const topAgent = predictiveScores[0];
    reasoning += ` Mahoraga predictive intelligence ranked agents by success probability. Top agent: ${topAgent.agent_id} (${(topAgent.predicted_success_rate * 100).toFixed(0)}% predicted success, confidence: ${(topAgent.confidence * 100).toFixed(0)}%).`;

    if (topAgent.historical_performance.similar_objectives > 0) {
      reasoning += ` Based on ${topAgent.historical_performance.similar_objectives} similar past executions.`;
    }
  }

  return {
    agents: agentSpecs,
    execution_strategy,
    phases,
    success_criteria: deriveSuccessCriteria(objective),
    estimated_tokens,
    reasoning
  };
}

/**
 * Analyzes objective to determine what capabilities are needed
 */
function analyzeObjective(objective: string): string[] {
  const lower = objective.toLowerCase();
  const capabilities: string[] = [];
  
  // Implementation/coding keywords
  if (lower.includes('implement') || lower.includes('code') || lower.includes('develop') || 
      lower.includes('create') || lower.includes('build') || lower.includes('add')) {
    capabilities.push('code_implementation', 'github_operations');
  }
  
  // Testing/QA keywords
  if (lower.includes('test') || lower.includes('verify') || lower.includes('check') || 
      lower.includes('validate')) {
    capabilities.push('test_execution', 'quality_assurance');
  }
  
  // Security keywords
  if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('audit')) {
    capabilities.push('security_validation', 'vulnerability_scanning');
  }
  
  // Architecture/design keywords
  if (lower.includes('design') || lower.includes('architecture') || lower.includes('structure')) {
    capabilities.push('architecture_design', 'design_patterns');
  }
  
  // Research keywords
  if (lower.includes('research') || lower.includes('investigate') || lower.includes('explore')) {
    capabilities.push('documentation_research', 'investigation');
  }
  
  // Documentation keywords
  if (lower.includes('document') || lower.includes('readme') || lower.includes('docs')) {
    capabilities.push('technical_writing', 'api_documentation');
  }
  
  // Deployment keywords
  if (lower.includes('deploy') || lower.includes('release') || lower.includes('publish')) {
    capabilities.push('deployment_automation', 'release_preparation');
  }
  
  // Maintenance keywords
  if (lower.includes('update') || lower.includes('upgrade') || lower.includes('cleanup') || 
      lower.includes('refactor')) {
    capabilities.push('dependency_updates', 'code_organization');
  }
  
  // CI/CD keywords
  if (lower.includes('ci') || lower.includes('cd') || lower.includes('pipeline') || 
      lower.includes('workflow')) {
    capabilities.push('github_actions', 'testing_automation');
  }
  
  // Design/UI keywords
  if (lower.includes('design system') || lower.includes('ui') || lower.includes('ux') || 
      lower.includes('style')) {
    capabilities.push('visual_design', 'ui_ux_design');
  }
  
  // Infrastructure keywords
  if (lower.includes('infrastructure') || lower.includes('docker') || lower.includes('vercel')) {
    capabilities.push('vercel_deployment', 'docker_orchestration');
  }
  
  // If no specific capabilities detected, add general ones
  if (capabilities.length === 0) {
    capabilities.push('code_implementation', 'quality_assurance');
  }
  
  return capabilities;
}

/**
 * Creates an agent spec with optimized prompt
 */
async function createAgentSpec(
  agentId: AgentId,
  objective: string,
  context?: ProjectContext
): Promise<AgentSpec> {
  const spec = await getAgentSpec(agentId);
  if (!spec) {
    throw new Error(`Agent ${agentId} not found in registry`);
  }

  const dependencies: string[] = [];

  // Determine dependencies
  if (agentId === 'loveless' && objective.toLowerCase().includes('implement')) {
    dependencies.push('hollowed_eyes');
  }
  if (agentId === 'hollowed_eyes' && objective.toLowerCase().includes('architecture')) {
    dependencies.push('the_architect');
  }
  if (agentId === 'the_scribe' && (objective.toLowerCase().includes('implement') ||
      objective.toLowerCase().includes('feature'))) {
    dependencies.push('hollowed_eyes');
  }

  // Generate optimized prompt
  const prompt = await generatePrompt(agentId, objective, spec.specialization, context);

  // Determine priority
  const priority = determinePriority(agentId, objective);

  return {
    agent_id: agentId,
    task_description: `${spec.specialization.replace(/_/g, ' ')} for: ${objective}`,
    prompt,
    dependencies,
    priority
  };
}

/**
 * Generates optimized prompt for an agent
 */
async function generatePrompt(
  agentId: AgentId,
  objective: string,
  specialization: string,
  context?: ProjectContext
): Promise<string> {
  const spec = await getAgentSpec(agentId);
  if (!spec) {
    throw new Error(`Agent ${agentId} not found in registry`);
  }

  let prompt = `You are ${agentId}, specialist in ${specialization.replace(/_/g, ' ')}.\n\n`;
  prompt += `Objective: ${objective}\n\n`;

  if (context?.project_type) {
    prompt += `Project Type: ${context.project_type}\n`;
  }

  prompt += `\nYour responsibilities:\n`;
  for (const capability of spec.capabilities) {
    prompt += `- ${capability.replace(/_/g, ' ')}\n`;
  }

  prompt += `\nFocus on your specialization and deliver high-quality work.`;

  // Add specific guidance based on agent
  if (agentId === 'loveless') {
    prompt += `\n\nREMEMBER: You must verify thoroughly. Nothing broken ships on your watch.`;
  } else if (agentId === 'hollowed_eyes') {
    prompt += `\n\nREMEMBER: Write clean, maintainable code following best practices.`;
  } else if (agentId === 'the_architect') {
    prompt += `\n\nREMEMBER: Simplicity is sophisticated. Design for change, not perfection.`;
  }

  return prompt;
}

/**
 * Determines priority for an agent based on objective
 */
function determinePriority(agentId: AgentId, objective: string): 'critical' | 'high' | 'medium' | 'low' {
  const lower = objective.toLowerCase();
  
  // loveless is always critical for verification
  if (agentId === 'loveless') {
    return 'critical';
  }
  
  // Implementation agents are critical for implementation objectives
  if (agentId === 'hollowed_eyes' && 
      (lower.includes('implement') || lower.includes('fix') || lower.includes('create'))) {
    return 'critical';
  }
  
  // Security work is always critical
  if (lower.includes('security') || lower.includes('vulnerability')) {
    return 'critical';
  }
  
  // Architecture is high priority for new projects/features
  if (agentId === 'the_architect' && 
      (lower.includes('new') || lower.includes('scaffold') || lower.includes('feature'))) {
    return 'high';
  }
  
  // Documentation is medium priority by default
  if (agentId === 'the_scribe') {
    return 'medium';
  }
  
  return 'high';
}

/**
 * Determines execution strategy based on agent dependencies
 */
function determineExecutionStrategy(
  agents: AgentSpec[],
  constraints?: Constraints
): 'sequential' | 'parallel' | 'phased' {
  
  if (constraints?.prefer_parallel) {
    return 'parallel';
  }
  
  // Check if any agents have dependencies
  const hasDependencies = agents.some(a => a.dependencies.length > 0);
  
  if (!hasDependencies) {
    return 'parallel';
  }
  
  // If there are clear phases (design -> implement -> verify), use phased
  const hasDesignPhase = agents.some(a => a.agent_id === 'the_architect' || a.agent_id === 'the_didact');
  const hasImplementPhase = agents.some(a => a.agent_id === 'hollowed_eyes');
  const hasVerifyPhase = agents.some(a => a.agent_id === 'loveless');
  
  if (hasDesignPhase && hasImplementPhase && hasVerifyPhase) {
    return 'phased';
  }
  
  return 'sequential';
}

/**
 * Builds phases for phased execution
 */
function buildPhases(agents: AgentSpec[]): any[] {
  const phases: any[] = [];
  
  // Phase 1: Research & Design (can run in parallel)
  const designAgents = agents.filter(a => 
    a.agent_id === 'the_architect' || 
    a.agent_id === 'the_didact' || 
    a.agent_id === 'the_scribe'
  );
  if (designAgents.length > 0) {
    phases.push({
      phase_name: 'Research & Design',
      agents: designAgents.map(a => a.agent_id),
      can_run_parallel: true
    });
  }
  
  // Phase 2: Implementation (sequential)
  const implAgents = agents.filter(a => 
    a.agent_id === 'hollowed_eyes' || 
    a.agent_id === 'the_curator' || 
    a.agent_id === 'cinna'
  );
  if (implAgents.length > 0) {
    phases.push({
      phase_name: 'Implementation',
      agents: implAgents.map(a => a.agent_id),
      can_run_parallel: false
    });
  }
  
  // Phase 3: Verification & Deployment (sequential)
  const verifyAgents = agents.filter(a => 
    a.agent_id === 'loveless' || 
    a.agent_id === 'zhadyz' || 
    a.agent_id === 'the_sentinel' ||
    a.agent_id === 'the_cartographer'
  );
  if (verifyAgents.length > 0) {
    phases.push({
      phase_name: 'Verification & Deployment',
      agents: verifyAgents.map(a => a.agent_id),
      can_run_parallel: false
    });
  }
  
  return phases;
}

/**
 * Derives success criteria from objective
 */
function deriveSuccessCriteria(objective: string): string {
  const lower = objective.toLowerCase();
  
  if (lower.includes('test')) {
    return 'All tests pass, no regressions introduced';
  }
  if (lower.includes('security')) {
    return 'All vulnerabilities fixed, security audit passes';
  }
  if (lower.includes('deploy') || lower.includes('release')) {
    return 'Successfully deployed, all checks pass';
  }
  if (lower.includes('implement') || lower.includes('feature')) {
    return 'Feature implemented, tested, and documented';
  }
  if (lower.includes('fix') || lower.includes('bug')) {
    return 'Bug fixed and verified';
  }
  if (lower.includes('scaffold') || lower.includes('setup')) {
    return 'Project scaffolded, builds successfully, documentation complete';
  }
  
  return 'Objective completed successfully with verification';
}
