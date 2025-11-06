/**
 * Analyzes project health and provides recommendations
 *
 * This examines:
 * - Test status
 * - Build status
 * - Security concerns
 * - Linear issues
 * - Git status
 *
 * And provides actionable recommendations with suggested agents
 */
export function analyzeProject(context) {
    const critical_issues = [];
    const recommendations = [];
    let health_score = 100;
    // Analyze test results
    if (context.test_results) {
        const testIssues = analyzeTests(context.test_results);
        critical_issues.push(...testIssues.issues);
        health_score -= testIssues.score_penalty;
    }
    // Analyze build status
    if (context.build_status) {
        const buildIssues = analyzeBuild(context.build_status);
        critical_issues.push(...buildIssues.issues);
        health_score -= buildIssues.score_penalty;
    }
    // Analyze Linear issues
    if (context.linear_issues && context.linear_issues.length > 0) {
        const linearIssues = analyzeLinearIssues(context.linear_issues);
        critical_issues.push(...linearIssues.issues);
        health_score -= linearIssues.score_penalty;
    }
    // Analyze git status
    if (context.git_status) {
        const gitIssues = analyzeGitStatus(context.git_status);
        critical_issues.push(...gitIssues.issues);
        health_score -= gitIssues.score_penalty;
    }
    // Analyze recent errors
    if (context.recent_errors && context.recent_errors.length > 0) {
        const errorIssues = analyzeErrors(context.recent_errors);
        critical_issues.push(...errorIssues.issues);
        health_score -= errorIssues.score_penalty;
    }
    // Generate recommendations based on issues
    for (const issue of critical_issues) {
        const rec = generateRecommendation(issue);
        if (rec) {
            recommendations.push(rec);
        }
    }
    // Determine suggested agents
    const suggested_agents = determineSuggestedAgents(critical_issues);
    return {
        health_score: Math.max(0, health_score),
        critical_issues,
        recommendations,
        suggested_agents
    };
}
/**
 * Analyzes test results
 */
function analyzeTests(testResults) {
    const issues = [];
    let penalty = 0;
    // Parse test results (assuming common format)
    const failCount = testResults.failed || 0;
    const totalCount = testResults.total || 0;
    if (failCount > 0) {
        issues.push({
            type: 'failing_tests',
            severity: failCount > 5 ? 'critical' : 'high',
            description: `${failCount} test(s) failing out of ${totalCount}`,
            suggested_fix: 'Run loveless to investigate failures, then hollowed_eyes to fix'
        });
        penalty = failCount > 5 ? 30 : 15;
    }
    // Check test coverage if available
    if (testResults.coverage && testResults.coverage < 50) {
        issues.push({
            type: 'low_test_coverage',
            severity: 'medium',
            description: `Test coverage is ${testResults.coverage}% (below recommended 70%)`,
            suggested_fix: 'Add more tests for critical code paths'
        });
        penalty += 10;
    }
    return { issues, score_penalty: penalty };
}
/**
 * Analyzes build status
 */
function analyzeBuild(buildStatus) {
    const issues = [];
    let penalty = 0;
    const lower = buildStatus.toLowerCase();
    if (lower.includes('fail') || lower.includes('error')) {
        issues.push({
            type: 'build_failure',
            severity: 'critical',
            description: 'Build is failing',
            suggested_fix: 'Run hollowed_eyes to investigate and fix build errors'
        });
        penalty = 40;
    }
    else if (lower.includes('warn')) {
        issues.push({
            type: 'build_warnings',
            severity: 'medium',
            description: 'Build has warnings',
            suggested_fix: 'Review and fix build warnings'
        });
        penalty = 10;
    }
    return { issues, score_penalty: penalty };
}
/**
 * Analyzes Linear issues
 */
function analyzeLinearIssues(linearIssues) {
    const issues = [];
    let penalty = 0;
    // Count by priority
    const urgent = linearIssues.filter(i => i.priority === 'urgent' || i.priority === 1);
    const high = linearIssues.filter(i => i.priority === 'high' || i.priority === 2);
    if (urgent.length > 0) {
        issues.push({
            type: 'urgent_linear_issues',
            severity: 'critical',
            description: `${urgent.length} urgent Linear issue(s) need attention`,
            suggested_fix: 'Address urgent Linear issues immediately'
        });
        penalty = urgent.length * 15;
    }
    if (high.length > 3) {
        issues.push({
            type: 'many_high_priority_issues',
            severity: 'high',
            description: `${high.length} high-priority Linear issues pending`,
            suggested_fix: 'Prioritize and tackle high-priority issues'
        });
        penalty += 10;
    }
    return { issues, score_penalty: Math.min(penalty, 50) };
}
/**
 * Analyzes git status
 */
function analyzeGitStatus(gitStatus) {
    const issues = [];
    let penalty = 0;
    const lower = gitStatus.toLowerCase();
    // Check for uncommitted changes
    if (lower.includes('modified') || lower.includes('untracked')) {
        const fileCount = (gitStatus.match(/modified:/g) || []).length +
            (gitStatus.match(/untracked/g) || []).length;
        if (fileCount > 10) {
            issues.push({
                type: 'many_uncommitted_changes',
                severity: 'medium',
                description: `${fileCount}+ files with uncommitted changes`,
                suggested_fix: 'Review and commit changes, or use the_curator to organize'
            });
            penalty = 5;
        }
    }
    // Check for merge conflicts
    if (lower.includes('conflict')) {
        issues.push({
            type: 'merge_conflicts',
            severity: 'high',
            description: 'Merge conflicts detected',
            suggested_fix: 'Resolve merge conflicts before continuing'
        });
        penalty = 20;
    }
    return { issues, score_penalty: penalty };
}
/**
 * Analyzes recent errors - FIXED to deeply parse error details
 */
function analyzeErrors(errors) {
    const issues = [];
    let penalty = 0;
    // CRITICAL FIX: Actually check if errors exist and have content
    if (!errors || errors.length === 0) {
        return { issues, score_penalty: 0 };
    }
    // Parse EACH error in detail
    const errorDetails = errors.map(e => ({
        type: e.type || 'unknown',
        message: e.message || e.toString() || 'Unknown error',
        severity: classifyErrorSeverity(e),
        stack: e.stack || null
    }));
    // Group errors by type
    const errorTypes = new Map();
    for (const error of errorDetails) {
        errorTypes.set(error.type, (errorTypes.get(error.type) || 0) + 1);
    }
    // Security errors are CRITICAL
    const securityErrors = errorDetails.filter(e => e.type?.toLowerCase().includes('security') ||
        e.message.toLowerCase().includes('vulnerability') ||
        e.message.toLowerCase().includes('cve') ||
        e.message.toLowerCase().includes('exploit'));
    if (securityErrors.length > 0) {
        issues.push({
            type: 'security_errors',
            severity: 'critical',
            description: `${securityErrors.length} security-related error(s): ${securityErrors[0].message.slice(0, 80)}`,
            suggested_fix: 'Run loveless for security audit, then fix vulnerabilities IMMEDIATELY'
        });
        penalty = 40; // Increased from 35
    }
    // Critical errors (failures, crashes)
    const criticalErrors = errorDetails.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
        issues.push({
            type: 'critical_errors',
            severity: 'critical',
            description: `${criticalErrors.length} critical error(s): ${criticalErrors[0].message.slice(0, 80)}`,
            suggested_fix: 'Address critical errors before proceeding'
        });
        penalty += criticalErrors.length * 15;
    }
    // High severity errors
    const highErrors = errorDetails.filter(e => e.severity === 'high');
    if (highErrors.length > 0) {
        issues.push({
            type: 'high_severity_errors',
            severity: 'high',
            description: `${highErrors.length} high severity error(s): ${highErrors[0].message.slice(0, 80)}`,
            suggested_fix: 'Fix high severity errors to improve stability'
        });
        penalty += highErrors.length * 10;
    }
    // Many errors indicate systemic instability
    if (errors.length > 10) {
        issues.push({
            type: 'many_errors',
            severity: 'high',
            description: `${errors.length} recent errors indicating systemic instability`,
            suggested_fix: 'Investigate error patterns and address root causes'
        });
        penalty += 25; // Increased from 20
    }
    // Medium errors still matter
    const mediumErrors = errorDetails.filter(e => e.severity === 'medium');
    if (mediumErrors.length > 5) {
        issues.push({
            type: 'multiple_medium_errors',
            severity: 'medium',
            description: `${mediumErrors.length} medium severity errors detected`,
            suggested_fix: 'Review and fix medium severity errors'
        });
        penalty += 10;
    }
    return { issues, score_penalty: Math.min(penalty, 75) }; // Increased cap from 50 to 75
}
/**
 * Classifies error severity based on error details
 */
function classifyErrorSeverity(error) {
    const message = (error.message || error.toString() || '').toLowerCase();
    const type = (error.type || '').toLowerCase();
    // CRITICAL: Security, crashes, data loss
    if (message.includes('security') ||
        message.includes('vulnerability') ||
        message.includes('exploit') ||
        message.includes('crash') ||
        message.includes('fatal') ||
        message.includes('data loss') ||
        type.includes('security')) {
        return 'critical';
    }
    // HIGH: Failures, cannot continue
    if (message.includes('fail') ||
        message.includes('cannot') ||
        message.includes('error:') ||
        message.includes('exception') ||
        message.includes('assertion') ||
        type.includes('error')) {
        return 'high';
    }
    // MEDIUM: Warnings, deprecated
    if (message.includes('warn') ||
        message.includes('deprecated') ||
        message.includes('should not') ||
        type.includes('warning')) {
        return 'medium';
    }
    // LOW: Everything else
    return 'low';
}
/**
 * Generates recommendation for an issue
 */
function generateRecommendation(issue) {
    const agentMap = {
        'failing_tests': ['loveless', 'hollowed_eyes'],
        'build_failure': ['hollowed_eyes'],
        'security_errors': ['loveless', 'the_didact', 'hollowed_eyes'],
        'urgent_linear_issues': ['the_librarian', 'hollowed_eyes'],
        'merge_conflicts': ['hollowed_eyes'],
        'low_test_coverage': ['loveless', 'hollowed_eyes'],
        'many_uncommitted_changes': ['the_curator']
    };
    const agents = agentMap[issue.type] || ['hollowed_eyes'];
    return {
        action: issue.suggested_fix,
        priority: issue.severity === 'critical' ? 'critical' :
            issue.severity === 'high' ? 'high' : 'medium',
        agents,
        reasoning: `${issue.description}. ${issue.suggested_fix}`
    };
}
/**
 * Determines which agents should be deployed based on issues
 */
function determineSuggestedAgents(issues) {
    const agents = new Set();
    for (const issue of issues) {
        if (issue.type === 'failing_tests' || issue.type === 'low_test_coverage') {
            agents.add('loveless');
            agents.add('hollowed_eyes');
        }
        if (issue.type === 'build_failure' || issue.type === 'build_warnings') {
            agents.add('hollowed_eyes');
        }
        if (issue.type === 'security_errors') {
            agents.add('loveless');
            agents.add('the_didact');
            agents.add('hollowed_eyes');
        }
        if (issue.type === 'urgent_linear_issues') {
            agents.add('the_librarian');
            agents.add('hollowed_eyes');
        }
        if (issue.type === 'many_uncommitted_changes') {
            agents.add('the_curator');
        }
        if (issue.type === 'merge_conflicts') {
            agents.add('hollowed_eyes');
        }
    }
    return Array.from(agents);
}
//# sourceMappingURL=analyzer.js.map