/**
 * Sync Strategy for Mnemosyne
 *
 * Determines optimal sync method (real-time vs async) based on operation type.
 * Critical operations use real-time sync with timeout fallback to async.
 */
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
    static classifyOperation(operationType) {
        const strategies = {
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
//# sourceMappingURL=sync_strategy.js.map