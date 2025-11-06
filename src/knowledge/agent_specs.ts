import type { AgentCapability, AgentId } from '../types.js';
import { agentRegistry } from './agent_registry.js';
import { AGENT_CAPABILITIES } from './agent_capabilities.js';

// Re-export for backwards compatibility
export { AGENT_CAPABILITIES };

export function selectAgents(requirements: string[]): AgentId[] {
  const selected = new Set<AgentId>();
  
  for (const requirement of requirements) {
    const req = requirement.toLowerCase();
    
    // Match agents based on capabilities and use cases
    for (const [agentId, spec] of Object.entries(AGENT_CAPABILITIES)) {
      const matches = 
        spec.capabilities.some(cap => req.includes(cap.replace(/_/g, ' '))) ||
        spec.typical_use_cases.some(useCase => req.includes(useCase.replace(/_/g, ' '))) ||
        req.includes(spec.specialization.replace(/_/g, ' '));
      
      if (matches) {
        selected.add(agentId as AgentId);
      }
    }
  }
  
  // Always include loveless for implementation tasks
  if (selected.has('hollowed_eyes')) {
    selected.add('loveless');
  }
  
  return Array.from(selected);
}

export function estimateTokens(agents: AgentId[]): number {
  return agents.reduce((total, agentId) => {
    return total + AGENT_CAPABILITIES[agentId].avg_token_usage;
  }, 0);
}

/**
 * Registry-aware version of selectAgents - uses learned agents + hardcoded defaults
 */
export async function selectAgentsFromRegistry(requirements: string[]): Promise<AgentId[]> {
  const allAgents = await agentRegistry.getAllAgents();
  const selected = new Set<AgentId>();

  for (const requirement of requirements) {
    const req = requirement.toLowerCase();

    // Match agents based on capabilities and use cases
    for (const [agentId, spec] of Object.entries(allAgents)) {
      const matches =
        spec.capabilities.some(cap => req.includes(cap.replace(/_/g, ' '))) ||
        spec.typical_use_cases.some(useCase => req.includes(useCase.replace(/_/g, ' '))) ||
        req.includes(spec.specialization.replace(/_/g, ' '));

      if (matches) {
        selected.add(agentId as AgentId);
      }
    }
  }

  // Always include loveless for implementation tasks
  if (selected.has('hollowed_eyes')) {
    selected.add('loveless');
  }

  return Array.from(selected);
}

/**
 * Registry-aware version of estimateTokens - uses learned token averages
 */
export async function estimateTokensFromRegistry(agents: AgentId[]): Promise<number> {
  let total = 0;
  for (const agentId of agents) {
    const agent = await agentRegistry.getAgent(agentId);
    if (agent) {
      total += agent.avg_token_usage;
    }
  }
  return total;
}

/**
 * Get agent spec from registry (with learned data merged in)
 */
export async function getAgentSpec(agentId: AgentId): Promise<AgentCapability | null> {
  return await agentRegistry.getAgent(agentId);
}
