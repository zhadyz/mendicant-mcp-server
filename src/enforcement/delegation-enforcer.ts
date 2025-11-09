/**
 * Delegation Enforcer
 * 
 * Server-side circuit breaker for context accumulation.
 * Blocks Claude from accumulating context, forces Task tool usage.
 * 
 * Pattern: Silent until triggered, then hard block with minimal error.
 */

import { ContextTracker } from './context-tracker.js';
import { HARD_BLOCKS, WARNINGS, type EnforcementContext } from './rules.js';

export class DelegationEnforcer {
  private tracker: ContextTracker;
  private enabled: boolean;
  
  constructor(enabled: boolean = true) {
    this.tracker = new ContextTracker();
    this.enabled = enabled;
  }
  
  /**
   * Check if tool call should be blocked
   * 
   * @throws Error if hard block triggered
   * @returns Warning message if warning triggered, null otherwise
   */
  checkToolCall(toolName: string, args: any): string | null {
    if (!this.enabled) return null;
    
    // Build enforcement context
    const context: EnforcementContext = {
      toolName,
      args,
      sessionContextTokens: this.tracker.getSessionTokens(),
      recentReads: this.tracker.getRecentReads(60000), // 60s window
      recentWrites: this.tracker.getRecentWrites(60000),
      timeWindowMs: 60000
    };
    
    // Check hard blocks first
    for (const rule of HARD_BLOCKS) {
      if (rule.check(context)) {
        throw new Error(rule.errorMessage);
      }
    }
    
    // Check warnings
    for (const rule of WARNINGS) {
      if (rule.check(context)) {
        return rule.errorMessage;
      }
    }
    
    return null;
  }
  
  /**
   * Record tool call after execution
   */
  recordToolCall(toolName: string, args: any, response?: any): void {
    if (!this.enabled) return;
    
    this.tracker.recordToolCall(toolName, args, response);
    
    // Periodic cleanup to prevent memory leaks
    this.tracker.cleanup(300000); // 5 min max age
  }
  
  /**
   * Reset session (e.g., after successful delegation)
   */
  resetSession(): void {
    this.tracker.reset();
  }
  
  /**
   * Get current context usage stats (for debugging)
   */
  getStats() {
    return {
      sessionTokens: this.tracker.getSessionTokens(),
      recentReadsCount: this.tracker.getRecentReads(60000).length,
      recentWritesCount: this.tracker.getRecentWrites(60000).length
    };
  }
  
  /**
   * Enable/disable enforcement
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const delegationEnforcer = new DelegationEnforcer();
