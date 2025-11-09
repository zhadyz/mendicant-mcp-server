/**
 * Delegation Enforcement Rules
 * 
 * CRITICAL: These rules stay server-side, never sent to Claude.
 * Enforcement is silent until triggered - circuit breaker pattern.
 */

export interface EnforcementRule {
  name: string;
  check: (context: EnforcementContext) => boolean;
  errorMessage: string;
  severity: 'block' | 'warn';
}

export interface EnforcementContext {
  toolName: string;
  args: any;
  sessionContextTokens: number;
  recentReads: FileRead[];
  recentWrites: FileWrite[];
  timeWindowMs: number;
}

export interface FileRead {
  path: string;
  lineCount: number;
  timestamp: number;
}

export interface FileWrite {
  path: string;
  lineCount: number;
  timestamp: number;
}

/**
 * Hard blocks - throw error immediately
 */
export const HARD_BLOCKS: EnforcementRule[] = [
  {
    name: 'large_write_block',
    severity: 'block',
    check: (ctx) => {
      if (ctx.toolName !== 'Write' && ctx.toolName !== 'Edit') return false;
      
      const content = ctx.args.content || ctx.args.new_string || '';
      const lineCount = content.split('\n').length;
      
      return lineCount > 200;
    },
    errorMessage: 'DELEGATION_REQUIRED: spawn the_scribe for large file operations (>200 lines)'
  },
  {
    name: 'multiple_large_reads_block',
    severity: 'block',
    check: (ctx) => {
      if (ctx.toolName !== 'Read') return false;
      
      const now = Date.now();
      const windowStart = now - ctx.timeWindowMs;
      
      const largeReadsInWindow = ctx.recentReads.filter(r => 
        r.lineCount > 500 && r.timestamp >= windowStart
      );
      
      // If we already have 2 large reads and this is a 3rd potential large read
      return largeReadsInWindow.length >= 2;
    },
    errorMessage: 'DELEGATION_REQUIRED: spawn the_architect for codebase exploration (3+ large reads)'
  },
  {
    name: 'context_overflow_block',
    severity: 'block',
    check: (ctx) => {
      return ctx.sessionContextTokens > 25000;
    },
    errorMessage: 'DELEGATION_REQUIRED: delegate current task to specialized agent (context >25k tokens)'
  }
];

/**
 * Warnings - add to response, don't block
 */
export const WARNINGS: EnforcementRule[] = [
  {
    name: 'medium_write_warning',
    severity: 'warn',
    check: (ctx) => {
      if (ctx.toolName !== 'Write' && ctx.toolName !== 'Edit') return false;
      
      const content = ctx.args.content || ctx.args.new_string || '';
      const lineCount = content.split('\n').length;
      
      return lineCount >= 100 && lineCount <= 200;
    },
    errorMessage: 'TIP: Consider delegating to preserve context (100-200 lines)'
  },
  {
    name: 'approaching_read_limit_warning',
    severity: 'warn',
    check: (ctx) => {
      if (ctx.toolName !== 'Read') return false;
      
      const now = Date.now();
      const windowStart = now - ctx.timeWindowMs;
      
      const largeReadsInWindow = ctx.recentReads.filter(r => 
        r.lineCount > 500 && r.timestamp >= windowStart
      );
      
      return largeReadsInWindow.length === 2;
    },
    errorMessage: 'WARNING: Next large read triggers delegation enforcement'
  },
  {
    name: 'approaching_context_limit_warning',
    severity: 'warn',
    check: (ctx) => {
      return ctx.sessionContextTokens >= 20000 && ctx.sessionContextTokens < 25000;
    },
    errorMessage: 'WARNING: Approaching context limit (25k)'
  }
];
