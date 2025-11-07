#!/usr/bin/env node

// CRITICAL: Write to log file IMMEDIATELY before any imports to catch early failures
import { writeFileSync, appendFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const DEBUG_LOG_EARLY = join(tmpdir(), 'mendicant-debug.log');
try {
  writeFileSync(DEBUG_LOG_EARLY, `${new Date().toISOString()} [CRITICAL] Module execution started - BEFORE imports\n`, { flag: 'a' });
} catch (e) {
  // Can't even write to log - this is catastrophic
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type Tool
} from '@modelcontextprotocol/sdk/types.js';

// DASHBOARD INTEGRATION: Use instrumented wrappers instead of direct imports
import { createPlan } from './instrumented_planner.js';
import { coordinateResults } from './instrumented_coordinator.js';
import { analyzeProject } from './analyzer.js';
import { agentRegistry } from './knowledge/agent_registry.js';
import type { ProjectContext, Constraints, AgentResult, AgentFeedback, AgentCapability } from './types.js';

// PHASE 3: Retry Orchestration
import { RetryOrchestrator, type RetryStrategy, type PlanContext } from './orchestration/retry_orchestrator.js';

// DASHBOARD INTEGRATION: Import dashboard components
import { createDashboardBridge } from './events/dashboard_bridge.js';
import { createDashboardLauncher } from './events/dashboard_launcher.js';
import { orchestrationEvents } from './events/event_emitter.js';

// Debug: File-based logging
const DEBUG_LOG = join(tmpdir(), 'mendicant-debug.log');
function debugLog(msg: string) {
  const timestamp = new Date().toISOString();
  try {
    appendFileSync(DEBUG_LOG, `${timestamp} ${msg}\n`);
  } catch (e) {
    // Ignore write errors
  }
  console.error(msg);
}

// Debug: Module loading
debugLog('[DEBUG] index.ts module loading - START');
debugLog(`[DEBUG] agentRegistry imported: ${typeof agentRegistry}`);

/**
 * Mendicant MCP Server with Dashboard Integration
 *
 * Provides orchestration intelligence for the mendicant_bias distributed agent system.
 * This server does NOT execute agents - it provides planning and coordination logic
 * that Claude Code uses to orchestrate agent execution.
 *
 * NEW: Auto-launches dashboard and provides real-time event streaming via SSE.
 */

const server = new Server(
  {
    name: 'mendicant-mcp-server',
    version: '0.5.0', // Version bump for dashboard integration
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// PHASE 3: Initialize Retry Orchestrator
const retryOrchestrator = new RetryOrchestrator();
debugLog('[DEBUG] RetryOrchestrator instantiated');

// DASHBOARD INTEGRATION: Initialize dashboard components
const dashboardBridge = createDashboardBridge();
const dashboardLauncher = createDashboardLauncher();

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
    description: 'Synthesize and coordinate results from multiple spawned agents. Call this after agents complete to get unified output, conflict resolution, and recommendations. Optionally pass plan and project_context for Mahoraga adaptive learning.',
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
        },
        plan: {
          type: 'object',
          description: 'Optional orchestration plan from mendicant_plan for Mahoraga learning'
        },
        project_context: {
          type: 'object',
          description: 'Optional project context for Mahoraga learning'
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
  },
  {
    name: 'mendicant_predict_agents',
    description: 'Use Mahoraga adaptive intelligence to predict agent success rates for an objective. Returns predictive scores with confidence levels based on similar past executions. Use this before spawning agents to make informed decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of agent IDs to score'
        },
        objective: {
          type: 'string',
          description: 'The objective to predict for'
        },
        context: {
          type: 'object',
          description: 'Optional project context for better predictions'
        }
      },
      required: ['agent_ids', 'objective']
    }
  },
  {
    name: 'mendicant_analyze_failure',
    description: 'Use Mahoraga failure analysis to understand WHY an agent failed. Returns rich failure context with learned avoidance rules and suggested fixes based on similar past failures.',
    inputSchema: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          description: 'The objective that was being attempted'
        },
        failed_agent_id: {
          type: 'string',
          description: 'ID of the agent that failed'
        },
        error: {
          type: 'string',
          description: 'Error message from the failed agent'
        },
        preceding_agents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of agent IDs that ran before the failure'
        },
        context: {
          type: 'object',
          description: 'Optional project context'
        }
      },
      required: ['objective', 'failed_agent_id', 'error', 'preceding_agents']
    }
  },
  {
    name: 'mendicant_refine_plan',
    description: 'Use Mahoraga adaptive refinement to improve a failed orchestration plan. Returns suggested changes and a refined plan based on analysis of similar successful patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        original_plan: {
          type: 'object',
          description: 'The orchestration plan that failed'
        },
        failure_context: {
          type: 'object',
          description: 'Failure context from mendicant_analyze_failure'
        },
        objective: {
          type: 'string',
          description: 'The original objective'
        },
        project_context: {
          type: 'object',
          description: 'Optional project context'
        }
      },
      required: ['original_plan', 'failure_context', 'objective']
    }
  },
  {
    name: 'mendicant_find_patterns',
    description: 'Use Mahoraga pattern recognition to find similar successful executions. Returns pattern matches with similarity scores and recommended agents based on past successes.',
    inputSchema: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          description: 'The objective to find patterns for'
        },
        context: {
          type: 'object',
          description: 'Optional project context for better matching'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of patterns to return (default: 10)'
        }
      },
      required: ['objective']
    }
  },
  {
    name: 'mendicant_execute_with_retry',
    description: 'Execute task with automatic retry and sequential fallback. PHASE 3 feature: Intelligent retry mechanism that learns from failures and selects fallback agents when primary agents fail. Uses quality thresholds and learns patterns for future recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          description: 'The objective to accomplish'
        },
        context: {
          type: 'object',
          description: 'Optional project context',
          properties: {
            project_type: {
              type: 'string',
              description: 'Type of project (e.g., "nextjs", "python")'
            },
            has_tests: {
              type: 'boolean',
              description: 'Whether project has tests'
            }
          }
        },
        strategy: {
          type: 'object',
          description: 'Optional retry strategy configuration',
          properties: {
            maxAttempts: {
              type: 'number',
              description: 'Maximum number of attempts (default: 3)'
            },
            fallbackScoreThreshold: {
              type: 'number',
              description: 'Minimum score for fallback agents (default: 0.5)'
            },
            timeout: {
              type: 'number',
              description: 'Task timeout in milliseconds'
            },
            learnFromFailure: {
              type: 'boolean',
              description: 'Whether to record failures for learning (default: true)'
            }
          }
        }
      },
      required: ['objective']
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
        debugLog('[DEBUG] mendicant_plan tool called');
        const { objective, context, constraints, past_executions } = args as {
          objective: string;
          context?: ProjectContext;
          constraints?: Constraints;
          past_executions?: any[];
        };
        debugLog(`[DEBUG] objective: ${objective}`);
        debugLog(`[DEBUG] context: ${JSON.stringify(context)}`);

        // NOTE: createPlan is now instrumented and emits events automatically
        const plan = await createPlan(objective, context, constraints, past_executions);
        debugLog(`[DEBUG] plan created, agents: ${plan.agents.length}`);
        debugLog(`[DEBUG] plan agents: ${JSON.stringify(plan.agents.map(a => a.agent_id))}`);

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
        const { objective, agent_results, plan, project_context } = args as {
          objective: string;
          agent_results: AgentResult[];
          plan?: any;
          project_context?: ProjectContext;
        };

        // NOTE: coordinateResults is now instrumented and emits events automatically
        const coordination = await coordinateResults(objective, agent_results, plan, project_context);

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

      case 'mendicant_predict_agents': {
        const { agent_ids, objective, context } = args as unknown as {
          agent_ids: string[];
          objective: string;
          context?: ProjectContext;
        };

        const { mahoraga } = await import('./knowledge/mahoraga.js');
        const predictions = mahoraga.predictAgents(agent_ids, objective, context);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(predictions, null, 2)
            }
          ]
        };
      }

      case 'mendicant_analyze_failure': {
        const { objective, failed_agent_id, error, preceding_agents, context } = args as unknown as {
          objective: string;
          failed_agent_id: string;
          error: string;
          preceding_agents: string[];
          context?: ProjectContext;
        };

        const { mahoraga } = await import('./knowledge/mahoraga.js');
        const analysis = mahoraga.analyzeFailure(
          objective,
          failed_agent_id,
          error,
          preceding_agents,
          context
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2)
            }
          ]
        };
      }

      case 'mendicant_refine_plan': {
        const { original_plan, failure_context, objective, project_context } = args as unknown as {
          original_plan: any;
          failure_context: any;
          objective: string;
          project_context?: ProjectContext;
        };

        const { mahoraga } = await import('./knowledge/mahoraga.js');
        const refinement = await mahoraga.refinePlan(
          original_plan,
          failure_context,
          objective,
          project_context
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(refinement, null, 2)
            }
          ]
        };
      }

      case 'mendicant_find_patterns': {
        const { objective, context, limit } = args as unknown as {
          objective: string;
          context?: ProjectContext;
          limit?: number;
        };

        const { mahoraga } = await import('./knowledge/mahoraga.js');
        const patterns = mahoraga.findSimilarSuccessfulPatterns(
          objective,
          context,
          limit || 10
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(patterns, null, 2)
            }
          ]
        };
      }

      case 'mendicant_execute_with_retry': {
        debugLog('[DEBUG] mendicant_execute_with_retry tool called');
        const { objective, context, strategy } = args as unknown as {
          objective: string;
          context?: ProjectContext;
          strategy?: Partial<RetryStrategy>;
        };

        // Initialize retry orchestrator if not already done
        if (!retryOrchestrator) {
          throw new Error('RetryOrchestrator not initialized');
        }

        await retryOrchestrator.initialize();

        const planContext: PlanContext = {
          objective,
          project_context: context
        };

        // Create a mock task executor for demonstration
        // In real usage, this would spawn the actual agent
        const taskExecutor = async (agent: AgentCapability) => {
          debugLog(`[MCP] Executing task with agent: ${agent.name}`);
          return { success: true, agent: agent.name };
        };

        const result = await retryOrchestrator.executeWithRetry(
          planContext,
          taskExecutor,
          strategy
        );

        debugLog(`[DEBUG] Retry result: success=${result.success}, attempts=${result.attemptNumber}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
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
 * Start the server with dashboard integration
 */
async function main() {
  debugLog('[DEBUG] main() function called');

  // DASHBOARD INTEGRATION: Start dashboard bridge first
  try {
    await dashboardBridge.start();
    debugLog('[DEBUG] Dashboard bridge started successfully');
  } catch (error) {
    console.error('[ERROR] Failed to start dashboard bridge:', error);
    debugLog('[ERROR] Dashboard bridge failed, continuing without dashboard');
  }

  // DASHBOARD INTEGRATION: Auto-launch dashboard if enabled
  if (dashboardLauncher.getStatus().running === false) {
    try {
      await dashboardLauncher.start();
      debugLog('[DEBUG] Dashboard launched successfully');
    } catch (error) {
      console.error('[ERROR] Failed to launch dashboard:', error);
      debugLog('[ERROR] Dashboard launch failed, continuing without dashboard UI');
    }
  }

  // Start MCP server
  const transport = new StdioServerTransport();
  debugLog('[DEBUG] StdioServerTransport created');
  await server.connect(transport);
  debugLog('[DEBUG] Server connected to transport');

  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  debugLog('Mendicant MCP Server running on stdio');
  debugLog('[DEBUG] Checking agentRegistry getAllAgents at startup...');
  const agents = await agentRegistry.getAllAgents();
  debugLog(`[DEBUG] Agents at startup: ${Object.keys(agents).length}`);
  debugLog(`[DEBUG] Agent IDs: ${Object.keys(agents).join(', ')}`);
  debugLog(`[DEBUG] Debug log file: ${DEBUG_LOG}`);

  // Log dashboard status
  const dashboardStatus = dashboardLauncher.getStatus();
  debugLog(`[DEBUG] Dashboard status: ${JSON.stringify(dashboardStatus)}`);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  debugLog('[DEBUG] SIGINT received, shutting down...');
  await dashboardLauncher.stop();
  await dashboardBridge.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  debugLog('[DEBUG] SIGTERM received, shutting down...');
  await dashboardLauncher.stop();
  await dashboardBridge.stop();
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
