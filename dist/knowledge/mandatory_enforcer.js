/**
 * MANDATORY AGENT ENFORCER
 *
 * Ensures mandatory agents (oracle, librarian, loveless) are included when required.
 * Prevents critical oversight of required validation/clarification steps.
 */
import { getAgentSpec } from './agent_specs.js';
/**
 * Check which mandatory agents should be included
 */
export async function checkMandatoryAgents(objective, currentAgents, projectContext) {
    const checks = [];
    const currentAgentIds = currentAgents.map(a => a.agent_id);
    // THE_ORACLE - Mandatory for major decisions and post-completion review
    const needsOracle = await shouldIncludeOracle(objective, currentAgentIds);
    if (needsOracle) {
        checks.push({
            agent_id: 'the_oracle',
            reason: needsOracle,
            must_include: true,
            suggested_priority: 'critical'
        });
    }
    // THE_LIBRARIAN - Mandatory for vague requests
    const needsLibrarian = await shouldIncludeLibrarian(objective, currentAgentIds);
    if (needsLibrarian) {
        checks.push({
            agent_id: 'the_librarian',
            reason: needsLibrarian,
            must_include: true,
            suggested_priority: 'critical'
        });
    }
    // LOVELESS - Mandatory for all implementations
    const needsLoveless = await shouldIncludeLoveless(objective, currentAgentIds);
    if (needsLoveless) {
        checks.push({
            agent_id: 'loveless',
            reason: needsLoveless,
            must_include: true,
            suggested_priority: 'critical'
        });
    }
    return checks;
}
/**
 * Determines if the_oracle is mandatory
 */
async function shouldIncludeOracle(objective, currentAgents) {
    if (currentAgents.includes('the_oracle')) {
        return null; // Already included
    }
    const lower = objective.toLowerCase();
    // Major decisions
    const majorDecisionKeywords = [
        'delete everything',
        'start over',
        'remove all',
        'complete rewrite',
        'major refactor',
        'change architecture',
        'switch to',
        'migrate to',
        'replace entire'
    ];
    for (const keyword of majorDecisionKeywords) {
        if (lower.includes(keyword)) {
            return `Major decision detected: "${keyword}". the_oracle required for strategic validation.`;
        }
    }
    // Destructive operations
    if (/\b(delete|remove|drop|destroy)\b.*\b(database|table|production|all|everything)\b/.test(lower)) {
        return 'Destructive operation detected. the_oracle required to validate decision.';
    }
    // Large scope changes
    if (lower.includes('entire') ||
        lower.includes('complete') && (lower.includes('change') || lower.includes('rewrite'))) {
        return 'Large scope change detected. the_oracle required for risk assessment.';
    }
    return null;
}
/**
 * Determines if the_librarian is mandatory
 */
async function shouldIncludeLibrarian(objective, currentAgents) {
    if (currentAgents.includes('the_librarian')) {
        return null; // Already included
    }
    const lower = objective.toLowerCase().trim();
    const words = lower.split(/\s+/);
    // Ultra vague phrases
    const ultraVaguePatterns = [
        /^make it better$/,
        /^improve (it|this|that)$/,
        /^fix (it|this|that)$/,
        /^update (it|this|that)$/,
        /^help( me)?$/,
        /^can you/,
    ];
    for (const pattern of ultraVaguePatterns) {
        if (pattern.test(lower)) {
            return `Vague request: "${objective}". the_librarian required for requirements clarification.`;
        }
    }
    // Very short objectives
    if (words.length < 3) {
        return `Insufficient detail (${words.length} words). the_librarian required to expand requirements.`;
    }
    // Ambiguous pronouns without context
    const pronouns = ['it', 'this', 'that', 'them', 'those'];
    if (pronouns.some(p => words.includes(p)) && words.length < 5) {
        return 'Ambiguous pronouns detected without context. the_librarian required for clarification.';
    }
    return null;
}
/**
 * Determines if loveless is mandatory
 */
async function shouldIncludeLoveless(objective, currentAgents) {
    if (currentAgents.includes('loveless')) {
        return null; // Already included
    }
    const lower = objective.toLowerCase();
    // Implementation keywords
    const implementationKeywords = [
        'implement',
        'create',
        'build',
        'develop',
        'code',
        'write',
        'add feature'
    ];
    const hasImplementation = implementationKeywords.some(kw => lower.includes(kw));
    const hasHollowedEyes = currentAgents.includes('hollowed_eyes');
    if (hasImplementation || hasHollowedEyes) {
        return 'Implementation task detected. loveless required for quality assurance and verification.';
    }
    return null;
}
/**
 * Add mandatory agents to plan
 */
export async function addMandatoryAgents(agents, mandatoryChecks, objective, context) {
    const updatedAgents = [...agents];
    for (const check of mandatoryChecks) {
        if (!check.must_include)
            continue;
        const spec = await getAgentSpec(check.agent_id);
        if (!spec) {
            console.error(`[WARNING] Mandatory agent ${check.agent_id} not found in registry`);
            continue;
        }
        // Create agent spec
        const agentSpec = {
            agent_id: check.agent_id,
            task_description: `${spec.specialization.replace(/_/g, ' ')} for: ${objective}`,
            prompt: generateMandatoryPrompt(check.agent_id, objective, check.reason, context),
            dependencies: determineDependencies(check.agent_id, updatedAgents.map(a => a.agent_id)),
            priority: check.suggested_priority
        };
        updatedAgents.push(agentSpec);
    }
    return updatedAgents;
}
/**
 * Generate prompt for mandatory agent
 */
function generateMandatoryPrompt(agentId, objective, reason, context) {
    let prompt = `You are ${agentId}, invoked as a MANDATORY agent.\n\n`;
    prompt += `Reason for mandatory inclusion: ${reason}\n\n`;
    prompt += `Objective: ${objective}\n\n`;
    if (context?.project_type) {
        prompt += `Project Type: ${context.project_type}\n\n`;
    }
    if (agentId === 'the_oracle') {
        prompt += `Your critical role:\n`;
        prompt += `- Validate this decision from a strategic perspective\n`;
        prompt += `- Assess risks and potential consequences\n`;
        prompt += `- Provide go/no-go recommendation\n`;
        prompt += `- Suggest alternative approaches if this plan is risky\n\n`;
        prompt += `REMEMBER: You are the final sanity check. Be thorough and honest.`;
    }
    else if (agentId === 'the_librarian') {
        prompt += `Your critical role:\n`;
        prompt += `- Clarify vague or ambiguous requirements\n`;
        prompt += `- Expand the objective into specific, actionable tasks\n`;
        prompt += `- Ask critical questions to understand user intent\n`;
        prompt += `- Provide detailed specification for other agents\n\n`;
        prompt += `REMEMBER: Bridge the gap between user intent and execution.`;
    }
    else if (agentId === 'loveless') {
        prompt += `Your critical role:\n`;
        prompt += `- Verify implementation quality and correctness\n`;
        prompt += `- Run comprehensive tests and security checks\n`;
        prompt += `- Identify bugs, vulnerabilities, or issues\n`;
        prompt += `- Ensure nothing broken ships\n\n`;
        prompt += `REMEMBER: You are the quality gatekeeper. Be ruthlessly thorough.`;
    }
    return prompt;
}
/**
 * Determine dependencies for mandatory agent
 */
function determineDependencies(agentId, currentAgentIds) {
    if (agentId === 'the_oracle') {
        // Oracle runs after everything else for final validation
        return currentAgentIds.filter(id => id !== 'the_oracle');
    }
    if (agentId === 'the_librarian') {
        // Librarian runs first to clarify requirements
        return [];
    }
    if (agentId === 'loveless') {
        // Loveless runs after implementation
        if (currentAgentIds.includes('hollowed_eyes')) {
            return ['hollowed_eyes'];
        }
    }
    return [];
}
//# sourceMappingURL=mandatory_enforcer.js.map