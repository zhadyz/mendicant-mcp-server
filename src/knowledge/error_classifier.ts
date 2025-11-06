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

export type ErrorCategory =
  | 'version_mismatch'
  | 'api_rate_limit'
  | 'authentication_error'
  | 'permission_error'
  | 'missing_dependency'
  | 'compilation_error'
  | 'type_error'
  | 'syntax_error'
  | 'runtime_error'
  | 'test_failure'
  | 'timeout'
  | 'network_error'
  | 'database_error'
  | 'configuration_error'
  | 'resource_exhausted'
  | 'invalid_input'
  | 'not_found'
  | 'conflict'
  | 'unknown';

export interface ErrorClassification {
  category: ErrorCategory;
  confidence: number;
  indicators: string[];
  suggested_fix: string;
  related_agent?: string;

  // ADAPTATION 1: Multi-dimensional classification
  sub_type?: ErrorSubType;
  domain: ErrorDomain;
  severity: SeverityLevel;
  recovery_strategy: RecoveryStrategy;
  estimated_recovery_time_minutes: number;
  is_recoverable: boolean;
}

/**
 * Detect granular sub-type within error category
 */
function detectSubType(category: ErrorCategory, errorMessage: string): ErrorSubType {
  const lower = errorMessage.toLowerCase();

  switch (category) {
    case 'version_mismatch':
      if (/using.*v\d+.*expects.*v\d+/i.test(lower) || /version.*conflict/i.test(lower)) return 'version_conflict';
      if (/incompatible.*version/i.test(lower)) return 'version_conflict';
      if (/deprecated/i.test(lower)) return 'version_conflict';
      return 'version_conflict';

    case 'missing_dependency':
      if (/peer.*dependency/i.test(lower)) return 'peer_dependency_missing';
      if (/version.*conflict/i.test(lower) || /incompatible/i.test(lower)) return 'version_conflict';
      if (/transitive/i.test(lower) || /indirect/i.test(lower)) return 'transitive_dependency_missing';
      return 'direct_dependency_missing';

    case 'type_error':
      if (/null/i.test(lower)) return 'null_reference';
      if (/undefined.*property/i.test(lower)) return 'undefined_property';
      if (/type.*guard/i.test(lower)) return 'type_guard_failure';
      return 'type_mismatch';

    case 'network_error':
      if (/econnrefused/i.test(lower) || /connection.*refused/i.test(lower)) return 'connection_refused';
      if (/timeout/i.test(lower) || /etimeout/i.test(lower)) return 'connection_timeout';
      if (/dns/i.test(lower) || /getaddrinfo/i.test(lower)) return 'dns_resolution_failed';
      if (/ssl/i.test(lower) || /certificate/i.test(lower)) return 'ssl_certificate_error';
      return 'connection_refused';

    case 'configuration_error':
      if (/env.*not.*set/i.test(lower) || /missing.*env/i.test(lower)) return 'missing_env_var';
      if (/invalid.*value/i.test(lower) || /wrong.*type/i.test(lower)) return 'invalid_config_value';
      if (/not.*found/i.test(lower) || /enoent/i.test(lower)) return 'config_file_not_found';
      if (/parse/i.test(lower) || /invalid.*json/i.test(lower)) return 'config_parse_error';
      return 'missing_env_var';

    default:
      return 'unknown_sub_type';
  }
}

/**
 * Detect which system layer failed
 */
function detectDomain(category: ErrorCategory, errorMessage: string): ErrorDomain {
  const lower = errorMessage.toLowerCase();

  if (category === 'compilation_error' || category === 'syntax_error') {
    return 'build';
  }
  if (category === 'type_error' || category === 'runtime_error') {
    return 'runtime';
  }
  if (category === 'test_failure') {
    return 'test';
  }
  if (category === 'authentication_error' || category === 'permission_error') {
    return 'security';
  }
  if (category === 'database_error' || /database|sql|query/i.test(lower)) {
    return 'data';
  }
  if (category === 'network_error' || category === 'timeout' || category === 'api_rate_limit') {
    return 'network';
  }
  if (category === 'configuration_error' || category === 'missing_dependency' || category === 'version_mismatch') {
    return 'configuration';
  }
  if (/deploy|ci|cd|pipeline/i.test(lower)) {
    return 'deployment';
  }
  return 'runtime';
}

/**
 * Assess severity level based on error impact
 */
function assessSeverity(category: ErrorCategory, errorMessage: string): SeverityLevel {
  const lower = errorMessage.toLowerCase();

  if (
    category === 'resource_exhausted' ||
    category === 'database_error' ||
    /crash|fatal|critical|emergency/i.test(lower)
  ) {
    return 'critical';
  }

  if (
    category === 'compilation_error' ||
    category === 'syntax_error' ||
    category === 'authentication_error' ||
    category === 'missing_dependency' ||
    category === 'version_mismatch' ||
    /blocker|severe/i.test(lower)
  ) {
    return 'high';
  }

  if (
    category === 'timeout' ||
    category === 'not_found' ||
    category === 'invalid_input' ||
    /warning|minor/i.test(lower)
  ) {
    return 'low';
  }

  return 'medium';
}

/**
 * Determine automated recovery strategy
 */
function determineRecoveryStrategy(
  category: ErrorCategory,
  severity: SeverityLevel,
  errorMessage: string
): RecoveryStrategy {
  const lower = errorMessage.toLowerCase();

  // Network errors with connection issues benefit from backoff
  if (category === 'network_error' && (/econnrefused|econnreset|connection.*refused/i.test(lower))) {
    return 'retry_backoff';
  }

  if (
    category === 'timeout' ||
    category === 'network_error' ||
    (category === 'api_rate_limit' && /transient/i.test(lower))
  ) {
    return 'retry';
  }

  if (category === 'api_rate_limit') {
    return 'retry_backoff';
  }

  if (
    category === 'not_found' ||
    category === 'invalid_input' ||
    category === 'configuration_error' ||
    category === 'missing_dependency' ||
    severity === 'low'
  ) {
    return 'fallback';
  }

  if (category === 'test_failure' && /flaky|intermittent/i.test(lower)) {
    return 'skip';
  }

  if (severity === 'critical' || category === 'syntax_error' || category === 'compilation_error') {
    return 'abort';
  }

  return 'manual';
}

/**
 * Estimate recovery time in minutes
 */
function estimateRecoveryTime(category: ErrorCategory, strategy: RecoveryStrategy): number {
  if (strategy === 'retry') return 1;
  if (strategy === 'retry_backoff') return 5;
  if (strategy === 'fallback') return 2;
  if (strategy === 'skip') return 0;

  switch (category) {
    case 'configuration_error':
    case 'missing_dependency':
      return 10;
    case 'authentication_error':
    case 'permission_error':
      return 15;
    case 'type_error':
    case 'runtime_error':
      return 30;
    case 'compilation_error':
    case 'syntax_error':
      return 45;
    case 'database_error':
    case 'network_error':
      return 60;
    case 'resource_exhausted':
      return 120;
    default:
      return 20;
  }
}

/**
 * Classifies an error message into multi-dimensional category
 */
export function classifyError(errorMessage: string): ErrorClassification {
  const lower = errorMessage.toLowerCase();
  let baseClassification: Omit<ErrorClassification, 'sub_type' | 'domain' | 'severity' | 'recovery_strategy' | 'estimated_recovery_time_minutes' | 'is_recoverable'>;

  if (
    /v\d+.*v\d+/.test(lower) ||
    /is not a function/.test(lower) ||
    /is not defined/.test(lower) && /expected.*in.*version/.test(lower) ||
    /deprecated/.test(lower) ||
    /no longer supported/.test(lower) ||
    /upgrade.*to.*\d+/.test(lower) ||
    /using.*-v\d+.*but.*expects.*-v\d+/.test(lower)
  ) {
    baseClassification = {
      category: 'version_mismatch',
      confidence: 0.9,
      indicators: ['version_references', 'api_change_pattern'],
      suggested_fix: 'Update dependency version or adjust code to match installed version. Check package.json and update imports.',
      related_agent: 'the_curator'
    };
  }
  else if (
    /rate limit/i.test(errorMessage) ||
    /too many requests/i.test(errorMessage) ||
    /429/.test(errorMessage) ||
    /quota exceeded/i.test(errorMessage)
  ) {
    baseClassification = {
      category: 'api_rate_limit',
      confidence: 0.95,
      indicators: ['rate_limit_text', 'status_429'],
      suggested_fix: 'API rate limit exceeded. Wait before retrying, implement backoff strategy, or upgrade API plan.',
      related_agent: 'the_architect'
    };
  }
  else if (
    /auth/i.test(lower) && /fail/i.test(lower) ||
    /unauthorized/i.test(lower) ||
    /401/.test(errorMessage) ||
    /403/.test(errorMessage) ||
    /invalid.*token/i.test(lower) ||
    /expired.*token/i.test(lower) ||
    /missing.*credential/i.test(lower)
  ) {
    baseClassification = {
      category: 'authentication_error',
      confidence: 0.9,
      indicators: ['auth_keywords', 'status_401_403'],
      suggested_fix: 'Authentication failed. Check API keys, tokens, or credentials. Verify environment variables are set correctly.',
      related_agent: 'the_didact'
    };
  }
  else if (
    /permission denied/i.test(lower) ||
    /access denied/i.test(lower) ||
    /eacces/i.test(lower) ||
    /eperm/i.test(lower) ||
    /insufficient.*permission/i.test(lower)
  ) {
    baseClassification = {
      category: 'permission_error',
      confidence: 0.95,
      indicators: ['permission_keywords', 'eacces_eperm'],
      suggested_fix: 'Permission denied. Check file/directory permissions, or run with appropriate access rights.',
      related_agent: 'the_sentinel'
    };
  }
  else if (
    /cannot find module/i.test(lower) ||
    /module not found/i.test(lower) ||
    /no such file or directory/i.test(lower) ||
    /enoent/i.test(lower) ||
    /not installed/i.test(lower) ||
    /missing.*dependency/i.test(lower)
  ) {
    baseClassification = {
      category: 'missing_dependency',
      confidence: 0.9,
      indicators: ['module_not_found', 'enoent'],
      suggested_fix: 'Dependency not found. Run package manager install command (npm install, pip install, etc.)',
      related_agent: 'the_curator'
    };
  }
  else if (
    /type.*error/i.test(lower) ||
    /cannot read prop.*of undefined/i.test(lower) ||
    /cannot read prop.*of null/i.test(lower) ||
    /is not a function/i.test(lower) ||
    /undefined is not an object/i.test(lower) ||
    /expected.*but got/i.test(lower)
  ) {
    baseClassification = {
      category: 'type_error',
      confidence: 0.85,
      indicators: ['type_error_pattern'],
      suggested_fix: 'Type mismatch or null reference. Add null checks, verify object structure, or add TypeScript type guards.',
      related_agent: 'hollowed_eyes'
    };
  }
  else if (
    /syntax.*error/i.test(lower) ||
    /unexpected.*token/i.test(lower) ||
    /parse.*error/i.test(lower) ||
    /invalid.*syntax/i.test(lower)
  ) {
    baseClassification = {
      category: 'syntax_error',
      confidence: 0.95,
      indicators: ['syntax_error_keywords'],
      suggested_fix: 'Syntax error in code. Check for missing brackets, quotes, or semicolons. Verify code structure.',
      related_agent: 'hollowed_eyes'
    };
  }
  else if (
    /compil.*error/i.test(lower) ||
    /build.*fail/i.test(lower) ||
    /tsc.*error/i.test(lower) ||
    /cannot compile/i.test(lower)
  ) {
    baseClassification = {
      category: 'compilation_error',
      confidence: 0.9,
      indicators: ['compilation_keywords'],
      suggested_fix: 'Compilation failed. Review type errors, missing imports, or configuration issues in tsconfig/build config.',
      related_agent: 'hollowed_eyes'
    };
  }
  else if (
    /test.*fail/i.test(lower) ||
    /assertion.*fail/i.test(lower) ||
    /expected.*received/i.test(lower) ||
    /\d+.*failing/i.test(lower)
  ) {
    baseClassification = {
      category: 'test_failure',
      confidence: 0.9,
      indicators: ['test_failure_keywords'],
      suggested_fix: 'Tests failing. Review test output, fix implementation to match expected behavior, or update test expectations.',
      related_agent: 'loveless'
    };
  }
  else if (
    /timeout/i.test(lower) ||
    /timed out/i.test(lower) ||
    /etimeout/i.test(lower) ||
    /request.*exceeded.*time/i.test(lower)
  ) {
    baseClassification = {
      category: 'timeout',
      confidence: 0.95,
      indicators: ['timeout_keywords'],
      suggested_fix: 'Operation timed out. Increase timeout value, optimize slow operations, or check network connectivity.',
      related_agent: 'performance_optimizer'
    };
  }
  else if (
    /network.*error/i.test(lower) ||
    /econnrefused/i.test(lower) ||
    /econnreset/i.test(lower) ||
    /fetch.*fail/i.test(lower) ||
    /connection.*refused/i.test(lower)
  ) {
    baseClassification = {
      category: 'network_error',
      confidence: 0.9,
      indicators: ['network_error_keywords', 'econn_codes'],
      suggested_fix: 'Network connection failed. Check if service is running, verify URL/port, or check network connectivity.',
      related_agent: 'the_sentinel'
    };
  }
  else if (
    /database.*error/i.test(lower) ||
    /sql.*error/i.test(lower) ||
    /query.*fail/i.test(lower) ||
    /connection.*pool/i.test(lower) ||
    /deadlock/i.test(lower)
  ) {
    baseClassification = {
      category: 'database_error',
      confidence: 0.9,
      indicators: ['database_keywords'],
      suggested_fix: 'Database operation failed. Check connection string, verify database is running, or review query syntax.',
      related_agent: 'the_architect'
    };
  }
  else if (
    /config.*error/i.test(lower) ||
    /invalid.*config/i.test(lower) ||
    /missing.*env/i.test(lower) ||
    /env.*not.*set/i.test(lower)
  ) {
    baseClassification = {
      category: 'configuration_error',
      confidence: 0.85,
      indicators: ['config_keywords'],
      suggested_fix: 'Configuration issue. Check config files, environment variables, or settings.',
      related_agent: 'the_cartographer'
    };
  }
  else if (
    /out of memory/i.test(lower) ||
    /heap.*exceeded/i.test(lower) ||
    /disk.*full/i.test(lower) ||
    /resource.*exhausted/i.test(lower)
  ) {
    baseClassification = {
      category: 'resource_exhausted',
      confidence: 0.9,
      indicators: ['resource_exhaustion_keywords'],
      suggested_fix: 'System resources exhausted. Increase memory limits, free up disk space, or optimize resource usage.',
      related_agent: 'performance_optimizer'
    };
  }
  else if (
    /not found/i.test(lower) ||
    /404/.test(errorMessage) ||
    /does not exist/i.test(lower) ||
    /no such/i.test(lower)
  ) {
    baseClassification = {
      category: 'not_found',
      confidence: 0.8,
      indicators: ['not_found_keywords', 'status_404'],
      suggested_fix: 'Resource not found. Verify path/URL, check if file exists, or create missing resource.',
      related_agent: 'the_didact'
    };
  }
  else if (
    /conflict/i.test(lower) ||
    /409/.test(errorMessage) ||
    /already exists/i.test(lower) ||
    /duplicate/i.test(lower)
  ) {
    baseClassification = {
      category: 'conflict',
      confidence: 0.85,
      indicators: ['conflict_keywords', 'status_409'],
      suggested_fix: 'Resource conflict. Item may already exist, or there may be a merge conflict to resolve.',
      related_agent: 'the_curator'
    };
  }
  else {
    baseClassification = {
      category: 'unknown',
      confidence: 0.5,
      indicators: ['no_recognizable_pattern'],
      suggested_fix: 'Error type unclear. Review full error message and stack trace for details. Consider running the_didact for research.',
      related_agent: 'the_didact'
    };
  }

  // ADAPTATION 1: Apply multi-dimensional classification
  const sub_type = detectSubType(baseClassification.category, errorMessage);
  const domain = detectDomain(baseClassification.category, errorMessage);
  const severity = assessSeverity(baseClassification.category, errorMessage);
  const recovery_strategy = determineRecoveryStrategy(baseClassification.category, severity, errorMessage);
  const estimated_recovery_time_minutes = estimateRecoveryTime(baseClassification.category, recovery_strategy);
  const is_recoverable = recovery_strategy !== 'abort' && recovery_strategy !== 'manual';

  return {
    ...baseClassification,
    sub_type,
    domain,
    severity,
    recovery_strategy,
    estimated_recovery_time_minutes,
    is_recoverable
  };
}

/**
 * Get contextual advice based on error category and project context
 * ADAPTATION 1: Enhanced with recovery strategy information
 */
export function getContextualAdvice(
  classification: ErrorClassification,
  projectContext?: { project_type?: string; has_tests?: boolean }
): string {
  const { category, recovery_strategy, estimated_recovery_time_minutes } = classification;
  let advice = classification.suggested_fix;

  // Add recovery strategy information
  if (recovery_strategy === 'retry') {
    advice += ' This error is typically transient and can be retried immediately.';
  } else if (recovery_strategy === 'retry_backoff') {
    advice += ` This error requires exponential backoff. Estimated recovery: ${estimated_recovery_time_minutes} minutes.`;
  } else if (recovery_strategy === 'fallback') {
    advice += ' Consider using a fallback mechanism or alternative approach.';
  } else if (recovery_strategy === 'abort') {
    advice += ' This is a critical error that requires immediate attention before proceeding.';
  } else if (recovery_strategy === 'skip') {
    advice += ' This error can be safely skipped for now and addressed later.';
  } else if (recovery_strategy === 'manual') {
    advice += ` Manual intervention required. Estimated fix time: ${estimated_recovery_time_minutes} minutes.`;
  }

  // Add project-specific context
  if (projectContext?.project_type === 'nextjs' && category === 'compilation_error') {
    advice += ' For Next.js, check next.config.js and ensure all dependencies support your Next.js version.';
  }

  if (projectContext?.project_type === 'python' && category === 'missing_dependency') {
    advice += ' Run pip install -r requirements.txt or create a virtual environment.';
  }

  if (category === 'test_failure' && !projectContext?.has_tests) {
    advice += ' NOTE: Project appears to have no test infrastructure. Consider setting up tests first.';
  }

  return advice;
}
