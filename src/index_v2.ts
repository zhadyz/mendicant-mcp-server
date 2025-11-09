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

import { createPlan } from './planner.js';
import { coordinateResults } from './coordinator.js';
import { analyzeProject } from './analyzer.js';
import { agentRegistry } from './knowledge/agent_registry.js';
import type { ProjectContext, Constraints, AgentResult, AgentFeedback, AgentCapability } from './types.js';

// PHASE 3: Retry Orchestration
import { RetryOrchestrator, type RetryStrategy, type PlanContext } from './orchestration/retry_orchestrator.js';

// V2: Delegation Enforcement
import { delegationEnforcer } from './enforcement/delegation-enforcer.js';

// Dashboard Integration
import { createDashboardBridge } from './events/dashboard_bridge.js';
import { createDashboardLauncher } from './events/dashboard_launcher.js';
import { agentTranscriptWatcher } from './events/agent_transcript_watcher.js';

// Event Instrumentation
import { InstrumentedWrapper } from './events/instrumentation.js';

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

// V2: Check if enforcement is disabled via env var
const ENFORCEMENT_DISABLED = process.env.MENDICANT_DISABLE_DELEGATION_ENFORCEMENT === 'true';
if (ENFORCEMENT_DISABLED) {
  debugLog('[ENFORCEMENT] Delegation enforcement DISABLED via environment variable');
  delegationEnforcer.setEnabled(false);
} else {
  debugLog('[ENFORCEMENT] Delegation enforcement ENABLED');
}

/**
 * Mendicant MCP Server V2
 *
 * Provides orchestration intelligence for the mendicant_bias distributed agent system.
 * This server does NOT execute agents - it provides planning and coordination logic
 * that Claude Code uses to orchestrate agent execution.
 * 
 * V2 Features:
 * - Server-side delegation enforcement (context accumulation prevention)
 * - Minimal error responses for hard blocks
 * - Warning system for approaching limits
 */

const server = new Server(
  {
    name: 'mendicant-mcp-server',
    version: '0.7.0', // V2 version
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

/**
 * Define available tools
 * 
 * V2: Added delegation enforcement tools
 */
const TOOLS: Tool[] = [
  // ... (all existing tools remain the same, will add V2 tools below)
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
  
  // V2: NEW - Delegation enforcement tools
  {
    name: 'mendicant_track_context',
    description: 'INTERNAL: Track agent tool call for context usage estimation. Called by MENDICANT_BIAS after agents execute filesystem/code tools. Server-side enforcement only.',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Name of the tool that was called (Read, Write, Edit, Bash, etc.)'
        },
        args: {
          type: 'object',
          description: 'Arguments passed to the tool'
        },
        response: {
          type: 'object',
          description: 'Optional response from the tool for context estimation'
        }
      },
      required: ['tool_name', 'args']
    }
  },
  {
    name: 'mendicant_check_delegation',
    description: 'INTERNAL: Check if next operation would trigger delegation enforcement. Returns null if OK, throws error if blocked, or returns warning string. Server-side enforcement only.',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Name of the tool about to be called'
        },
        args: {
          type: 'object',
          description: 'Arguments for the tool'
        }
      },
      required: ['tool_name', 'args']
    }
  },
  {
    name: 'mendicant_reset_enforcement',
    description: 'INTERNAL: Reset delegation enforcement session after successful task delegation. Called by MENDICANT_BIAS when spawning specialized agent.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'mendicant_get_enforcement_stats',
    description: 'INTERNAL: Get current enforcement statistics for debugging. Shows session token count and recent operation counts.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  
  // ... rest of existing tools (coordinate, analyze, etc.)
];

// Add remaining existing tools
TOOLS.push(
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
  }
  // ... (rest of tools continue as before)
);

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

/**
 * Handle tool calls
 * 
 * V2: Added delegation enforcement handlers
 */
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    // V2: Delegation enforcement tools
    if (name === 'mendicant_track_context') {
      const { tool_name, args: toolArgs, response } = args as {
        tool_name: string;
        args: any;
        response?: any;
      };
      
      delegationEnforcer.recordToolCall(tool_name, toolArgs, response);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true })
        }]
      };
    }
    
    if (name === 'mendicant_check_delegation') {
      const { tool_name, args: toolArgs } = args as {
        tool_name: string;
        args: any;
      };
      
      // This will throw if blocked, return warning string if warning, null if OK
      const warning = delegationEnforcer.checkToolCall(tool_name, toolArgs);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            blocked: false,
            warning: warning || null
          })
        }]
      };
    }
    
    if (name === 'mendicant_reset_enforcement') {
      delegationEnforcer.resetSession();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, message: 'Enforcement session reset' })
        }]
      };
    }
    
    if (name === 'mendicant_get_enforcement_stats') {
      const stats = delegationEnforcer.getStats();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(stats, null, 2)
        }]
      };
    }
    
    // ... (existing tool handlers continue as before)
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

        // Wrap with instrumentation for dashboard events
        const plan = await InstrumentedWrapper.wrapPlanCreation(
          objective,
          context,
          constraints,
          async () => {
            const result = await createPlan(objective, context, constraints, past_executions);
            debugLog(`[DEBUG] plan created, agents: ${result.agents.length}`);
            debugLog(`[DEBUG] plan agents: ${JSON.stringify(result.agents.map(a => a.agent_id))}`);
            return result;
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plan, null, 2)
            }
          ]
        };
      }

      // ... (rest of handlers continue as before)

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
  debugLog('[DEBUG] main() function called - V2 with delegation enforcement');
  const transport = new StdioServerTransport();
  debugLog('[DEBUG] StdioServerTransport created');
  await server.connect(transport);
  debugLog('[DEBUG] Server connected to transport');

  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  debugLog('Mendicant MCP Server V2 running on stdio');
  debugLog(`[DEBUG] Delegation enforcement: ${!ENFORCEMENT_DISABLED ? 'ENABLED' : 'DISABLED'}`);
  debugLog('[DEBUG] Checking agentRegistry getAllAgents at startup...');
  const agents = await agentRegistry.getAllAgents();
  debugLog(`[DEBUG] Agents at startup: ${Object.keys(agents).length}`);
  debugLog(`[DEBUG] Agent IDs: ${Object.keys(agents).join(', ')}`);
  debugLog(`[DEBUG] Debug log file: ${DEBUG_LOG}`);

  // Initialize Dashboard Infrastructure
  try {
    debugLog('[Dashboard] Initializing dashboard infrastructure...');

    // Start SSE bridge server (port 3001)
    const dashboardBridge = createDashboardBridge({
      port: parseInt(process.env.DASHBOARD_BRIDGE_PORT || '3001', 10),
      host: '127.0.0.1',
      cors_origin: '*'
    });
    await dashboardBridge.start();
    debugLog(`[Dashboard] SSE bridge started on port ${dashboardBridge.getPort()}`)

    // Start agent transcript watcher
    await agentTranscriptWatcher.start();
    debugLog('[Dashboard] Agent transcript watcher started');

    // Start Next.js dashboard (port 3000)
    const dashboardLauncher = createDashboardLauncher({
      autoStart: process.env.MENDICANT_AUTO_LAUNCH_DASHBOARD !== 'false',
      port: parseInt(process.env.DASHBOARD_PORT || '3000', 10)
    });

    if (process.env.MENDICANT_AUTO_LAUNCH_DASHBOARD !== 'false') {
      await dashboardLauncher.start();
      debugLog(`[Dashboard] Next.js dashboard started on port ${dashboardLauncher.getPort()}`)

      // Auto-open browser to dashboard (cross-platform)
      if (process.env.MENDICANT_AUTO_OPEN_BROWSER !== 'false') {
        const dashboardUrl = `http://localhost:${process.env.DASHBOARD_PORT || '3000'}/realtime`;
        debugLog(`[Dashboard] Opening browser to ${dashboardUrl}`);

        const { exec } = await import('child_process');
        const openCommand = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${openCommand} ${dashboardUrl}`, (error) => {
          if (error) {
            debugLog(`[Dashboard] Failed to auto-open browser: ${error.message}`);
          }
        });
      }
    } else {
      debugLog('[Dashboard] Auto-launch disabled via MENDICANT_AUTO_LAUNCH_DASHBOARD=false');
    }

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      debugLog(`[Shutdown] Received ${signal}, shutting down gracefully...`);
      try {
        await dashboardLauncher.stop();
        await dashboardBridge.stop();
        agentTranscriptWatcher.stop();
        debugLog('[Shutdown] Dashboard infrastructure stopped');
        process.exit(0);
      } catch (error) {
        debugLog(`[Shutdown] Error during shutdown: ${error}`);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    debugLog(`[Dashboard] Failed to initialize dashboard: ${error}`);
    debugLog('[Dashboard] MCP server will continue without dashboard');
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
