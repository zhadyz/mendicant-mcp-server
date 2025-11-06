import { selectAgentsFromRegistry, estimateTokensFromRegistry, getAgentSpec } from './knowledge/agent_specs.js';
import { matchPattern } from './knowledge/patterns.js';
import { findSimilarExecutions, shouldReusePattern, recommendAgents } from './integration/mnemosyne.js';
import { mahoraga } from './knowledge/mahoraga.js';
import { detectVagueRequest, shouldInvokeLibrarian } from './knowledge/vague_detector.js';
// NEW: Advanced intelligence systems
import { semanticEmbedder } from './knowledge/semantic_embedder.js';
import { bayesianEngine } from './knowledge/bayesian_confidence.js';
import { temporalEngine } from './knowledge/temporal_decay.js';
import { paretoOptimizer } from './knowledge/pareto_optimizer.js';
import { conflictDetector } from './knowledge/predictive_conflict_detector.js';
// Legacy systems (gradually being replaced)
import { analyzeObjectiveSemantic, getCapabilitiesFromAnalysis } from './knowledge/semantic_selector.js';
import { checkMandatoryAgents, addMandatoryAgents } from './knowledge/mandatory_enforcer.js';
import { enforceConstraints, validatePlan } from './knowledge/constraint_enforcer.js';
import { detectPlanConflicts } from './knowledge/conflict_detector.js';
import { memoryBridge } from './knowledge/memory_bridge.js';
import { validateSafety, shouldBlockExecution } from './knowledge/safety_validator.js';
import { validateConfidence, getConfidenceMessage } from './knowledge/confidence_validator.js';
/**
 * Convert PastExecution (from Mnemosyne) to ExecutionPattern (for temporal engine and analysis)
 */
function convertPastExecutionToExecutionPattern(past) {
    return {
        id: `past-${past.timestamp}`,
        timestamp: past.timestamp,
        objective: past.objective,
        objective_type: 'unknown', // Not tracked in PastExecution
        project_context: past.project_context,
        agents_used: past.agents_used,
        execution_order: past.agents_used, // Assume sequential order
        agent_results: [], // Not tracked in PastExecution
        success: past.success,
        total_duration_ms: past.duration_ms,
        total_tokens: 0, // Not tracked in PastExecution
        conflicts: [], // Not tracked in PastExecution
        gaps: [], // Not tracked in PastExecution
        verification_passed: past.verification_passed,
        failure_reason: undefined,
        tags: past.tags || []
    };
}
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
    // Convert PastExecution[] to ExecutionPattern[] for temporal engine and other systems
    const executionPatterns = pastExecutions
        ? pastExecutions.map(convertPastExecutionToExecutionPattern)
        : [];
    // SEMANTIC ANALYSIS - NEW: Use advanced multi-label semantic embedder
    const semanticEmbedding = await semanticEmbedder.analyzeObjective(objective);
    console.log(`[Planner] Semantic analysis: confidence=${(semanticEmbedding.confidence * 100).toFixed(0)}%, complexity=${(semanticEmbedding.complexity_score * 100).toFixed(0)}%`);
    // Fallback to legacy semantic selector for capability extraction
    const semanticAnalysis = analyzeObjectiveSemantic(objective);
    const requiredCapabilities = getCapabilitiesFromAnalysis(semanticAnalysis);
    // Start with semantically recommended agents (high confidence)
    let agents = semanticAnalysis.recommended_agents.length > 0
        ? semanticAnalysis.recommended_agents
        : await selectAgentsFromRegistry(requiredCapabilities);
    // Consider recommendations from past executions - NEW: Apply temporal decay
    if (executionPatterns && executionPatterns.length > 0) {
        // Apply temporal decay to filter stale patterns
        const temporalHealth = temporalEngine.calculateTemporalHealth(executionPatterns);
        console.log(`[Planner] Temporal health: ${(temporalHealth.health_score * 100).toFixed(0)}% (fresh: ${temporalHealth.fresh_patterns}, stale: ${temporalHealth.stale_patterns})`);
        // Filter out very stale patterns (relevance < 0.2)
        const enrichedPatterns = temporalEngine.batchEnrich(executionPatterns);
        const freshPatterns = enrichedPatterns.filter(p => p.temporal_relevance >= 0.2);
        if (freshPatterns.length < executionPatterns.length) {
            console.log(`[Planner] Filtered ${executionPatterns.length - freshPatterns.length} stale patterns`);
        }
        const recommended = recommendAgents(objective, pastExecutions || []);
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
    // CONFLICT DETECTION - NEW: Use predictive conflict detector with learned patterns
    const predictiveConflictAnalysis = await conflictDetector.analyzeConflicts(agentSpecs.map(a => a.agent_id), objective, semanticEmbedding, context);
    console.log(`[Planner] Conflict analysis: ${predictiveConflictAnalysis.predicted_conflicts.length} conflicts, conflict-free prob: ${(predictiveConflictAnalysis.conflict_free_probability * 100).toFixed(0)}%`);
    // Apply recommended conflict resolutions
    if (predictiveConflictAnalysis.recommended_reordering) {
        console.log(`[Planner] Applying recommended agent reordering to prevent conflicts`);
        const reorderedIds = predictiveConflictAnalysis.recommended_reordering;
        agentSpecs = reorderedIds
            .map(id => agentSpecs.find(s => s.agent_id === id))
            .filter((s) => s !== undefined);
    }
    if (predictiveConflictAnalysis.agents_to_remove && predictiveConflictAnalysis.agents_to_remove.length > 0) {
        console.log(`[Planner] Removing conflicting agents: ${predictiveConflictAnalysis.agents_to_remove.join(', ')}`);
        agentSpecs = agentSpecs.filter(s => !predictiveConflictAnalysis.agents_to_remove.includes(s.agent_id));
    }
    // Fallback to legacy conflict detector for additional checks
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
    // CONFIDENCE VALIDATION - NEW: Use Bayesian confidence engine with proper probabilistic inference
    const bayesianConfidence = bayesianEngine.calculateConfidence(agentSpecs.map(a => a.agent_id), semanticEmbedding, context, executionPatterns);
    console.log(`[Planner] Bayesian confidence: ${(bayesianConfidence.confidence * 100).toFixed(0)}% ± ${(bayesianConfidence.uncertainty * 100).toFixed(0)}%`);
    console.log(`[Planner] Confidence interval: [${(bayesianConfidence.confidence_interval[0] * 100).toFixed(0)}%, ${(bayesianConfidence.confidence_interval[1] * 100).toFixed(0)}%]`);
    console.log(`[Planner] Calibration score: ${bayesianConfidence.calibration_score.toFixed(3)} (lower is better)`);
    if (bayesianConfidence.warnings.length > 0) {
        console.warn(`[Planner] Confidence warnings: ${bayesianConfidence.warnings.join('; ')}`);
    }
    // Check minimum confidence threshold
    const min_confidence = constraints?.confidence_thresholds?.minimum_overall || 0.3;
    const max_uncertainty = 0.3; // Maximum acceptable uncertainty
    if (bayesianConfidence.confidence < min_confidence || bayesianConfidence.uncertainty > max_uncertainty) {
        console.warn(`[Planner] Confidence too low or uncertainty too high - applying Pareto optimization`);
        // Use Pareto optimizer to find better plan
        // Generate alternative plans with different agent combinations
        const alternativePlans = [
            agentSpecs.map(a => a.agent_id), // Current plan
            ...generateAlternativePlans(agentSpecs, 3) // 3 alternatives
        ];
        const paretoResult = await paretoOptimizer.optimize(objective, alternativePlans, semanticEmbedding, context, executionPatterns);
        console.log(`[Planner] Pareto optimization: ${paretoResult.pareto_frontier.length} optimal solutions found`);
        console.log(`[Planner] Recommended: ${paretoResult.recommended_plan.agents.length} agents, accuracy: ${(paretoResult.recommended_plan.scores.accuracy * 100).toFixed(0)}%`);
        // Use recommended plan
        agents = paretoResult.recommended_plan.agents;
        agentSpecs = await Promise.all(agents.map(agentId => createAgentSpec(agentId, objective, context)));
        estimated_tokens = paretoResult.recommended_plan.raw_metrics.estimated_tokens;
    }
    // Fallback to legacy confidence validator for additional checks
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
    // Build reasoning with ALL intelligence systems
    let reasoning = `Custom plan generated with advanced intelligence systems. `;
    // Semantic embedding analysis
    reasoning += `Semantic: ${Array.from(semanticEmbedding.intent_scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([intent, score]) => `${intent}(${(score * 100).toFixed(0)}%)`)
        .join(', ')}. `;
    // Bayesian confidence
    reasoning += `Confidence: ${(bayesianConfidence.confidence * 100).toFixed(0)}% [${(bayesianConfidence.confidence_interval[0] * 100).toFixed(0)}%-${(bayesianConfidence.confidence_interval[1] * 100).toFixed(0)}%], uncertainty: ${(bayesianConfidence.uncertainty * 100).toFixed(0)}%. `;
    // Temporal decay
    if (executionPatterns && executionPatterns.length > 0) {
        const temporalHealth = temporalEngine.calculateTemporalHealth(executionPatterns);
        reasoning += `Temporal health: ${(temporalHealth.health_score * 100).toFixed(0)}% (${temporalHealth.fresh_patterns} fresh patterns). `;
    }
    // Predictive conflicts
    if (predictiveConflictAnalysis.predicted_conflicts.length > 0) {
        reasoning += `Conflicts: ${predictiveConflictAnalysis.predicted_conflicts.length} predicted (${(predictiveConflictAnalysis.conflict_free_probability * 100).toFixed(0)}% conflict-free). `;
    }
    // Mahoraga predictions
    if (predictiveScores.length > 0) {
        const topAgent = predictiveScores[0];
        reasoning += `Top agent: ${topAgent.agent_id} (${(topAgent.predicted_success_rate * 100).toFixed(0)}% predicted success). `;
    }
    // Legacy compatibility
    reasoning += `${semanticAnalysis.reasoning}. ${getConfidenceMessage(confidenceAnalysis)}`;
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
/**
 * Generates alternative agent plans for Pareto optimization
 * Creates variations by removing/substituting agents
 */
function generateAlternativePlans(baseSpecs, count) {
    const alternatives = [];
    const baseAgents = baseSpecs.map(s => s.agent_id);
    // Alternative 1: Remove lowest priority agent
    if (baseSpecs.length > 1) {
        const withoutLowest = baseSpecs
            .filter(s => s.priority !== 'low')
            .map(s => s.agent_id);
        if (withoutLowest.length > 0) {
            alternatives.push(withoutLowest);
        }
    }
    // Alternative 2: Keep only critical and high priority
    const highPriorityOnly = baseSpecs
        .filter(s => s.priority === 'critical' || s.priority === 'high')
        .map(s => s.agent_id);
    if (highPriorityOnly.length > 0 && highPriorityOnly.length < baseAgents.length) {
        alternatives.push(highPriorityOnly);
    }
    // Alternative 3: Remove duplicates by agent type
    const uniqueTypes = new Set();
    const noDuplicates = [];
    for (const agent of baseAgents) {
        const type = agent.split('_')[0]; // e.g., "hollowed" from "hollowed_eyes"
        if (!uniqueTypes.has(type)) {
            uniqueTypes.add(type);
            noDuplicates.push(agent);
        }
    }
    if (noDuplicates.length > 0 && noDuplicates.length < baseAgents.length) {
        alternatives.push(noDuplicates);
    }
    return alternatives.slice(0, count);
}
//# sourceMappingURL=planner.js.map