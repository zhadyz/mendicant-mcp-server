/**
 * BOOTSTRAP - Synthetic Training Data Generator
 *
 * Solves the cold-start problem by generating realistic execution patterns
 * before Mendicant has real-world experience. This seeds Mahoraga with
 * knowledge so pattern matching and predictions work from day 1.
 */
import { COMMON_PATTERNS } from './patterns.js';
// Known agents with their typical token usage for bootstrap generation
const AGENT_TOKEN_USAGE = {
    'hollowed_eyes': 50000,
    'loveless': 30000,
    'the_architect': 45000,
    'the_didact': 35000,
    'the_librarian': 25000,
    'the_curator': 30000,
    'the_scribe': 20000,
    'cinna': 35000,
    'the_sentinel': 25000,
    'zhadyz': 30000,
    'the_cartographer': 20000,
    'the_oracle': 40000
};
/**
 * Generate synthetic bootstrap patterns for Mahoraga
 */
export function generateBootstrapPatterns(count = 100) {
    const patterns = [];
    // Generate patterns for each common pattern type
    const patternTypes = Object.keys(COMMON_PATTERNS);
    const patternsPerType = Math.ceil(count / patternTypes.length);
    for (const patternKey of patternTypes) {
        const pattern = COMMON_PATTERNS[patternKey];
        // Generate multiple variations of this pattern
        for (let i = 0; i < patternsPerType; i++) {
            const projectContext = randomProjectContext();
            const plan = pattern.generatePlan(projectContext);
            // 70% success rate for realistic learning
            const shouldSucceed = Math.random() < 0.7;
            const syntheticPattern = generatePatternExecution(plan.agents.map(a => a.agent_id), pattern.description, projectContext, shouldSucceed, plan.execution_strategy);
            patterns.push(syntheticPattern);
        }
    }
    // Add some custom agent combination patterns for diversity
    patterns.push(...generateDiversePatterns(20));
    return patterns.slice(0, count);
}
/**
 * Generate a synthetic execution pattern
 */
function generatePatternExecution(agentIds, objective, projectContext, shouldSucceed, strategy) {
    const timestamp = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // Last 30 days
    // Generate agent results
    const agentResults = [];
    let totalDuration = 0;
    let totalTokens = 0;
    let failureReason;
    for (let i = 0; i < agentIds.length; i++) {
        const agentId = agentIds[i];
        // Determine if this agent should fail (if pattern should fail)
        const isFinalAgent = i === agentIds.length - 1;
        const shouldAgentFail = !shouldSucceed && isFinalAgent;
        // Generate realistic tokens and duration based on agent
        const baseTokens = AGENT_TOKEN_USAGE[agentId] || 40000;
        const tokens = Math.floor(baseTokens * (0.8 + Math.random() * 0.4)); // ±20% variation
        const duration = Math.floor((tokens / 20) * 1000); // ~20 tokens/sec
        totalTokens += tokens;
        totalDuration += duration;
        if (shouldAgentFail) {
            failureReason = generateFailureReason(agentId, projectContext);
            agentResults.push({
                agent_id: agentId,
                output: failureReason,
                success: false,
                tokens_used: tokens,
                duration_ms: duration
            });
            break; // Stop execution on failure
        }
        else {
            agentResults.push({
                agent_id: agentId,
                output: `Successfully completed ${agentId} tasks for: ${objective}`,
                success: true,
                tokens_used: tokens,
                duration_ms: duration
            });
        }
    }
    const objectiveType = extractObjectiveType(objective);
    const tags = extractTags(objective, projectContext);
    return {
        id: `synthetic_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        objective,
        objective_type: objectiveType,
        project_context: projectContext,
        agents_used: agentIds,
        execution_order: agentResults.map(r => r.agent_id),
        agent_results: agentResults,
        success: shouldSucceed,
        total_duration_ms: totalDuration,
        total_tokens: totalTokens,
        conflicts: shouldSucceed ? [] : generateRandomConflicts(),
        gaps: shouldSucceed ? [] : generateRandomGaps(),
        verification_passed: shouldSucceed && agentIds.includes('loveless'),
        failure_reason: failureReason,
        tags
    };
}
/**
 * Generate diverse patterns with unconventional agent combinations
 */
function generateDiversePatterns(count) {
    const patterns = [];
    const diverseCombinations = [
        // Research-heavy patterns
        {
            agents: ['the_didact', 'the_architect', 'hollowed_eyes'],
            objective: 'Research and implement new machine learning feature',
            type: 'research'
        },
        // Security-focused patterns  
        {
            agents: ['loveless', 'the_curator', 'hollowed_eyes', 'loveless'],
            objective: 'Fix security vulnerabilities in authentication system',
            type: 'security'
        },
        // Documentation patterns
        {
            agents: ['the_scribe', 'the_didact'],
            objective: 'Create comprehensive API documentation',
            type: 'document'
        },
        // Infrastructure patterns
        {
            agents: ['the_cartographer', 'zhadyz', 'loveless'],
            objective: 'Deploy application to production with CI/CD',
            type: 'deploy'
        },
        // Analysis patterns
        {
            agents: ['the_analyst', 'the_oracle'],
            objective: 'Analyze user metrics and provide strategic recommendations',
            type: 'research'
        },
        // Design patterns
        {
            agents: ['cinna', 'the_architect', 'hollowed_eyes'],
            objective: 'Implement new design system for application',
            type: 'implement'
        }
    ];
    for (let i = 0; i < count; i++) {
        const combo = diverseCombinations[i % diverseCombinations.length];
        const projectContext = randomProjectContext();
        const shouldSucceed = Math.random() < 0.75; // Slightly higher success for diverse patterns
        patterns.push(generatePatternExecution(combo.agents, combo.objective, projectContext, shouldSucceed, 'sequential'));
    }
    return patterns;
}
/**
 * Generate realistic failure reasons based on agent and context
 */
function generateFailureReason(agentId, context) {
    const failureTemplates = {
        hollowed_eyes: [
            `TypeError: Cannot read property 'data' of undefined at ${context.project_type}/api.ts:42`,
            `Build failed: TypeScript errors in ${context.project_type} components`,
            `Error: Module '${context.project_type}/utils' not found`,
            `Compilation error: Type mismatch in ${context.project_type} implementation`
        ],
        loveless: [
            `Test suite failed: 5 of 48 tests failing in ${context.project_type}`,
            `Security vulnerability found: XSS in user input handling`,
            `Build verification failed: Missing environment variables`,
            `Cross-browser testing failed: Feature broken in Safari`
        ],
        the_cartographer: [
            `Deployment failed: Vercel build error - missing dependencies`,
            `Infrastructure setup failed: DNS configuration incorrect`,
            `Container orchestration failed: Docker image build error`,
            `SSL configuration failed: Certificate validation error`
        ],
        zhadyz: [
            `GitHub Actions workflow failed: Test stage errors`,
            `Release preparation failed: Version conflict detected`,
            `CI/CD pipeline failed: Docker registry authentication error`,
            `Deployment automation failed: Missing deployment credentials`
        ],
        the_architect: [
            `Architecture design incomplete: Missing scalability considerations`,
            `Design conflict: Proposed architecture incompatible with existing system`,
            `Architecture review failed: Performance concerns not addressed`,
            `Design validation failed: Security model insufficient`
        ]
    };
    const templates = failureTemplates[agentId] || [
        `${agentId} failed: Unexpected error occurred`,
        `${agentId} failed: Task could not be completed`,
        `${agentId} failed: Requirements not met`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}
/**
 * Generate random project context for diversity
 */
function randomProjectContext() {
    const projectTypes = ['nextjs', 'python', 'rust', 'typescript', 'react', 'node'];
    const hasTests = Math.random() < 0.7; // 70% of projects have tests
    return {
        project_type: projectTypes[Math.floor(Math.random() * projectTypes.length)],
        has_tests: hasTests
    };
}
/**
 * Generate random conflicts for failed executions
 */
function generateRandomConflicts() {
    if (Math.random() < 0.7)
        return []; // Most executions have no conflicts
    const possibleConflicts = [
        {
            description: 'Agent outputs contain contradictory recommendations',
            agents: ['the_didact', 'the_architect'],
            resolution: 'Prioritize the_architect recommendations for architecture decisions'
        },
        {
            description: 'Multiple agents modifying same files',
            agents: ['hollowed_eyes', 'the_curator'],
            resolution: 'Run the_curator before hollowed_eyes to avoid conflicts'
        }
    ];
    return [possibleConflicts[Math.floor(Math.random() * possibleConflicts.length)]];
}
/**
 * Generate random gaps for failed executions
 */
function generateRandomGaps() {
    if (Math.random() < 0.6)
        return []; // Many executions have no gaps
    const possibleGaps = [
        {
            description: 'No agent assigned to handle test execution',
            suggested_action: 'Add loveless for QA and testing'
        },
        {
            description: 'Implementation not verified before deployment',
            suggested_action: 'Add loveless for verification step'
        },
        {
            description: 'Implementation attempted without research phase',
            suggested_action: 'Add the_didact for research before implementation'
        }
    ];
    return [possibleGaps[Math.floor(Math.random() * possibleGaps.length)]];
}
/**
 * Extract objective type from objective string
 */
function extractObjectiveType(objective) {
    const lower = objective.toLowerCase();
    if (lower.includes('implement') || lower.includes('create') || lower.includes('add'))
        return 'implement';
    if (lower.includes('fix') || lower.includes('bug'))
        return 'fix';
    if (lower.includes('test') || lower.includes('verify'))
        return 'test';
    if (lower.includes('deploy') || lower.includes('release'))
        return 'deploy';
    if (lower.includes('refactor') || lower.includes('cleanup'))
        return 'refactor';
    if (lower.includes('document') || lower.includes('readme'))
        return 'document';
    if (lower.includes('security') || lower.includes('audit'))
        return 'security';
    if (lower.includes('research') || lower.includes('investigate'))
        return 'research';
    return 'general';
}
/**
 * Extract tags from objective and context
 */
function extractTags(objective, context) {
    const tags = [];
    const lower = objective.toLowerCase();
    // Technology tags
    if (lower.includes('react'))
        tags.push('react');
    if (lower.includes('nextjs') || lower.includes('next.js'))
        tags.push('nextjs');
    if (lower.includes('typescript'))
        tags.push('typescript');
    if (lower.includes('python'))
        tags.push('python');
    if (lower.includes('docker'))
        tags.push('docker');
    if (lower.includes('api'))
        tags.push('api');
    if (lower.includes('database') || lower.includes('db'))
        tags.push('database');
    if (lower.includes('auth'))
        tags.push('auth');
    if (lower.includes('security'))
        tags.push('security');
    if (lower.includes('ui') || lower.includes('frontend'))
        tags.push('frontend');
    if (lower.includes('backend'))
        tags.push('backend');
    if (lower.includes('machine learning') || lower.includes('ml'))
        tags.push('ml');
    // Context tags
    if (context.project_type)
        tags.push(context.project_type);
    if (context.has_tests)
        tags.push('has_tests');
    return tags;
}
//# sourceMappingURL=bootstrap.js.map