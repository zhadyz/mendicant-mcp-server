/**
 * ENHANCED ERROR CLASSIFIER - ADAPTATION 1
 *
 * Multi-dimensional error classification with hierarchical taxonomy.
 * Provides actionable intelligence for automated recovery.
 *
 * ENHANCEMENT: Adds 4-dimensional classification:
 * 1. Category → Sub-Type (17 granular types)
 * 2. Domain (8 system layers)
 * 3. Severity (4 impact levels)
 * 4. Recovery Strategy (6 automated approaches)
 */
import type { ErrorSubType, ErrorDomain, SeverityLevel, RecoveryStrategy } from '../types.js';
export type ErrorCategory = 'version_mismatch' | 'api_rate_limit' | 'authentication_error' | 'permission_error' | 'missing_dependency' | 'compilation_error' | 'type_error' | 'syntax_error' | 'runtime_error' | 'test_failure' | 'timeout' | 'network_error' | 'database_error' | 'configuration_error' | 'resource_exhausted' | 'invalid_input' | 'not_found' | 'conflict' | 'unknown';
export interface ErrorClassification {
    category: ErrorCategory;
    confidence: number;
    indicators: string[];
    suggested_fix: string;
    related_agent?: string;
    sub_type?: ErrorSubType;
    domain: ErrorDomain;
    severity: SeverityLevel;
    recovery_strategy: RecoveryStrategy;
    estimated_recovery_time_minutes: number;
    is_recoverable: boolean;
}
/**
 * Classifies an error message into multi-dimensional category
 */
export declare function classifyError(errorMessage: string): ErrorClassification;
/**
 * Get contextual advice based on error category and project context
 * ADAPTATION 1: Enhanced with recovery strategy information
 */
export declare function getContextualAdvice(classification: ErrorClassification, projectContext?: {
    project_type?: string;
    has_tests?: boolean;
}): string;
//# sourceMappingURL=error_classifier.d.ts.map