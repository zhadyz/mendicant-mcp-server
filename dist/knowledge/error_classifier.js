/**
 * ENHANCED ERROR CLASSIFIER
 *
 * Intelligently classifies errors into specific, actionable categories.
 * Goes beyond "unknown" to provide actual insight.
 */
/**
 * Classifies an error message into a specific category with actionable advice
 */
export function classifyError(errorMessage) {
    const lower = errorMessage.toLowerCase();
    // VERSION MISMATCH - Most specific, check first
    if (/v\d+.*v\d+/.test(lower) || // mentions multiple versions
        /is not a function/.test(lower) || // API changed
        /is not defined/.test(lower) && /expected.*in.*version/.test(lower) ||
        /deprecated/.test(lower) ||
        /no longer supported/.test(lower) ||
        /upgrade.*to.*\d+/.test(lower) ||
        /using.*-v\d+.*but.*expects.*-v\d+/.test(lower)) {
        return {
            category: 'version_mismatch',
            confidence: 0.9,
            indicators: ['version_references', 'api_change_pattern'],
            suggested_fix: 'Update dependency version or adjust code to match installed version. Check package.json and update imports.',
            related_agent: 'the_curator'
        };
    }
    // API RATE LIMIT
    if (/rate limit/i.test(errorMessage) ||
        /too many requests/i.test(errorMessage) ||
        /429/.test(errorMessage) ||
        /quota exceeded/i.test(errorMessage)) {
        return {
            category: 'api_rate_limit',
            confidence: 0.95,
            indicators: ['rate_limit_text', 'status_429'],
            suggested_fix: 'API rate limit exceeded. Wait before retrying, implement backoff strategy, or upgrade API plan.',
            related_agent: 'the_architect'
        };
    }
    // AUTHENTICATION ERROR
    if (/auth/i.test(lower) && /fail/i.test(lower) ||
        /unauthorized/i.test(lower) ||
        /401/.test(errorMessage) ||
        /403/.test(errorMessage) ||
        /invalid.*token/i.test(lower) ||
        /expired.*token/i.test(lower) ||
        /missing.*credential/i.test(lower)) {
        return {
            category: 'authentication_error',
            confidence: 0.9,
            indicators: ['auth_keywords', 'status_401_403'],
            suggested_fix: 'Authentication failed. Check API keys, tokens, or credentials. Verify environment variables are set correctly.',
            related_agent: 'the_didact'
        };
    }
    // PERMISSION ERROR
    if (/permission denied/i.test(lower) ||
        /access denied/i.test(lower) ||
        /eacces/i.test(lower) ||
        /eperm/i.test(lower) ||
        /insufficient.*permission/i.test(lower)) {
        return {
            category: 'permission_error',
            confidence: 0.95,
            indicators: ['permission_keywords', 'eacces_eperm'],
            suggested_fix: 'Permission denied. Check file/directory permissions, or run with appropriate access rights.',
            related_agent: 'the_sentinel'
        };
    }
    // MISSING DEPENDENCY
    if (/cannot find module/i.test(lower) ||
        /module not found/i.test(lower) ||
        /no such file or directory/i.test(lower) ||
        /enoent/i.test(lower) ||
        /not installed/i.test(lower) ||
        /missing.*dependency/i.test(lower)) {
        return {
            category: 'missing_dependency',
            confidence: 0.9,
            indicators: ['module_not_found', 'enoent'],
            suggested_fix: 'Dependency not found. Run package manager install command (npm install, pip install, etc.)',
            related_agent: 'the_curator'
        };
    }
    // TYPE ERROR
    if (/type.*error/i.test(lower) ||
        /cannot read prop.*of undefined/i.test(lower) ||
        /cannot read prop.*of null/i.test(lower) ||
        /is not a function/i.test(lower) ||
        /undefined is not an object/i.test(lower) ||
        /expected.*but got/i.test(lower)) {
        return {
            category: 'type_error',
            confidence: 0.85,
            indicators: ['type_error_pattern'],
            suggested_fix: 'Type mismatch or null reference. Add null checks, verify object structure, or add TypeScript type guards.',
            related_agent: 'hollowed_eyes'
        };
    }
    // SYNTAX ERROR
    if (/syntax.*error/i.test(lower) ||
        /unexpected.*token/i.test(lower) ||
        /parse.*error/i.test(lower) ||
        /invalid.*syntax/i.test(lower)) {
        return {
            category: 'syntax_error',
            confidence: 0.95,
            indicators: ['syntax_error_keywords'],
            suggested_fix: 'Syntax error in code. Check for missing brackets, quotes, or semicolons. Verify code structure.',
            related_agent: 'hollowed_eyes'
        };
    }
    // COMPILATION ERROR
    if (/compil.*error/i.test(lower) ||
        /build.*fail/i.test(lower) ||
        /tsc.*error/i.test(lower) ||
        /cannot compile/i.test(lower)) {
        return {
            category: 'compilation_error',
            confidence: 0.9,
            indicators: ['compilation_keywords'],
            suggested_fix: 'Compilation failed. Review type errors, missing imports, or configuration issues in tsconfig/build config.',
            related_agent: 'hollowed_eyes'
        };
    }
    // TEST FAILURE
    if (/test.*fail/i.test(lower) ||
        /assertion.*fail/i.test(lower) ||
        /expected.*received/i.test(lower) ||
        /\d+.*failing/i.test(lower)) {
        return {
            category: 'test_failure',
            confidence: 0.9,
            indicators: ['test_failure_keywords'],
            suggested_fix: 'Tests failing. Review test output, fix implementation to match expected behavior, or update test expectations.',
            related_agent: 'loveless'
        };
    }
    // TIMEOUT
    if (/timeout/i.test(lower) ||
        /timed out/i.test(lower) ||
        /etimeout/i.test(lower) ||
        /request.*exceeded.*time/i.test(lower)) {
        return {
            category: 'timeout',
            confidence: 0.95,
            indicators: ['timeout_keywords'],
            suggested_fix: 'Operation timed out. Increase timeout value, optimize slow operations, or check network connectivity.',
            related_agent: 'performance_optimizer'
        };
    }
    // NETWORK ERROR
    if (/network.*error/i.test(lower) ||
        /econnrefused/i.test(lower) ||
        /econnreset/i.test(lower) ||
        /fetch.*fail/i.test(lower) ||
        /connection.*refused/i.test(lower)) {
        return {
            category: 'network_error',
            confidence: 0.9,
            indicators: ['network_error_keywords', 'econn_codes'],
            suggested_fix: 'Network connection failed. Check if service is running, verify URL/port, or check network connectivity.',
            related_agent: 'the_sentinel'
        };
    }
    // DATABASE ERROR
    if (/database.*error/i.test(lower) ||
        /sql.*error/i.test(lower) ||
        /query.*fail/i.test(lower) ||
        /connection.*pool/i.test(lower) ||
        /deadlock/i.test(lower)) {
        return {
            category: 'database_error',
            confidence: 0.9,
            indicators: ['database_keywords'],
            suggested_fix: 'Database operation failed. Check connection string, verify database is running, or review query syntax.',
            related_agent: 'the_architect'
        };
    }
    // CONFIGURATION ERROR
    if (/config.*error/i.test(lower) ||
        /invalid.*config/i.test(lower) ||
        /missing.*env/i.test(lower) ||
        /env.*not.*set/i.test(lower)) {
        return {
            category: 'configuration_error',
            confidence: 0.85,
            indicators: ['config_keywords'],
            suggested_fix: 'Configuration issue. Check config files, environment variables, or settings.',
            related_agent: 'the_cartographer'
        };
    }
    // RESOURCE EXHAUSTED
    if (/out of memory/i.test(lower) ||
        /heap.*exceeded/i.test(lower) ||
        /disk.*full/i.test(lower) ||
        /resource.*exhausted/i.test(lower)) {
        return {
            category: 'resource_exhausted',
            confidence: 0.9,
            indicators: ['resource_exhaustion_keywords'],
            suggested_fix: 'System resources exhausted. Increase memory limits, free up disk space, or optimize resource usage.',
            related_agent: 'performance_optimizer'
        };
    }
    // NOT FOUND (404)
    if (/not found/i.test(lower) ||
        /404/.test(errorMessage) ||
        /does not exist/i.test(lower) ||
        /no such/i.test(lower)) {
        return {
            category: 'not_found',
            confidence: 0.8,
            indicators: ['not_found_keywords', 'status_404'],
            suggested_fix: 'Resource not found. Verify path/URL, check if file exists, or create missing resource.',
            related_agent: 'the_didact'
        };
    }
    // CONFLICT
    if (/conflict/i.test(lower) ||
        /409/.test(errorMessage) ||
        /already exists/i.test(lower) ||
        /duplicate/i.test(lower)) {
        return {
            category: 'conflict',
            confidence: 0.85,
            indicators: ['conflict_keywords', 'status_409'],
            suggested_fix: 'Resource conflict. Item may already exist, or there may be a merge conflict to resolve.',
            related_agent: 'the_curator'
        };
    }
    // UNKNOWN - But provide context
    return {
        category: 'unknown',
        confidence: 0.5,
        indicators: ['no_recognizable_pattern'],
        suggested_fix: 'Error type unclear. Review full error message and stack trace for details. Consider running the_didact for research.',
        related_agent: 'the_didact'
    };
}
/**
 * Get contextual advice based on error category and project context
 */
export function getContextualAdvice(classification, projectContext) {
    const { category } = classification;
    let advice = classification.suggested_fix;
    // Add project-specific context
    if (projectContext?.project_type === 'nextjs' && category === 'compilation_error') {
        advice += ' For Next.js, check next.config.js and ensure all dependencies support your Next.js version.';
    }
    if (projectContext?.project_type === 'python' && category === 'missing_dependency') {
        advice += ' Run `pip install -r requirements.txt` or create a virtual environment.';
    }
    if (category === 'test_failure' && !projectContext?.has_tests) {
        advice += ' NOTE: Project appears to have no test infrastructure. Consider setting up tests first.';
    }
    return advice;
}
//# sourceMappingURL=error_classifier.js.map