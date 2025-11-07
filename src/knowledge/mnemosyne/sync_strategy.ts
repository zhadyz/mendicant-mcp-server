/**
 * Sync Strategy for Mnemosyne
 * 
 * Determines optimal sync method (real-time vs async) based on operation type.
 * Critical operations use real-time sync with timeout fallback to async.
 */

export type SyncPriority = 'realtime' | 'async' | 'critical';

/**
 * Sync strategy configuration for an operation
 */
export interface SyncStrategy {
  /** Priority level determines sync method */
  priority: SyncPriority;
  
  /** Timeout for real-time operations (milliseconds) */
  timeout: number;
  
  /** Whether to retry if sync fails */
  retryOnFailure: boolean;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  /** Whether sync succeeded */
  success: boolean;
  
  /** Method used (realtime or async) */
  method: 'realtime' | 'async';
  
  /** Duration in milliseconds */
  duration: number;
  
  /** Error if sync failed */
  error?: Error;
}

/**
 * Classifier for determining optimal sync strategy
 */
export class SyncStrategyClassifier {
  /**
   * Classify operation type to determine sync strategy
   * 
   * Real-time operations (critical for immediate learning):
   * - agent_selection_success: Need immediate feedback for next selection
   * - task_failure: Need to learn from failures immediately
   * 
   * Async operations (can be batched):
   * - pattern_extraction: Background analysis
   * - usage_statistics: Non-critical metrics
   * - create_profile: Initial setup
   */
  static classifyOperation(operationType: string): SyncStrategy {
    const strategies: Record<string, SyncStrategy> = {
      'agent_selection_success': {
        priority: 'realtime',
        timeout: 500,
        retryOnFailure: true
      },
      'task_failure': {
        priority: 'realtime',
        timeout: 300,
        retryOnFailure: true
      },
      'pattern_extraction': {
        priority: 'async',
        timeout: 0,
        retryOnFailure: false
      },
      'usage_statistics': {
        priority: 'async',
        timeout: 0,
        retryOnFailure: false
      },
      'create_profile': {
        priority: 'async',
        timeout: 0,
        retryOnFailure: false
      },
      'execution_record': {
        priority: 'realtime',
        timeout: 400,
        retryOnFailure: true
      }
    };
    
    return strategies[operationType] || {
      priority: 'async',
      timeout: 0,
      retryOnFailure: false
    };
  }
}
