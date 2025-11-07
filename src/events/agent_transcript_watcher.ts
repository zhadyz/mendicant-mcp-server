/**
 * Agent Transcript Watcher
 *
 * Monitors Claude Code's agent transcript files to capture agent thinking, tool use, and outputs
 * in real-time. Emits events to the dashboard for full transparency into agent operations.
 */

import { watch, promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { orchestrationEvents, OrchestrationEventType } from './event_emitter.js';

/**
 * Format of JSONL agent transcript lines
 */
interface AgentTranscriptLine {
  parentUuid: string | null;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  sessionId: string;
  version: string;
  gitBranch: string;
  agentId: string;
  type: 'user' | 'assistant';
  message: {
    role: 'user' | 'assistant';
    content: Array<{
      type: 'text' | 'tool_use' | 'tool_result';
      text?: string;
      id?: string;
      name?: string;
      input?: any;
      content?: string;
      tool_use_id?: string;
    }>;
  };
  uuid: string;
  timestamp: string;
}

/**
 * Tracks agent transcript files and streams their content
 */
export class AgentTranscriptWatcher {
  private projectsDir: string;
  private watchedFiles: Map<string, { lastPosition: number; agent_id: string }> = new Map();
  private watchTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    // Claude Code stores projects in ~/.claude/projects/
    const claudeDir = join(homedir(), '.claude');
    this.projectsDir = join(claudeDir, 'projects');
  }

  /**
   * Start watching for agent transcripts
   */
  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.error('[AgentWatcher] Starting agent transcript monitoring...');

    // Poll for new agent files every 500ms
    this.watchTimer = setInterval(() => this.scanForNewAgents(), 500);

    // Initial scan
    await this.scanForNewAgents();
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
    this.isRunning = false;
    console.error('[AgentWatcher] Stopped agent transcript monitoring');
  }

  /**
   * Scan for new agent transcript files
   */
  private async scanForNewAgents() {
    try {
      // Find all project directories
      const projects = await fs.readdir(this.projectsDir);

      for (const project of projects) {
        const projectPath = join(this.projectsDir, project);
        try {
          const files = await fs.readdir(projectPath);

          // Find agent-*.jsonl files
          const agentFiles = files.filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'));

          for (const agentFile of agentFiles) {
            const fullPath = join(projectPath, agentFile);
            await this.watchAgentFile(fullPath);
          }
        } catch (err) {
          // Skip directories we can't read
        }
      }
    } catch (err) {
      // Projects directory doesn't exist yet
    }
  }

  /**
   * Start watching a specific agent transcript file
   */
  private async watchAgentFile(filePath: string) {
    // Extract agent ID from filename (agent-<hash>.jsonl)
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const agentId = fileName.replace('agent-', '').replace('.jsonl', '');

    // Check if already watching
    if (this.watchedFiles.has(filePath)) {
      // Read new content since last position
      await this.readNewLines(filePath, agentId);
      return;
    }

    // Start watching this file
    console.error(`[AgentWatcher] Started watching agent ${agentId}`);
    this.watchedFiles.set(filePath, { lastPosition: 0, agent_id: agentId });

    // Read initial content
    await this.readNewLines(filePath, agentId);
  }

  /**
   * Read new lines from agent transcript file
   */
  private async readNewLines(filePath: string, agentId: string) {
    try {
      const state = this.watchedFiles.get(filePath);
      if (!state) return;

      // Get file size
      const stats = await fs.stat(filePath);
      const currentSize = stats.size;

      // If file hasn't grown, nothing to do
      if (currentSize <= state.lastPosition) {
        return;
      }

      // Read new content
      const fd = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(currentSize - state.lastPosition);
      await fd.read(buffer, 0, buffer.length, state.lastPosition);
      await fd.close();

      // Update position
      state.lastPosition = currentSize;

      // Parse new lines
      const content = buffer.toString('utf8');
      const lines = content.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const data: AgentTranscriptLine = JSON.parse(line);
          await this.processTranscriptLine(data, agentId);
        } catch (err) {
          // Skip malformed lines
        }
      }
    } catch (err) {
      // File might have been deleted or is inaccessible
      this.watchedFiles.delete(filePath);
    }
  }

  /**
   * Process a single transcript line and emit appropriate events
   */
  private async processTranscriptLine(data: AgentTranscriptLine, agentId: string) {
    const timestamp = new Date(data.timestamp).getTime();
    const sessionId = data.sessionId;

    // Process based on message type
    if (data.type === 'user' && data.message.role === 'user') {
      // Initial agent objective
      const content = data.message.content.find(c => c.type === 'text');
      if (content?.text) {
        orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_EXECUTION_STARTED, {
          timestamp,
          session_id: sessionId,
          agent_id: agentId,
          agent_index: 0,
          total_agents: 1,
          task_description: content.text.substring(0, 200) // First 200 chars
        });
      }
    } else if (data.type === 'assistant' && data.message.role === 'assistant') {
      // Agent thinking or tool use
      for (const block of data.message.content) {
        if (block.type === 'text' && block.text) {
          // Agent thinking
          this.emitAgentThinking(agentId, sessionId, timestamp, block.text);
        } else if (block.type === 'tool_use' && block.name) {
          // Agent tool use
          this.emitAgentToolUse(agentId, sessionId, timestamp, block.name, block.input);
        }
      }
    } else if (data.type === 'user' && data.message.content) {
      // Tool results
      for (const block of data.message.content) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          this.emitAgentToolResult(agentId, sessionId, timestamp, block.tool_use_id, block.content);
        }
      }
    }
  }

  /**
   * Emit agent thinking event
   */
  private emitAgentThinking(agentId: string, sessionId: string, timestamp: number, text: string) {
    orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_THINKING, {
      timestamp,
      session_id: sessionId,
      agent_id: agentId,
      thinking: text
    } as any);
  }

  /**
   * Emit agent tool use event
   */
  private emitAgentToolUse(
    agentId: string,
    sessionId: string,
    timestamp: number,
    toolName: string,
    toolInput: any
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_TOOL_USE, {
      timestamp,
      session_id: sessionId,
      agent_id: agentId,
      tool_name: toolName,
      tool_input: toolInput
    } as any);
  }

  /**
   * Emit agent tool result event
   */
  private emitAgentToolResult(
    agentId: string,
    sessionId: string,
    timestamp: number,
    toolUseId: string,
    result: any
  ) {
    orchestrationEvents.emitEvent(OrchestrationEventType.AGENT_TOOL_RESULT, {
      timestamp,
      session_id: sessionId,
      agent_id: agentId,
      tool_use_id: toolUseId,
      result: typeof result === 'string' ? result.substring(0, 500) : result // Truncate long results
    } as any);
  }
}

/**
 * Global singleton instance
 */
export const agentTranscriptWatcher = new AgentTranscriptWatcher();
