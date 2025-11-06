/**
 * ENHANCED ERROR CLASSIFIER
 *
 * Intelligently classifies errors into specific, actionable categories.
 * Goes beyond "unknown" to provide actual insight.
 */
export type ErrorCategory = 'version_mismatch' | 'api_rate_limit' | 'authentication_error' | 'permission_error' | 'missing_dependency' | 'compilation_error' | 'type_error' | 'syntax_error' | 'runtime_error' | 'test_failure' | 'timeout' | 'network_error' | 'database_error' | 'configuration_error' | 'resource_exhausted' | 'invalid_input' | 'not_found' | 'conflict' | 'unknown';
export interface ErrorClassification {
    category: ErrorCategory;
    confidence: number;
    indicators: string[];
    suggested_fix: string;
    related_agent?: string;
}
/**
 * Classifies an error message into a specific category with actionable advice
 */
export declare function classifyError(errorMessage: string): ErrorClassification;
/**
 * Get contextual advice based on error category and project context
 */
export declare function getContextualAdvice(classification: ErrorClassification, projectContext?: {
    project_type?: string;
    has_tests?: boolean;
}): string;
//# sourceMappingURL=error_classifier.d.ts.map