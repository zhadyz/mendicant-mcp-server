/**
 * Mnemosyne Sync Queue
 *
 * Background worker for async batch processing of Mnemosyne operations.
 * Ensures non-blocking persistence with retry logic and error handling.
 *
 * CYCLE 5 ENHANCEMENT: Added hybrid real-time/async sync with timeout fallback
 */

import type { MnemosyneClient } from './client.js';
import type { ExecutionRecord } from './client.js';
import type { AgentCapability } from '../../types.js';
import { SyncStrategyClassifier, type SyncStrategy, type SyncResult } from './sync_strategy.js';

/**
 * Operation types for the sync queue
 */
type SyncOperation =
  | { type: 'create_profile'; data: AgentCapability }
  | { type: 'record_execution'; data: ExecutionRecord };

/**
 * Queue item with metadata
 */
interface QueueItem {
  operation: SyncOperation;
  enqueued_at: number;
  retries: number;
}

/**
 * Queue statistics
 */
interface QueueStats {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  pending_operations: number;
  last_flush: number;
  avg_flush_duration_ms: number;
  realtime_syncs: number;
  async_syncs: number;
  timeout_fallbacks: number;
}

/**
 * Sync Queue for Mnemosyne Operations
 *
 * Features:
 * - Hybrid sync: Real-time with timeout fallback to async
 * - Async batch processing (flushes every 30 seconds)
 * - Retry logic with exponential backoff (1s, 2s, 4s, max 3 retries)
 * - Non-blocking operations (never blocks main thread)
 * - Error recovery (failed operations logged, don't crash system)
 */
export class SyncQueue {
  private queue: QueueItem[] = [];
  private client: MnemosyneClient;
  private flushInterval: NodeJS.Timeout | null = null;
  private flushIntervalMs: number = 30000; // 30 seconds
  private maxRetries: number = 3;
  private isRunning: boolean = false;
  private isFlushing: boolean = false;

  // Statistics
  private stats: QueueStats = {
    total_operations: 0,
    successful_operations: 0,
    failed_operations: 0,
    pending_operations: 0,
    last_flush: 0,
    avg_flush_duration_ms: 0,
    realtime_syncs: 0,
    async_syncs: 0,
    timeout_fallbacks: 0
  };

  constructor(client: MnemosyneClient) {
    this.client = client;
  }

  /**
   * Enqueue an operation for async processing
   *
   * Non-blocking: returns immediately
   */
  enqueue(operation: SyncOperation): void {
    const item: QueueItem = {
      operation,
      enqueued_at: Date.now(),
      retries: 0
    };

    this.queue.push(item);
    this.stats.total_operations++;
    this.stats.pending_operations = this.queue.length;
    this.stats.async_syncs++;

    console.log(`[SyncQueue] Enqueued ${operation.type}, queue size: ${this.queue.length}`);
  }

  /**
   * Hybrid sync: real-time with timeout fallback to async
   *
   * CYCLE 5 FEATURE: Intelligent sync method selection based on operation priority
   *
   * @param operation Operation to sync
   * @param operationType Type identifier for strategy classification
   * @returns Promise resolving to sync result
   */
  async hybridSync(
    operation: SyncOperation,
    operationType?: string
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const strategy = SyncStrategyClassifier.classifyOperation(
      operationType || operation.type
    );

    if (strategy.priority === 'realtime' || strategy.priority === 'critical') {
      try {
        const result = await Promise.race([
          this.executeOperation(operation),
          this.timeoutPromise(strategy.timeout)
        ]);

        this.stats.realtime_syncs++;
        this.stats.successful_operations++;

        return {
          success: true,
          method: 'realtime',
          duration: Date.now() - startTime
        };
      } catch (error) {
        console.warn(
          `[SyncQueue] Real-time sync failed for ${operation.type}, falling back to async`
        );

        // Fallback to async queue
        this.enqueue(operation);
        this.stats.timeout_fallbacks++;

        return {
          success: false,
          method: 'async',
          duration: Date.now() - startTime,
          error: error as Error
        };
      }
    } else {
      // Pure async
      this.enqueue(operation);
      this.stats.async_syncs++;

      return {
        success: true,
        method: 'async',
        duration: 0
      };
    }
  }

  /**
   * Execute operation immediately (real-time)
   *
   * @param operation Operation to execute
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    await this.processOperation(operation);
  }

  /**
   * Create timeout promise that rejects after specified milliseconds
   *
   * @param ms Timeout in milliseconds
   * @returns Promise that rejects with timeout error
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), ms)
    );
  }

  /**
   * Flush queue - process all pending operations
   *
   * Can be called manually or automatically by background worker.
   * Returns immediately if already flushing (prevents concurrent flushes).
   */
  async flush(): Promise<void> {
    if (this.isFlushing) {
      console.log('[SyncQueue] Already flushing, skipping');
      return;
    }

    if (this.queue.length === 0) {
      console.log('[SyncQueue] Queue empty, nothing to flush');
      return;
    }

    this.isFlushing = true;
    const start_time = Date.now();
    const items_to_process = [...this.queue];
    this.queue = []; // Clear queue immediately

    console.log(`[SyncQueue] Flushing ${items_to_process.length} operations...`);

    let processed = 0;
    let failed = 0;

    for (const item of items_to_process) {
      try {
        await this.processItemWithRetry(item);
        processed++;
        this.stats.successful_operations++;
      } catch (error) {
        console.error(`[SyncQueue] Failed to process ${item.operation.type}:`, error);
        failed++;
        this.stats.failed_operations++;

        // Don't re-queue failed operations to avoid infinite loops
        // Instead, log for manual investigation
        console.error(`[SyncQueue] Permanently failed operation:`, item.operation);
      }
    }

    const duration = Date.now() - start_time;
    this.stats.last_flush = Date.now();
    this.stats.pending_operations = this.queue.length;

    // Update average flush duration (exponential moving average)
    if (this.stats.avg_flush_duration_ms === 0) {
      this.stats.avg_flush_duration_ms = duration;
    } else {
      this.stats.avg_flush_duration_ms = this.stats.avg_flush_duration_ms * 0.9 + duration * 0.1;
    }

    console.log(
      `[SyncQueue] Flush complete: ${processed} successful, ${failed} failed, ${duration}ms`
    );

    this.isFlushing = false;
  }

  /**
   * Start background worker
   *
   * Flushes queue automatically every 30 seconds.
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[SyncQueue] Already running');
      return;
    }

    console.log(`[SyncQueue] Starting background worker (flush interval: ${this.flushIntervalMs}ms)`);

    this.isRunning = true;
    this.flushInterval = setInterval(() => {
      this.flush().catch(err => {
        console.error('[SyncQueue] Background flush failed:', err);
      });
    }, this.flushIntervalMs);

    console.log('[SyncQueue] Background worker started');
  }

  /**
   * Stop background worker
   *
   * Optionally flush remaining operations before stopping.
   */
  async stop(flushRemaining: boolean = true): Promise<void> {
    console.log(`[SyncQueue] Stopping background worker (flush remaining: ${flushRemaining})...`);

    this.isRunning = false;

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    if (flushRemaining && this.queue.length > 0) {
      console.log('[SyncQueue] Flushing remaining operations before stop...');
      await this.flush();
    }

    console.log('[SyncQueue] Background worker stopped');
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Process item with retry logic
   *
   * Retries up to 3 times with exponential backoff: 1s, 2s, 4s
   */
  private async processItemWithRetry(item: QueueItem): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.processOperation(item.operation);
        return; // Success!
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[SyncQueue] Retry ${attempt + 1}/${this.maxRetries} for ${item.operation.type}:`,
          error
        );

        if (attempt < this.maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed after ${this.maxRetries} retries`);
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create_profile':
        await this.client.createAgentProfile(operation.data);
        break;

      case 'record_execution':
        await this.client.recordExecution(operation.data);
        break;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear all pending operations
   *
   * WARNING: Use with caution, discards all pending work
   */
  clear(): void {
    const discarded = this.queue.length;
    this.queue = [];
    this.stats.pending_operations = 0;
    console.warn(`[SyncQueue] Cleared ${discarded} pending operations`);
  }
}
