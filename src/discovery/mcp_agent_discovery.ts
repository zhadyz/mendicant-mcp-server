/**
 * MCP Agent Discovery
 *
 * Dynamically discovers agents available in current Claude Code session via MCP introspection.
 * Queries the environment for available subagent_types and extracts capabilities.
 *
 * Discovery Strategy:
 * 1. Parse available subagent_types from Claude context (if exposed)
 * 2. Extract specializations from agent descriptions
 * 3. Infer capabilities from agent names (pattern matching)
 * 4. Map to domain/task_type/intent compatibility
 */

import type { AgentCapability, AgentId } from '../types.js';
import {
  parseAgentFromDescription,
  categorizeAgent,
  normalizeAgentCapability,
  type RawAgentInfo,
  type AgentCategory
} from './agent_capability_parser.js';

/**
 * Well-known agent IDs from Claude Code
 * These are discovered through documentation and runtime observation
 */
const KNOWN_AGENT_IDS: AgentId[] = [
  // Core agents (always available)
  'hollowed_eyes',
  'loveless',
  'the_architect',
  'the_didact',
  'the_scribe',
  'zhadyz',
  'the_curator',
  'the_sentinel',
  'the_oracle',
  'the_librarian',
  'the_analyst',
  'cinna',
  'the_cartographer',

  // Potential custom agents (may or may not exist)
  'the_guardian',
  'the_navigator',
  'the_sage',
  'the_artisan',
  'the_chronicler'
];

/**
 * Agent description templates for pattern matching
 */
const AGENT_DESCRIPTIONS: Record<AgentId, string> = {
  hollowed_eyes: 'Elite developer with semantic code search, GitHub operations, and implementation capabilities',
  loveless: 'QA and security specialist with cross-browser testing and vulnerability scanning',
  the_architect: 'System architect specializing in design patterns and technical decisions',
  the_didact: 'Research intelligence agent for documentation and competitive analysis',
  the_scribe: 'Technical writer for documentation, API docs, and user guides',
  zhadyz: 'DevOps specialist for CI/CD, deployment, and release automation',
  the_curator: 'Code maintenance expert for dependency updates and technical debt reduction',
  the_sentinel: 'CI/CD automation specialist for testing and deployment workflows',
  the_oracle: 'Strategic validation agent for risk assessment and outcome prediction',
  the_librarian: 'Requirements clarification specialist for vague requests',
  the_analyst: 'Data analyst for metrics visualization and business intelligence',
  cinna: 'Design systems and UI/UX specialist with visual design capabilities',
  the_cartographer: 'Infrastructure deployment specialist for Vercel and Docker'
};

/**
 * MCP Agent Discovery Service
 */
export class MCPAgentDiscovery {
  private discoveredAgents: Map<AgentId, AgentCapability> = new Map();
  private lastDiscoveryTime: number = 0;
  private discoveryInProgress = false;

  constructor() {
    // Auto-discover on instantiation
    this.discoverAvailableAgents().catch(err =>
      console.error('[MCPAgentDiscovery] Failed to auto-discover:', err)
    );
  }

  /**
   * Discover all available agents in current Claude Code session
   */
  async discoverAvailableAgents(): Promise<AgentCapability[]> {
    if (this.discoveryInProgress) {
      console.log('[MCPAgentDiscovery] Discovery already in progress');
      return Array.from(this.discoveredAgents.values());
    }

    this.discoveryInProgress = true;

    try {
      console.log('[MCPAgentDiscovery] Starting agent discovery...');

      // Strategy 1: Discover from known agent IDs
      const knownAgents = await this.discoverKnownAgents();

      // Strategy 2: Discover from environment (if available)
      const envAgents = await this.discoverFromEnvironment();

      // Strategy 3: Discover from MCP context (if available)
      const mcpAgents = await this.discoverFromMCPContext();

      // Merge all discovered agents
      const allAgents = [...knownAgents, ...envAgents, ...mcpAgents];

      // Deduplicate by agent ID
      const uniqueAgents = new Map<AgentId, AgentCapability>();
      for (const agent of allAgents) {
        if (!uniqueAgents.has(agent.name)) {
          uniqueAgents.set(agent.name, agent);
          this.discoveredAgents.set(agent.name, agent);
        }
      }

      this.lastDiscoveryTime = Date.now();

      console.log(`[MCPAgentDiscovery] Discovered ${uniqueAgents.size} agents`);

      return Array.from(uniqueAgents.values());
    } finally {
      this.discoveryInProgress = false;
    }
  }

  /**
   * Get a specific discovered agent by ID
   */
  getAgent(agentId: AgentId): AgentCapability | null {
    return this.discoveredAgents.get(agentId) || null;
  }

  /**
   * Get all discovered agents
   */
  getAllAgents(): AgentCapability[] {
    return Array.from(this.discoveredAgents.values());
  }

  /**
   * Check if discovery is stale and needs refresh
   */
  needsRefresh(intervalMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - this.lastDiscoveryTime > intervalMs;
  }

  /**
   * Clear discovered agents and force re-discovery
   */
  reset(): void {
    this.discoveredAgents.clear();
    this.lastDiscoveryTime = 0;
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: AgentCategory): AgentCapability[] {
    return Array.from(this.discoveredAgents.values()).filter(agent => {
      const agentCategory = categorizeAgent(agent.name, agent.specialization);
      return agentCategory === category;
    });
  }

  // Private discovery strategies

  /**
   * Strategy 1: Discover from known agent IDs
   */
  private async discoverKnownAgents(): Promise<AgentCapability[]> {
    const agents: AgentCapability[] = [];

    for (const agentId of KNOWN_AGENT_IDS) {
      const description = AGENT_DESCRIPTIONS[agentId] || '';

      const raw: RawAgentInfo = {
        agent_id: agentId,
        description,
        tools: this.inferToolsFromDescription(description),
        metadata: {
          source: 'known_agents',
          discovered_at: Date.now()
        }
      };

      const agent = parseAgentFromDescription(raw);
      agents.push(agent);
    }

    console.log(`[MCPAgentDiscovery] Discovered ${agents.length} known agents`);
    return agents;
  }

  /**
   * Strategy 2: Discover from environment variables
   */
  private async discoverFromEnvironment(): Promise<AgentCapability[]> {
    const agents: AgentCapability[] = [];

    try {
      // Check for CLAUDE_AGENTS environment variable (may not exist)
      const agentsEnv = process.env.CLAUDE_AGENTS;
      if (agentsEnv) {
        const agentIds = agentsEnv.split(',').map(s => s.trim());

        for (const agentId of agentIds) {
          if (agentId && !this.discoveredAgents.has(agentId)) {
            const raw: RawAgentInfo = {
              agent_id: agentId,
              description: `Custom agent: ${agentId}`,
              tools: [],
              metadata: {
                source: 'environment',
                discovered_at: Date.now()
              }
            };

            const agent = parseAgentFromDescription(raw);
            agents.push(agent);
          }
        }

        console.log(`[MCPAgentDiscovery] Discovered ${agents.length} agents from environment`);
      }
    } catch (err) {
      console.error('[MCPAgentDiscovery] Failed to discover from environment:', err);
    }

    return agents;
  }

  /**
   * Strategy 3: Discover from MCP context (if available)
   */
  private async discoverFromMCPContext(): Promise<AgentCapability[]> {
    const agents: AgentCapability[] = [];

    try {
      // MCP context discovery would query the MCP server for available tools/agents
      // This is a placeholder - actual implementation depends on MCP API availability

      // Example: If MCP exposed a listAgents() function
      // const mcpAgents = await mcp.listAgents();
      // for (const mcpAgent of mcpAgents) {
      //   const agent = parseAgentFromDescription(mcpAgent);
      //   agents.push(agent);
      // }

      console.log(`[MCPAgentDiscovery] Discovered ${agents.length} agents from MCP context`);
    } catch (err) {
      console.error('[MCPAgentDiscovery] Failed to discover from MCP:', err);
    }

    return agents;
  }

  /**
   * Infer tools from agent description
   */
  private inferToolsFromDescription(description: string): string[] {
    const tools: string[] = [];
    const descLower = description.toLowerCase();

    // Tool patterns
    const toolPatterns: Record<string, string> = {
      'github': 'mcp__github__*',
      'serena': 'mcp__serena__*',
      'semantic': 'mcp__serena__*',
      'browser': 'mcp__playwright__*',
      'playwright': 'mcp__playwright__*',
      'devtools': 'mcp__chrome-devtools__*',
      'mnemosyne': 'mcp__mnemosyne__*',
      'memory': 'mcp__mnemosyne__*',
      'knowledge': 'mcp__mnemosyne__*',
      'filesystem': 'mcp__filesystem__*',
      'file': 'mcp__filesystem__*',
      'context7': 'mcp__context7__*',
      'documentation': 'mcp__context7__*',
      'docker': 'mcp__docker__*',
      'container': 'mcp__docker__*',
      'vercel': 'mcp__vercel__*',
      'deploy': 'mcp__vercel__*',
      'canva': 'mcp__canva__*',
      'design': 'mcp__canva__*',
      'mermaid': 'mcp__mermaid__*',
      'diagram': 'mcp__mermaid__*',
      'pdf': 'mcp__pdf-tools__*',
      'google': 'mcp__google-workspace__*',
      'workspace': 'mcp__google-workspace__*',
      'stripe': 'mcp__stripe__*',
      'payment': 'mcp__stripe__*',
      'linear': 'mcp__linear-server__*',
      'project': 'mcp__linear-server__*'
    };

    for (const [pattern, tool] of Object.entries(toolPatterns)) {
      if (descLower.includes(pattern)) {
        tools.push(tool);
      }
    }

    // Remove duplicates
    return Array.from(new Set(tools));
  }
}

/**
 * Singleton instance for global agent discovery
 */
export const mcpAgentDiscovery = new MCPAgentDiscovery();
