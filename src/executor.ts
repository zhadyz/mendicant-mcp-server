import type { OrchestrationPlan, AgentResult, ProjectContext } from './types.js';
import { adaptiveExecutor } from './knowledge/adaptive_executor.js';
import { mahoraga } from './knowledge/mahoraga.js';

/**
 * EXECUTOR - The Bridge Between Planning and Reality
 *
 * This module enables Mendicant to actually execute agents via the Task tool,
 * closing the loop: plan → execute → learn → adapt
 *
 * Key responsibilities:
 * - Map agent_ids to Task tool subagent_types
 * - Execute agents in sequence or parallel as planned
 * - Collect results and performance metrics
 * - Handle failures gracefully with adaptive recovery
 * - Apply real-time plan optimization (Mahoraga-style)
 * - Return structured results for coordinator learning
 */

/**
 * Agent ID to Task configuration mapping
 * Each agent has a specialized prompt that leverages available tools
 */
const AGENT_TASK_CONFIGS: Record<string, {
  subagent_type: 'general-purpose' | 'Explore' | 'Plan';
  model?: 'sonnet' | 'haiku';
  basePrompt: string;
}> = {
  // DESIGN & RESEARCH PHASE
  the_architect: {
    subagent_type: 'Plan',
    model: 'sonnet',
    basePrompt: `You are The Architect - a strategic design agent.

Your role:
- Design system architectures and high-level solutions
- Create detailed technical specifications
- Identify design patterns and best practices
- Plan component interactions and data flows
- Consider scalability, maintainability, and extensibility

Use the Serena tools to understand the existing codebase architecture.
Use context7 to research best practices for relevant frameworks.
Provide a comprehensive design document as your output.`
  },

  the_didact: {
    subagent_type: 'Explore',
    model: 'sonnet',
    basePrompt: `You are The Didact - a research and learning specialist.

Your role:
- Research unfamiliar technologies and patterns
- Explain complex concepts clearly
- Find relevant documentation and examples
- Identify learning resources
- Create educational summaries

Use context7 extensively to fetch latest documentation.
Use WebSearch when needed for recent information.
Provide clear, educational explanations in your output.`
  },

  the_librarian: {
    subagent_type: 'Explore',
    model: 'haiku',
    basePrompt: `You are The Librarian - a codebase knowledge specialist.

Your role:
- Map and understand existing codebase structure
- Find relevant files, functions, and patterns
- Identify dependencies and relationships
- Document architectural patterns found
- Create knowledge maps of the codebase

Use Serena tools (especially Explore agent and symbolic search) to efficiently navigate the codebase.
Provide a structured map of relevant code in your output.`
  },

  // IMPLEMENTATION PHASE
  hollowed_eyes: {
    subagent_type: 'general-purpose',
    model: 'sonnet',
    basePrompt: `You are Hollowed Eyes - the primary implementation agent.

Your role:
- Write production-quality code
- Implement features according to specifications
- Follow existing code patterns and conventions
- Handle edge cases and error conditions
- Write clean, maintainable, well-documented code

Use Serena tools for code editing (prefer symbolic editing when possible).
Use context7 for framework-specific implementation patterns.
Use Read tool to understand existing implementations before coding.
Provide a summary of what was implemented in your output.`
  },

  the_curator: {
    subagent_type: 'general-purpose',
    model: 'haiku',
    basePrompt: `You are The Curator - a code quality and refactoring specialist.

Your role:
- Refactor code for better quality
- Improve code organization and structure
- Apply design patterns where beneficial
- Remove code smells and technical debt
- Enhance code readability

Use Serena symbolic tools to identify and refactor specific symbols.
Focus on improving existing code rather than adding features.
Provide a summary of refactoring improvements in your output.`
  },

  the_scribe: {
    subagent_type: 'general-purpose',
    model: 'haiku',
    basePrompt: `You are The Scribe - a documentation specialist.

Your role:
- Write clear, comprehensive documentation
- Create README files and guides
- Document APIs and interfaces
- Write inline code comments where needed
- Create usage examples

Use Serena tools to understand what needs documenting.
Use existing documentation patterns in the codebase.
Provide documentation in appropriate format (markdown, JSDoc, etc.) in your output.`
  },

  cinna: {
    subagent_type: 'general-purpose',
    model: 'haiku',
    basePrompt: `You are Cinna - a UI/UX implementation specialist.

Your role:
- Implement user interfaces
- Ensure responsive design
- Follow accessibility best practices
- Implement interactive components
- Handle form validation and user input

Use context7 for UI framework documentation.
Use existing UI patterns from the codebase.
Test UI implementations when possible.
Provide a summary of UI components created in your output.`
  },

  // VERIFICATION & DEPLOYMENT PHASE
  loveless: {
    subagent_type: 'general-purpose',
    model: 'sonnet',
    basePrompt: `You are Loveless - the primary testing and verification agent.

Your role:
- Write comprehensive test suites
- Test implementations thoroughly
- Run existing tests and identify failures
- Create test cases for edge cases
- Verify code quality and correctness

Use Bash tool to run tests (npm test, pytest, cargo test, etc.).
Use Serena tools to understand what needs testing.
Analyze test failures and provide actionable feedback.
Provide a test report with pass/fail status in your output.`
  },

  the_sentinel: {
    subagent_type: 'general-purpose',
    model: 'haiku',
    basePrompt: `You are The Sentinel - a CI/CD and deployment specialist.

Your role:
- Set up CI/CD pipelines
- Configure deployment automation
- Create build scripts and workflows
- Ensure deployment reliability
- Monitor deployment health

Use Bash tool to test build processes.
Create GitHub Actions, CircleCI, or other CI configs.
Verify build and deployment configurations.
Provide a summary of CI/CD setup in your output.`
  },

  zhadyz: {
    subagent_type: 'general-purpose',
    model: 'haiku',
    basePrompt: `You are Zhadyz - a DevOps and infrastructure specialist.

Your role:
- Configure development environments
- Set up Docker containers and orchestration
- Manage environment variables and secrets
- Configure databases and services
- Ensure reproducible builds

Use Bash tool to test configurations.
Create Docker files, docker-compose configs, etc.
Document infrastructure setup clearly.
Provide a summary of infrastructure setup in your output.`
  },

  the_cartographer: {
    subagent_type: 'Explore',
    model: 'haiku',
    basePrompt: `You are The Cartographer - a dependency and integration mapper.

Your role:
- Map dependencies and their relationships
- Identify integration points
- Find potential conflicts or issues
- Document external dependencies
- Create dependency graphs

Use Serena tools to explore the codebase structure.
Analyze package.json, requirements.txt, Cargo.toml, etc.
Identify outdated or problematic dependencies.
Provide a dependency map in your output.`
  },

  the_oracle: {
    subagent_type: 'Plan',
    model: 'sonnet',
    basePrompt: `You are The Oracle - a strategic validation and wisdom agent.

Your role:
- Validate strategic decisions
- Identify potential long-term issues
- Provide architectural guidance
- Review overall solution quality
- Suggest improvements and alternatives

Use Serena tools to understand the full context.
Consider long-term implications of decisions.
Provide high-level strategic feedback.
Provide wisdom and validation in your output.`
  }
};

/**
 * Executes an orchestration plan by spawning Task agents
 * Returns results suitable for coordinator learning
 */
export async function executePlan(
  objective: string,
  plan: OrchestrationPlan,
  taskToolExecutor: (description: string, prompt: string, subagentType: string, model?: string) => Promise<string>
): Promise<AgentResult[]> {

  console.log(`[Executor] Beginning ADAPTIVE execution: ${objective}`);
  console.log(`[Executor] Strategy: ${plan.execution_strategy}`);
  console.log(`[Executor] Initial agents: ${plan.agents.map(a => a.agent_id).join(', ')}`);

  // Initialize adaptive executor with the plan
  const executionPlan = {
    agents: plan.agents.map(a => a.agent_id),
    execution_strategy: plan.execution_strategy,
    phases: plan.phases?.map(p => p.phase_name),
    estimated_duration_ms: plan.agents.length * 30000, // Rough estimate: 30s per agent
    estimated_tokens: plan.estimated_tokens
  };

  await adaptiveExecutor.initialize(objective, executionPlan);

  const results: AgentResult[] = [];
  let agentsToExecute = plan.agents.map(a => a.agent_id);

  // Execute agents with adaptive loop
  while (agentsToExecute.length > 0) {
    const agentId = agentsToExecute[0];
    console.log(`\n[Executor] Executing: ${agentId} (${agentsToExecute.length} remaining)`);

    // Execute the agent
    const result = await executeAgent(agentId, objective, taskToolExecutor);
    results.push(result);

    // Process result through adaptive executor
    const executionState = await adaptiveExecutor.processAgentResult(result);

    // Log execution state
    console.log(`[Executor] State: ${executionState.status}`);
    if (executionState.adaptations.length > 0) {
      const lastAdaptation = executionState.adaptations[executionState.adaptations.length - 1];
      console.log(`[Executor] Adaptation: ${lastAdaptation.type} - ${lastAdaptation.reason}`);
    }

    // Handle different execution states
    if (executionState.status === 'recovering') {
      console.log(`[Executor] Recovery in progress for ${agentId}`);
      // Recovery strategy is already applied by adaptive executor
      // The plan in executionState.current_plan has been updated
      agentsToExecute = executionState.pending_agents;

    } else if (executionState.status === 'adapting') {
      console.log(`[Executor] Plan optimization in progress`);
      // Plan has been optimized, update our execution queue
      agentsToExecute = executionState.pending_agents;

    } else if (executionState.status === 'failed') {
      console.error(`[Executor] Execution failed - no recovery possible`);
      break;

    } else if (executionState.status === 'completed') {
      console.log(`[Executor] All agents completed successfully`);
      break;

    } else {
      // Status is 'running' - continue normally
      agentsToExecute.shift(); // Remove completed agent
    }

    // Safety check: prevent infinite loops
    if (results.length > plan.agents.length * 2) {
      console.error(`[Executor] Safety limit reached - possible infinite loop`);
      break;
    }
  }

  // Get final execution state and log summary
  const finalState = adaptiveExecutor.getExecutionState();
  console.log(`\n[Executor] ====== EXECUTION SUMMARY ======`);
  console.log(`[Executor] Status: ${finalState.status}`);
  console.log(`[Executor] Completed: ${finalState.completed_agents.length} agents`);
  console.log(`[Executor] Adaptations: ${finalState.adaptations.length}`);

  if (finalState.adaptations.length > 0) {
    console.log(`[Executor] Adaptation types: ${finalState.adaptations.map(a => a.type).join(', ')}`);
  }

  return results;
}

/**
 * Executes agents in a phase
 * Currently sequential, but could be parallelized for independent agents
 */
async function executePhase(
  agentIds: string[],
  objective: string,
  taskToolExecutor: (description: string, prompt: string, subagentType: string, model?: string) => Promise<string>
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];

  for (const agentId of agentIds) {
    const result = await executeAgent(agentId, objective, taskToolExecutor);
    results.push(result);

    console.log(`[Executor] ${agentId}: ${result.success ? '✓' : '✗'} (${result.duration_ms}ms, ${result.tokens_used} tokens)`);
  }

  return results;
}

/**
 * Executes a single agent via Task tool
 */
async function executeAgent(
  agentId: string,
  objective: string,
  taskToolExecutor: (description: string, prompt: string, subagentType: string, model?: string) => Promise<string>
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    const config = AGENT_TASK_CONFIGS[agentId];
    if (!config) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // Build full prompt
    const fullPrompt = `${config.basePrompt}\n\n## Objective\n${objective}\n\n## Instructions\nComplete your specialized role as described above. Provide clear, structured output.`;

    // Execute via Task tool
    console.log(`[Executor] Spawning ${agentId}...`);
    const output = await taskToolExecutor(
      `Execute ${agentId} for: ${objective.slice(0, 50)}...`,
      fullPrompt,
      config.subagent_type,
      config.model
    );

    const duration = Date.now() - startTime;

    // Estimate tokens (rough approximation)
    const estimatedTokens = Math.floor((fullPrompt.length + output.length) / 4);

    return {
      agent_id: agentId,
      success: true,
      output,
      tokens_used: estimatedTokens,
      duration_ms: duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Executor] ${agentId} failed:`, errorMessage);

    return {
      agent_id: agentId,
      success: false,
      output: `Error: ${errorMessage}`,
      tokens_used: 0,
      duration_ms: duration
    };
  }
}

/**
 * Determines if an agent failure should block subsequent phases
 */
function isCriticalAgent(agentId: string): boolean {
  // Architecture and primary implementation are critical
  return ['the_architect', 'hollowed_eyes'].includes(agentId);
}

/**
 * Validates that all agents in plan are known
 */
export function validatePlanAgents(plan: OrchestrationPlan): { valid: boolean; unknownAgents: string[] } {
  const allAgents = plan.phases
    ? plan.phases.flatMap(p => p.agents)
    : plan.agents.map(a => a.agent_id);
  const unknownAgents = allAgents.filter(id => !AGENT_TASK_CONFIGS[id]);

  return {
    valid: unknownAgents.length === 0,
    unknownAgents
  };
}

/**
 * Gets list of all known agent IDs
 */
export function getKnownAgentIds(): string[] {
  return Object.keys(AGENT_TASK_CONFIGS);
}
