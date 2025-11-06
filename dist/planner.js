import { selectAgentsFromRegistry, estimateTokensFromRegistry, getAgentSpec } from './knowledge/agent_specs.js';
import { matchPattern } from './knowledge/patterns.js';
import { findSimilarExecutions, shouldReusePattern, recommendAgents } from './integration/mnemosyne.js';
import { mahoraga } from './knowledge/mahoraga.js';
import { detectVagueRequest, shouldInvokeLibrarian } from './knowledge/vague_detector.js';
import { analyzeObjectiveSemantic, getCapabilitiesFromAnalysis } from './knowledge/semantic_selector.js';
import { checkMandatoryAgents, addMandatoryAgents } from './knowledge/mandatory_enforcer.js';
import { enforceConstraints, validatePlan } from './knowledge/constraint_enforcer.js';
import { detectPlanConflicts } from './knowledge/conflict_detector.js';
import { memoryBridge } from './knowledge/memory_bridge.js';
import { validateSafety, shouldBlockExecution } from './knowledge/safety_validator.js';
import { validateConfidence, suggestFallbackAgents, getConfidenceMessage } from './knowledge/confidence_validator.js';
/**
 * Creates an orchestration plan for a given objective
 *
 * Strategy:
 * 1. Check mnemosyne for similar past executions (if provided)
 * 2. Try to match against common patterns
 * 3. Generate custom plan if no pattern matches
 */
export async function createPlan(objective, context, constraints, pastExecutions) {
    // 0. SAFETY VALIDATION - Check for dangerous/destructive objectives FIRST
    const safetyAnalysis = validateSafety(objective);
    if (shouldBlockExecution(safetyAnalysis)) {
        // CRITICAL: Block execution immediately
        throw new Error(`SAFETY VIOLATION: Objective blocked due to ${safetyAnalysis.threat_level} threat level.\n` +
            `Detected threats:\n${safetyAnalysis.detected_threats.map(t => `  - [${t.severity.toUpperCase()}] ${t.type}: ${t.description}`).join('\n')}\n\n` +
            `Recommendations:\n${safetyAnalysis.recommendations.map(r => `  - ${r}`).join('\n')}\n\n` +
            `If this objective is legitimately authorized, please rephrase to be more specific and include authorization context.`);
    }
    // 0.5. VAGUE REQUEST DETECTION - Detect if objective is too vague and needs clarification
    const vagueAnalysis = detectVagueRequest(objective);
    if (shouldInvokeLibrarian(vagueAnalysis)) {
        // Return a plan with the_librarian as mandatory first step
        return {
            agents: [{
                    agent_id: 'the_librarian',
                    task_description: 'Requirements clarification for vague objective',
                    prompt: `The objective "${objective}" is too vague. Your role:\n- Ask clarifying questions to understand user intent\n- Identify missing details: ${vagueAnalysis.missing_context.join(', ')}\n- Expand into specific, actionable requirements\n\nVagueness indicators: ${vagueAnalysis.vagueness_indicators.join(', ')}\nSuggested clarifications: ${vagueAnalysis.suggested_clarifications.join(', ')}`,
                    dependencies: [],
                    priority: 'critical'
                }],
            execution_strategy: 'sequential',
            success_criteria: 'User provides clear, detailed requirements',
            estimated_tokens: 15000,
            reasoning: `Objective too vague (confidence: ${(vagueAnalysis.confidence * 100).toFixed(0)}%). the_librarian invoked for requirements gathering before planning.`
        };
    }
    // 0.5. LONG-TERM MEMORY RETRIEVAL - Query Mnemosyne for relevant past patterns
    // This loads successful patterns from persistent storage into working memory
    let mnemosynePatterns = [];
    try {
        const semantic = analyzeObjectiveSemantic(objective);
        mnemosynePatterns = await memoryBridge.retrieveRelevantPatterns({
            objective,
            project_context: context,
            intent: semantic.intent,
            domain: semantic.domain,
            limit: 5
        });
        if (mnemosynePatterns.length > 0) {
            console.log(`[Memory Bridge] Retrieved ${mnemosynePatterns.length} relevant patterns from Mnemosyne`);
        }
    }
    catch (err) {
        console.error('[Memory Bridge] Failed to retrieve patterns from Mnemosyne:', err);
    }
    // Combine Mnemosyne patterns with provided pastExecutions
    const allPastExecutions = [...(pastExecutions || []), ...mnemosynePatterns];
    // 1. Try to reuse a proven pattern from past executions (RAM + Mnemosyne)
    if (allPastExecutions && allPastExecutions.length > 0) {
        const similarExecutions = findSimilarExecutions(objective, allPastExecutions);
        for (const pastExec of similarExecutions) {
            if (shouldReusePattern(pastExec, objective)) {
                return {
                    ...pastExec.plan,
                    reasoning: `Reusing proven pattern from past successful execution. Success rate: ${pastExec.metadata.success_rate}`
                };
            }
        }
    }
    // 2. Try to match against common patterns
    const pattern = matchPattern(objective);
    if (pattern) {
        const plan = pattern.generatePlan(context);
        return {
            ...plan,
            reasoning: `Matched common pattern: ${pattern.name}. ${plan.reasoning || ''}`
        };
    }
    // 3. Generate custom plan
    return generateCustomPlan(objective, context, constraints, pastExecutions);
}
/**
 * Generates a custom orchestration plan from scratch
 */
async function generateCustomPlan(objective, context, constraints, pastExecutions) {
    // SEMANTIC ANALYSIS - Analyze objective using intelligent semantic selection
    const semanticAnalysis = analyzeObjectiveSemantic(objective);
    const requiredCapabilities = getCapabilitiesFromAnalysis(semanticAnalysis);
    // Start with semantically recommended agents (high confidence)
    let agents = semanticAnalysis.recommended_agents.length > 0
        ? semanticAnalysis.recommended_agents
        : await selectAgentsFromRegistry(requiredCapabilities);
    // Consider recommendations from past executions
    if (pastExecutions && pastExecutions.length > 0) {
        const recommended = recommendAgents(objective, pastExecutions);
        if (recommended.length > 0) {
            // Merge with selected agents, preferring recommended ones
            agents = [...new Set([...recommended, ...agents])];
        }
    }
    // Use Mahoraga predictive intelligence to rank agents by predicted success
    const predictiveScores = mahoraga.predictAgents(agents, objective, context);
    // Sort agents by predicted success rate (highest first)
    agents = predictiveScores
        .sort((a, b) => b.predicted_success_rate - a.predicted_success_rate)
        .map(score => score.agent_id);
    // Create agent specs with prompts (async now)
    let agentSpecs = await Promise.all(agents.map(agentId => createAgentSpec(agentId, objective, context)));
    // MANDATORY AGENT ENFORCEMENT - Ensure critical agents are included
    const mandatoryChecks = await checkMandatoryAgents(objective, agentSpecs, context);
    if (mandatoryChecks.length > 0) {
        agentSpecs = await addMandatoryAgents(agentSpecs, mandatoryChecks, objective, context);
    }
    // Determine execution strategy
    const execution_strategy = determineExecutionStrategy(agentSpecs, constraints);
    // Build phases if phased execution
    const phases = execution_strategy === 'phased'
        ? buildPhases(agentSpecs)
        : undefined;
    // Estimate tokens using registry
    let estimated_tokens = await estimateTokensFromRegistry(agentSpecs.map(a => a.agent_id));
    // CONFLICT DETECTION - Check for plan conflicts before execution
    const conflictAnalysis = detectPlanConflicts(agentSpecs);
    if (!conflictAnalysis.safe_to_execute) {
        // Add conflict warnings to reasoning
        const conflictMessages = conflictAnalysis.conflicts.map(c => c.description).join('; ');
        throw new Error(`Plan has conflicts that must be resolved: ${conflictMessages}`);
    }
    // CONSTRAINT ENFORCEMENT - Rigorously enforce constraints
    const enforcement = enforceConstraints(agentSpecs, estimated_tokens, constraints);
    if (!enforcement.compliant) {
        // Auto-fix violations if possible
        if (enforcement.adjusted_agents && enforcement.adjusted_estimated_tokens) {
            agentSpecs = enforcement.adjusted_agents;
            estimated_tokens = enforcement.adjusted_estimated_tokens;
            // Log what was adjusted
            const violationMessages = enforcement.violations.map(v => v.message).join('; ');
            console.warn(`[CONSTRAINT ENFORCEMENT] Auto-adjusted plan to meet constraints: ${violationMessages}`);
        }
        else {
            // If can't auto-fix, throw error
            const violationMessages = enforcement.violations.map(v => v.message).join('; ');
            throw new Error(`Plan violates constraints: ${violationMessages}`);
        }
    }
    // Validate plan safety
    const validation = validatePlan(agentSpecs, estimated_tokens, constraints);
    if (!validation.safe && validation.warnings.length > 0) {
        console.warn(`[PLAN VALIDATION] Warnings: ${validation.warnings.join('; ')}`);
    }
    // CONFIDENCE VALIDATION - Validate overall confidence before execution
    const mahoragaTopConfidence = predictiveScores.length > 0 ? predictiveScores[0].confidence : undefined;
    const confidenceAnalysis = validateConfidence({
        agents: agentSpecs,
        execution_strategy,
        phases,
        success_criteria: deriveSuccessCriteria(objective),
        estimated_tokens,
        reasoning: '' // Will be filled below
    }, semanticAnalysis.confidence, mahoragaTopConfidence, undefined, // No pattern confidence for custom plans
    constraints?.confidence_thresholds);
    // Check if confidence is too low
    if (!confidenceAnalysis.should_execute) {
        // Low confidence - suggest fallback agents
        const fallbackAgents = suggestFallbackAgents(confidenceAnalysis.overall_confidence, {
            agents: agentSpecs,
            execution_strategy,
            success_criteria: deriveSuccessCriteria(objective),
            estimated_tokens,
            reasoning: ''
        });
        if (fallbackAgents.length > 0) {
            console.warn(`[CONFIDENCE VALIDATION] Low confidence (${(confidenceAnalysis.overall_confidence * 100).toFixed(0)}%) - Adding fallback agents: ${fallbackAgents.join(', ')}`);
            // Add fallback agents to plan
            for (const fallbackId of fallbackAgents) {
                const fallbackSpec = await createAgentSpec(fallbackId, objective, context);
                agentSpecs.unshift(fallbackSpec); // Add at beginning
            }
            // Recalculate estimated tokens
            estimated_tokens = await estimateTokensFromRegistry(agentSpecs.map(a => a.agent_id));
        }
        else {
            // No fallback agents available - throw error with recommendations
            throw new Error(`CONFIDENCE TOO LOW: Plan confidence is ${(confidenceAnalysis.overall_confidence * 100).toFixed(0)}%, below minimum threshold.\n\n` +
                `Confidence Level: ${confidenceAnalysis.confidence_level}\n` +
                `Warnings:\n${confidenceAnalysis.warnings.map(w => `  - ${w}`).join('\n')}\n\n` +
                `Recommendations:\n${confidenceAnalysis.recommendations.map(r => `  - ${r}`).join('\n')}`);
        }
    }
    // Build reasoning with Mahoraga insights and semantic analysis
    let reasoning = `Custom plan generated for objective. Semantic analysis: Intent=${semanticAnalysis.intent}, Domain=${semanticAnalysis.domain}, TaskType=${semanticAnalysis.task_type}, Confidence=${(semanticAnalysis.confidence * 100).toFixed(0)}%. ${semanticAnalysis.reasoning}. ${getConfidenceMessage(confidenceAnalysis)}`;
    if (predictiveScores.length > 0) {
        const topAgent = predictiveScores[0];
        reasoning += ` Mahoraga predictive intelligence ranked agents by success probability. Top agent: ${topAgent.agent_id} (${(topAgent.predicted_success_rate * 100).toFixed(0)}% predicted success, confidence: ${(topAgent.confidence * 100).toFixed(0)}%).`;
        if (topAgent.historical_performance.similar_objectives > 0) {
            reasoning += ` Based on ${topAgent.historical_performance.similar_objectives} similar past executions.`;
        }
    }
    if (mandatoryChecks.length > 0) {
        reasoning += ` Mandatory agents enforced: ${mandatoryChecks.map(c => c.agent_id).join(', ')}.`;
    }
    if (conflictAnalysis.warnings.length > 0) {
        reasoning += ` Warnings: ${conflictAnalysis.warnings.map(w => w.description).join('; ')}.`;
    }
    return {
        agents: agentSpecs,
        execution_strategy,
        phases,
        success_criteria: deriveSuccessCriteria(objective),
        estimated_tokens,
        reasoning
    };
}
/**
 * Analyzes objective to determine what capabilities are needed
 */
function analyzeObjective(objective) {
    const lower = objective.toLowerCase();
    const capabilities = [];
    // Implementation/coding keywords
    if (lower.includes('implement') || lower.includes('code') || lower.includes('develop') ||
        lower.includes('create') || lower.includes('build') || lower.includes('add')) {
        capabilities.push('code_implementation', 'github_operations');
    }
    // Testing/QA keywords
    if (lower.includes('test') || lower.includes('verify') || lower.includes('check') ||
        lower.includes('validate')) {
        capabilities.push('test_execution', 'quality_assurance');
    }
    // Security keywords
    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('audit')) {
        capabilities.push('security_validation', 'vulnerability_scanning');
    }
    // Architecture/design keywords
    if (lower.includes('design') || lower.includes('architecture') || lower.includes('structure')) {
        capabilities.push('architecture_design', 'design_patterns');
    }
    // Research keywords
    if (lower.includes('research') || lower.includes('investigate') || lower.includes('explore')) {
        capabilities.push('documentation_research', 'investigation');
    }
    // Documentation keywords
    if (lower.includes('document') || lower.includes('readme') || lower.includes('docs')) {
        capabilities.push('technical_writing', 'api_documentation');
    }
    // Deployment keywords
    if (lower.includes('deploy') || lower.includes('release') || lower.includes('publish')) {
        capabilities.push('deployment_automation', 'release_preparation');
    }
    // Maintenance keywords
    if (lower.includes('update') || lower.includes('upgrade') || lower.includes('cleanup') ||
        lower.includes('refactor')) {
        capabilities.push('dependency_updates', 'code_organization');
    }
    // CI/CD keywords
    if (lower.includes('ci') || lower.includes('cd') || lower.includes('pipeline') ||
        lower.includes('workflow')) {
        capabilities.push('github_actions', 'testing_automation');
    }
    // Design/UI keywords
    if (lower.includes('design system') || lower.includes('ui') || lower.includes('ux') ||
        lower.includes('style')) {
        capabilities.push('visual_design', 'ui_ux_design');
    }
    // Infrastructure keywords
    if (lower.includes('infrastructure') || lower.includes('docker') || lower.includes('vercel')) {
        capabilities.push('vercel_deployment', 'docker_orchestration');
    }
    // If no specific capabilities detected, add general ones
    if (capabilities.length === 0) {
        capabilities.push('code_implementation', 'quality_assurance');
    }
    return capabilities;
}
/**
 * Creates an agent spec with optimized prompt
 */
async function createAgentSpec(agentId, objective, context) {
    const spec = await getAgentSpec(agentId);
    if (!spec) {
        throw new Error(`Agent ${agentId} not found in registry`);
    }
    const dependencies = [];
    // Determine dependencies
    if (agentId === 'loveless' && objective.toLowerCase().includes('implement')) {
        dependencies.push('hollowed_eyes');
    }
    if (agentId === 'hollowed_eyes' && objective.toLowerCase().includes('architecture')) {
        dependencies.push('the_architect');
    }
    if (agentId === 'the_scribe' && (objective.toLowerCase().includes('implement') ||
        objective.toLowerCase().includes('feature'))) {
        dependencies.push('hollowed_eyes');
    }
    // Generate optimized prompt
    const prompt = await generatePrompt(agentId, objective, spec.specialization, context);
    // Determine priority
    const priority = determinePriority(agentId, objective);
    return {
        agent_id: agentId,
        task_description: `${spec.specialization.replace(/_/g, ' ')} for: ${objective}`,
        prompt,
        dependencies,
        priority
    };
}
/**
 * Generates optimized prompt for an agent
 */
async function generatePrompt(agentId, objective, specialization, context) {
    const spec = await getAgentSpec(agentId);
    if (!spec) {
        throw new Error(`Agent ${agentId} not found in registry`);
    }
    let prompt = `You are ${agentId}, specialist in ${specialization.replace(/_/g, ' ')}.\n\n`;
    prompt += `Objective: ${objective}\n\n`;
    if (context?.project_type) {
        prompt += `Project Type: ${context.project_type}\n`;
    }
    prompt += `\nYour responsibilities:\n`;
    for (const capability of spec.capabilities) {
        prompt += `- ${capability.replace(/_/g, ' ')}\n`;
    }
    prompt += `\nFocus on your specialization and deliver high-quality work.`;
    // Add specific guidance based on agent
    if (agentId === 'loveless') {
        prompt += `\n\nREMEMBER: You must verify thoroughly. Nothing broken ships on your watch.`;
    }
    else if (agentId === 'hollowed_eyes') {
        prompt += `\n\nREMEMBER: Write clean, maintainable code following best practices.`;
    }
    else if (agentId === 'the_architect') {
        prompt += `\n\nREMEMBER: Simplicity is sophisticated. Design for change, not perfection.`;
    }
    return prompt;
}
/**
 * Determines priority for an agent based on objective
 */
function determinePriority(agentId, objective) {
    const lower = objective.toLowerCase();
    // loveless is always critical for verification
    if (agentId === 'loveless') {
        return 'critical';
    }
    // Implementation agents are critical for implementation objectives
    if (agentId === 'hollowed_eyes' &&
        (lower.includes('implement') || lower.includes('fix') || lower.includes('create'))) {
        return 'critical';
    }
    // Security work is always critical
    if (lower.includes('security') || lower.includes('vulnerability')) {
        return 'critical';
    }
    // Architecture is high priority for new projects/features
    if (agentId === 'the_architect' &&
        (lower.includes('new') || lower.includes('scaffold') || lower.includes('feature'))) {
        return 'high';
    }
    // Documentation is medium priority by default
    if (agentId === 'the_scribe') {
        return 'medium';
    }
    return 'high';
}
/**
 * Determines execution strategy based on agent dependencies
 */
function determineExecutionStrategy(agents, constraints) {
    if (constraints?.prefer_parallel) {
        return 'parallel';
    }
    // Check if any agents have dependencies
    const hasDependencies = agents.some(a => a.dependencies.length > 0);
    if (!hasDependencies) {
        return 'parallel';
    }
    // If there are clear phases (design -> implement -> verify), use phased
    const hasDesignPhase = agents.some(a => a.agent_id === 'the_architect' || a.agent_id === 'the_didact');
    const hasImplementPhase = agents.some(a => a.agent_id === 'hollowed_eyes');
    const hasVerifyPhase = agents.some(a => a.agent_id === 'loveless');
    if (hasDesignPhase && hasImplementPhase && hasVerifyPhase) {
        return 'phased';
    }
    return 'sequential';
}
/**
 * Builds phases for phased execution
 */
function buildPhases(agents) {
    const phases = [];
    // Phase 1: Research & Design (can run in parallel)
    const designAgents = agents.filter(a => a.agent_id === 'the_architect' ||
        a.agent_id === 'the_didact' ||
        a.agent_id === 'the_scribe');
    if (designAgents.length > 0) {
        phases.push({
            phase_name: 'Research & Design',
            agents: designAgents.map(a => a.agent_id),
            can_run_parallel: true
        });
    }
    // Phase 2: Implementation (sequential)
    const implAgents = agents.filter(a => a.agent_id === 'hollowed_eyes' ||
        a.agent_id === 'the_curator' ||
        a.agent_id === 'cinna');
    if (implAgents.length > 0) {
        phases.push({
            phase_name: 'Implementation',
            agents: implAgents.map(a => a.agent_id),
            can_run_parallel: false
        });
    }
    // Phase 3: Verification & Deployment (sequential)
    const verifyAgents = agents.filter(a => a.agent_id === 'loveless' ||
        a.agent_id === 'zhadyz' ||
        a.agent_id === 'the_sentinel' ||
        a.agent_id === 'the_cartographer');
    if (verifyAgents.length > 0) {
        phases.push({
            phase_name: 'Verification & Deployment',
            agents: verifyAgents.map(a => a.agent_id),
            can_run_parallel: false
        });
    }
    return phases;
}
/**
 * Derives success criteria from objective
 */
function deriveSuccessCriteria(objective) {
    const lower = objective.toLowerCase();
    if (lower.includes('test')) {
        return 'All tests pass, no regressions introduced';
    }
    if (lower.includes('security')) {
        return 'All vulnerabilities fixed, security audit passes';
    }
    if (lower.includes('deploy') || lower.includes('release')) {
        return 'Successfully deployed, all checks pass';
    }
    if (lower.includes('implement') || lower.includes('feature')) {
        return 'Feature implemented, tested, and documented';
    }
    if (lower.includes('fix') || lower.includes('bug')) {
        return 'Bug fixed and verified';
    }
    if (lower.includes('scaffold') || lower.includes('setup')) {
        return 'Project scaffolded, builds successfully, documentation complete';
    }
    return 'Objective completed successfully with verification';
}
//# sourceMappingURL=planner.js.map