/**
 * MCP Tool Call Interceptor
 * 
 * Wraps MCP tool execution with delegation enforcement.
 * Intercepts calls to filesystem/code tools and enforces limits.
 */

import { delegationEnforcer } from './delegation-enforcer.js';

/**
 * Tools that should be intercepted for enforcement
 */
const INTERCEPTED_TOOLS = new Set([
  'Read',
  'Write', 
  'Edit',
  'Glob',
  'Grep',
  'Bash'
]);

/**
 * Check if tool should be intercepted
 */
export function shouldIntercept(toolName: string): boolean {
  return INTERCEPTED_TOOLS.has(toolName);
}

/**
 * Pre-execution check
 * 
 * @throws Error if hard block triggered
 * @returns Warning message if applicable, null otherwise
 */
export function preExecutionCheck(toolName: string, args: any): string | null {
  if (!shouldIntercept(toolName)) {
    return null;
  }
  
  return delegationEnforcer.checkToolCall(toolName, args);
}

/**
 * Post-execution tracking
 */
export function postExecutionTrack(toolName: string, args: any, response?: any): void {
  if (!shouldIntercept(toolName)) {
    return;
  }
  
  delegationEnforcer.recordToolCall(toolName, args, response);
}

/**
 * Wrap tool response with warning if applicable
 */
export function wrapResponse(response: any, warning: string | null): any {
  if (!warning) {
    return response;
  }
  
  // If response has text content, prepend warning
  if (response.content && Array.isArray(response.content)) {
    return {
      ...response,
      content: [
        {
          type: 'text',
          text: `${warning}\n\n${response.content[0]?.text || ''}`
        }
      ]
    };
  }
  
  return response;
}

/**
 * Get current enforcement stats (for debugging)
 */
export function getEnforcementStats() {
  return delegationEnforcer.getStats();
}

/**
 * Reset enforcement session
 */
export function resetEnforcement(): void {
  delegationEnforcer.resetSession();
}

/**
 * Enable/disable enforcement
 */
export function setEnforcementEnabled(enabled: boolean): void {
  delegationEnforcer.setEnabled(enabled);
}
