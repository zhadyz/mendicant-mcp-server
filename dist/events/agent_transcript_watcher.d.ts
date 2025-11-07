/**
 * Agent Transcript Watcher
 *
 * Monitors Claude Code's agent transcript files to capture agent thinking, tool use, and outputs
 * in real-time. Emits events to the dashboard for full transparency into agent operations.
 */
/**
 * Tracks agent transcript files and streams their content
 */
export declare class AgentTranscriptWatcher {
    private projectsDir;
    private watchedFiles;
    private watchTimer;
    private isRunning;
    constructor();
    /**
     * Start watching for agent transcripts
     */
    start(): Promise<void>;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Scan for new agent transcript files
     */
    private scanForNewAgents;
    /**
     * Start watching a specific agent transcript file
     */
    private watchAgentFile;
    /**
     * Read new lines from agent transcript file
     */
    private readNewLines;
    /**
     * Process a single transcript line and emit appropriate events
     */
    private processTranscriptLine;
    /**
     * Emit agent thinking event
     */
    private emitAgentThinking;
    /**
     * Emit agent tool use event
     */
    private emitAgentToolUse;
    /**
     * Emit agent tool result event
     */
    private emitAgentToolResult;
}
/**
 * Global singleton instance
 */
export declare const agentTranscriptWatcher: AgentTranscriptWatcher;
//# sourceMappingURL=agent_transcript_watcher.d.ts.map