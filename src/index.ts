#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type Tool
} from '@modelcontextprotocol/sdk/types.js';

import { createPlan } from './planner.js';
import { coordinateResults } from './coordinator.js';
import { analyzeProject } from './analyzer.js';
import { agentRegistry } from './knowledge/agent_registry.js';
import type { ProjectContext, Constraints, AgentResult, AgentFeedback } from './types.js';

/**
 * Mendicant MCP Server
 * 
 * Provides orchestration intelligence for the mendicant_bias distributed agent system.
 * This server does NOT execute agents - it provides planning and coordination logic
 * that Claude Code uses to orchestrate agent execution.
 */

const server = new Server(
  {
    name: 'mendicant-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Define available tools
 */
const TOOLS: Tool[] = [
  {
    name: 'mendicant_plan',
    description: 'Create strategic orchestration plan for an objective. Returns which agents to spawn, in what order, with optimized prompts. Use this before spawning agents to get intelligent guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          description: 'The user\'s objective/goal to accomplish'
        },
        context: {
          type: 'object',
          description: 'Optional project context',
          properties: {
            project_type: { 
              type: 'string',
              description: 'Type of project (e.g., "nextjs", "python", "rust")'
            },
            has_tests: { 
              type: 'boolean',
              description: 'Whether project has tests'
            },
            linear_issues: { 
              type: 'array',
              description: 'Array of Linear issues'
            },
            recent_errors: { 
              type: 'array',
              description: 'Array of recent errors'
            }
          }
        },
        constraints: {
          type: 'object',
          description: 'Optional constraints on orchestration',
          properties: {
            max_agents: { 
              type: 'number',
              description: 'Maximum number of agents to use'
            },
            prefer_parallel: { 
              type: 'boolean',
              description: 'Whether to prefer parallel execution'
            },
            max_tokens: {
              type: 'number',
              description: 'Maximum token budget'
            }
          }
        },
        past_executions: {
          type: 'array',
          description: 'Optional array of past execution records from mnemosyne for learning'
        }
      },
      required: ['objective']
    }
  },
  {
    name: 'mendicant_coordinate',
    description: 'Synthesize and coordinate results from multiple spawned agents. Call this after agents complete to get unified output, conflict resolution, and recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          description: 'The original objective that was executed'
        },
        agent_results: {
          type: 'array',
          description: 'Array of results from spawned agents',
          items: {
            type: 'object',
            properties: {
              agent_id: { 
                type: 'string',
                description: 'ID of the agent (e.g., "hollowed_eyes")'
              },
              output: { 
                type: 'string',
                description: 'Agent\'s output/response'
              },
              success: { 
                type: 'boolean',
                description: 'Whether agent succeeded'
              },
              duration_ms: { 
                type: 'number',
                description: 'How long agent took in milliseconds'
              },
              tokens_used: { 
                type: 'number',
                description: 'Tokens used by agent'
              }
            },
            required: ['agent_id', 'output', 'success']
          }
        }
      },
      required: ['objective', 'agent_results']
    }
  },
  {
    name: 'mendicant_analyze',
    description: 'Analyze current project health and get recommendations. Use this to proactively identify issues and determine what needs fixing.',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'object',
          description: 'Project context for analysis',
          properties: {
            git_status: {
              type: 'string',
              description: 'Output of git status'
            },
            test_results: {
              type: 'object',
              description: 'Test results (passed, failed, total, coverage, etc.)'
            },
            build_status: {
              type: 'string',
              description: 'Build status (success, failure, warnings)'
            },
            linear_issues: {
              type: 'array',
              description: 'Array of Linear issues'
            },
            recent_commits: {
              type: 'array',
              description: 'Array of recent git commits'
            },
            recent_errors: {
              type: 'array',
              description: 'Array of recent errors'
            }
          }
        }
      },
      required: ['context']
    }
  },
  {
    name: 'mendicant_record_feedback',
    description: 'Record feedback from agent execution for passive learning. The system learns from agent performance to improve future recommendations. Call this after agent execution with results.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'ID of the agent that executed'
        },
        success: {
          type: 'boolean',
          description: 'Whether the agent succeeded'
        },
        tokens_used: {
          type: 'number',
          description: 'Tokens used by the agent'
        },
        duration_ms: {
          type: 'number',
          description: 'Execution time in milliseconds'
        },
        error: {
          type: 'string',
          description: 'Error message if agent failed'
        }
      },
      required: ['agent_id', 'success']
    }
  },
  {
    name: 'mendicant_discover_agents',
    description: 'Register newly discovered agents at runtime. Use this to teach the system about custom agents you have available.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of agent IDs to register'
        }
      },
      required: ['agent_ids']
    }
  },
  {
    name: 'mendicant_list_learned_agents',
    description: 'List all learned agents with their performance statistics. Shows both hardcoded defaults and dynamically discovered agents.',
    inputSchema: {
      type: 'object',
      properties: {
        ranked: {
          type: 'boolean',
          description: 'Whether to rank by success rate (default: false)'
        }
      }
    }
  }
];

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'mendicant_plan': {
        const { objective, context, constraints, past_executions } = args as {
          objective: string;
          context?: ProjectContext;
          constraints?: Constraints;
          past_executions?: any[];
        };

        const plan = await createPlan(objective, context, constraints, past_executions);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plan, null, 2)
            }
          ]
        };
      }

      case 'mendicant_coordinate': {
        const { objective, agent_results } = args as {
          objective: string;
          agent_results: AgentResult[];
        };

        const coordination = await coordinateResults(objective, agent_results);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(coordination, null, 2)
            }
          ]
        };
      }

      case 'mendicant_analyze': {
        const { context } = args as {
          context: ProjectContext;
        };

        const analysis = analyzeProject(context);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2)
            }
          ]
        };
      }

      case 'mendicant_record_feedback': {
        const feedback = args as unknown as AgentFeedback;

        await agentRegistry.recordFeedback(feedback);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Feedback recorded for agent ${feedback.agent_id}`
              })
            }
          ]
        };
      }

      case 'mendicant_discover_agents': {
        const { agent_ids } = args as unknown as { agent_ids: string[] };

        await agentRegistry.discoverAgents(agent_ids);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Discovered ${agent_ids.length} agent(s): ${agent_ids.join(', ')}`,
                agents: agent_ids
              })
            }
          ]
        };
      }

      case 'mendicant_list_learned_agents': {
        const { ranked } = (args as unknown as { ranked?: boolean }) || {};

        const agents = ranked
          ? await agentRegistry.getRankedAgents()
          : await agentRegistry.getAllAgents();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(agents, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  console.error('Mendicant MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
