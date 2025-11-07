/**
 * Mnemosyne Sync Queue
 *
 * Background worker for async batch processing of Mnemosyne operations.
 * Ensures non-blocking persistence with retry logic and error handling.
 */
import type { MnemosyneClient } from './client.js';
import type { ExecutionRecord } from './client.js';
import type { AgentCapability } from '../../types.js';
/**
 * Operation types for the sync queue
 */
type SyncOperation = {
    type: 'create_profile';
    data: AgentCapability;
} | {
    type: 'record_execution';
    data: ExecutionRecord;
};
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
}
/**
 * Sync Queue for Mnemosyne Operations
 *
 * Features:
 * - Async batch processing (flushes every 30 seconds)
 * - Retry logic with exponential backoff (1s, 2s, 4s, max 3 retries)
 * - Non-blocking operations (never blocks main thread)
 * - Error recovery (failed operations logged, don't crash system)
 */
export declare class SyncQueue {
    private queue;
    private client;
    private flushInterval;
    private flushIntervalMs;
    private maxRetries;
    private isRunning;
    private isFlushing;
    private stats;
    constructor(client: MnemosyneClient);
    /**
     * Enqueue an operation for async processing
     *
     * Non-blocking: returns immediately
     */
    enqueue(operation: SyncOperation): void;
    /**
     * Flush queue - process all pending operations
     *
     * Can be called manually or automatically by background worker.
     * Returns immediately if already flushing (prevents concurrent flushes).
     */
    flush(): Promise<void>;
    /**
     * Start background worker
     *
     * Flushes queue automatically every 30 seconds.
     */
    start(): void;
    /**
     * Stop background worker
     *
     * Optionally flush remaining operations before stopping.
     */
    stop(flushRemaining?: boolean): Promise<void>;
    /**
     * Get queue statistics
     */
    getStats(): QueueStats;
    /**
     * Process operation with retry logic
     *
     * Retries up to 3 times with exponential backoff: 1s, 2s, 4s
     */
    private processOperationWithRetry;
    /**
     * Process a single operation
     */
    private processOperation;
    /**
     * Check if worker is running
     */
    isActive(): boolean;
    /**
     * Get current queue size
     */
    getQueueSize(): number;
    /**
     * Clear all pending operations
     *
     * WARNING: Use with caution, discards all pending work
     */
    clear(): void;
}
export {};
//# sourceMappingURL=sync_backup.d.ts.map