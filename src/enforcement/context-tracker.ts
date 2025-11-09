/**
 * Server-side Context Tracker
 * 
 * Estimates Claude's context usage based on tool call history.
 * Never exposed to Claude - enforcement rules stay server-side.
 */

import type { FileRead, FileWrite } from './rules.js';

export class ContextTracker {
  private sessionTokens: number = 0;
  private recentReads: FileRead[] = [];
  private recentWrites: FileWrite[] = [];
  
  // Track session start for time-based windows
  private sessionStart: number = Date.now();
  
  /**
   * Estimate tokens from tool call
   * 
   * Rough heuristics:
   * - Read: ~1 token per 4 chars (approximation)
   * - Write: ~1 token per 4 chars
   * - Tool call overhead: ~100 tokens
   */
  recordToolCall(toolName: string, args: any, response?: any): void {
    let estimatedTokens = 100; // Base overhead
    
    switch (toolName) {
      case 'Read':
        if (response && response.content) {
          const content = typeof response.content === 'string' 
            ? response.content 
            : JSON.stringify(response.content);
          
          estimatedTokens += Math.ceil(content.length / 4);
          
          // Track read for enforcement rules
          const lineCount = content.split('\n').length;
          this.recentReads.push({
            path: args.file_path || args.path || 'unknown',
            lineCount,
            timestamp: Date.now()
          });
        }
        break;
        
      case 'Write':
      case 'Edit':
        const content = args.content || args.new_string || '';
        estimatedTokens += Math.ceil(content.length / 4);
        
        // Track write for enforcement rules
        const lineCount = content.split('\n').length;
        this.recentWrites.push({
          path: args.file_path || args.path || 'unknown',
          lineCount,
          timestamp: Date.now()
        });
        break;
        
      case 'Bash':
        // Command and output
        if (args.command) {
          estimatedTokens += Math.ceil(args.command.length / 4);
        }
        if (response && response.stdout) {
          estimatedTokens += Math.ceil(response.stdout.length / 4);
        }
        if (response && response.stderr) {
          estimatedTokens += Math.ceil(response.stderr.length / 4);
        }
        break;
        
      case 'Glob':
      case 'Grep':
        if (response && response.matches) {
          const matchesStr = JSON.stringify(response.matches);
          estimatedTokens += Math.ceil(matchesStr.length / 4);
        }
        break;
        
      default:
        // Generic: estimate from args + response
        const argsStr = JSON.stringify(args);
        estimatedTokens += Math.ceil(argsStr.length / 4);
        
        if (response) {
          const responseStr = JSON.stringify(response);
          estimatedTokens += Math.ceil(responseStr.length / 4);
        }
    }
    
    this.sessionTokens += estimatedTokens;
  }
  
  /**
   * Get current session context estimate
   */
  getSessionTokens(): number {
    return this.sessionTokens;
  }
  
  /**
   * Get recent reads in time window
   */
  getRecentReads(windowMs: number = 60000): FileRead[] {
    const cutoff = Date.now() - windowMs;
    return this.recentReads.filter(r => r.timestamp >= cutoff);
  }
  
  /**
   * Get recent writes in time window
   */
  getRecentWrites(windowMs: number = 60000): FileWrite[] {
    const cutoff = Date.now() - windowMs;
    return this.recentWrites.filter(w => w.timestamp >= cutoff);
  }
  
  /**
   * Reset session (e.g., after successful delegation)
   */
  reset(): void {
    this.sessionTokens = 0;
    this.recentReads = [];
    this.recentWrites = [];
    this.sessionStart = Date.now();
  }
  
  /**
   * Cleanup old reads/writes (prevent memory leak)
   */
  cleanup(maxAgeMs: number = 300000): void {
    const cutoff = Date.now() - maxAgeMs;
    this.recentReads = this.recentReads.filter(r => r.timestamp >= cutoff);
    this.recentWrites = this.recentWrites.filter(w => w.timestamp >= cutoff);
  }
}
