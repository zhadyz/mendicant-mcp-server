import { agentRegistry } from './knowledge/agent_registry.js';
import { mahoraga } from './knowledge/mahoraga.js';
/**
 * Coordinates and synthesizes results from multiple agents
 *
 * This handles:
 * - Combining outputs into unified response
 * - Detecting conflicts between agents
 * - Identifying gaps in coverage
 * - Making recommendations for next steps
 * - Recording feedback for passive learning
 * - Recording execution patterns for Mahoraga adaptive learning
 */
export async function coordinateResults(objective, agentResults, plan, projectContext) {
    // Check if any agents failed
    const failures = agentResults.filter(r => !r.success);
    if (failures.length > 0) {
        return handleFailures(objective, agentResults, failures);
    }
    // Synthesize successful outputs
    const synthesis = synthesizeOutputs(objective, agentResults);
    // Detect conflicts
    const conflicts = detectConflicts(agentResults);
    // Identify gaps
    const gaps = identifyGaps(objective, agentResults);
    // Generate recommendations
    const recommendations = generateRecommendations(objective, agentResults, conflicts, gaps);
    // Determine if verification is needed
    const verification_needed = shouldVerify(agentResults);
    // Record feedback for passive learning (async, non-blocking)
    recordAgentFeedback(agentResults);
    // Record execution pattern for Mahoraga adaptive learning (async, non-blocking)
    if (plan) {
        recordExecutionPattern(objective, plan, agentResults, conflicts, gaps, projectContext);
    }
    return {
        synthesis,
        conflicts,
        gaps,
        recommendations,
        verification_needed
    };
}
/**
 * Records feedback from agent executions for passive learning
 * This runs async and doesn't block the coordinator response
 */
function recordAgentFeedback(results) {
    for (const result of results) {
        agentRegistry.recordFeedback({
            agent_id: result.agent_id,
            success: result.success,
            tokens_used: result.tokens_used,
            duration_ms: result.duration_ms
        }).catch(err => {
            console.error(`Failed to record feedback for ${result.agent_id}:`, err);
        });
    }
}
/**
 * Records complete execution pattern for Mahoraga adaptive learning
 * This captures the full context of what happened for future pattern matching
 */
function recordExecutionPattern(objective, plan, results, conflicts, gaps, projectContext) {
    try {
        mahoraga.recordExecution(objective, plan, results, conflicts, gaps, projectContext);
    }
    catch (err) {
        console.error('Failed to record execution pattern for Mahoraga:', err);
    }
}
/**
 * Handles cases where some agents failed
 */
function handleFailures(objective, allResults, failures) {
    const failureList = failures.map(f => `- ${f.agent_id}: ${extractErrorMessage(f.output)}`).join('\n');
    const synthesis = `## Execution Incomplete - Agent Failures

${failures.length} agent(s) failed to complete their tasks:

${failureList}

Successful agents: ${allResults.filter(r => r.success).map(r => r.agent_id).join(', ')}

Objective: ${objective}

**Action Required:** Fix the failures and re-run failed agents.`;
    return {
        synthesis,
        conflicts: [],
        gaps: [{
                description: `${failures.length} agent(s) failed`,
                suggested_action: 'Review error messages and re-execute failed agents'
            }],
        recommendations: [
            'Review failure messages carefully',
            'Fix any underlying issues',
            'Re-run failed agents',
            'Consider if failed agents are blockers for other work'
        ],
        verification_needed: true
    };
}
/**
 * Synthesizes outputs from all agents into unified response
 */
function synthesizeOutputs(objective, results) {
    let synthesis = `## Orchestration Complete: ${objective}\n\n`;
    // Group results by agent type
    const grouped = groupByType(results);
    // Design & Research Phase
    if (grouped.design.length > 0) {
        synthesis += `### Design & Research\n\n`;
        for (const result of grouped.design) {
            synthesis += `**${result.agent_id}:**\n${extractSummary(result.output)}\n\n`;
        }
    }
    // Implementation Phase
    if (grouped.implementation.length > 0) {
        synthesis += `### Implementation\n\n`;
        for (const result of grouped.implementation) {
            synthesis += `**${result.agent_id}:**\n${extractSummary(result.output)}\n\n`;
        }
    }
    // Verification & Deployment Phase
    if (grouped.verification.length > 0) {
        synthesis += `### Verification & Deployment\n\n`;
        for (const result of grouped.verification) {
            synthesis += `**${result.agent_id}:**\n${extractSummary(result.output)}\n\n`;
        }
    }
    // Performance Summary
    synthesis += `### Performance Metrics\n\n`;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
    const totalTokens = results.reduce((sum, r) => sum + (r.tokens_used || 0), 0);
    synthesis += `- Total Execution Time: ${(totalDuration / 1000).toFixed(2)}s\n`;
    synthesis += `- Total Tokens Used: ${totalTokens.toLocaleString()}\n`;
    synthesis += `- Agents Deployed: ${results.length}\n`;
    synthesis += `- Success Rate: ${(results.filter(r => r.success).length / results.length * 100).toFixed(0)}%\n`;
    return synthesis;
}
/**
 * Groups results by agent type (design/implementation/verification)
 */
function groupByType(results) {
    return {
        design: results.filter(r => r.agent_id === 'the_architect' ||
            r.agent_id === 'the_didact' ||
            r.agent_id === 'the_librarian'),
        implementation: results.filter(r => r.agent_id === 'hollowed_eyes' ||
            r.agent_id === 'the_curator' ||
            r.agent_id === 'the_scribe' ||
            r.agent_id === 'cinna'),
        verification: results.filter(r => r.agent_id === 'loveless' ||
            r.agent_id === 'zhadyz' ||
            r.agent_id === 'the_sentinel' ||
            r.agent_id === 'the_cartographer' ||
            r.agent_id === 'the_oracle')
    };
}
/**
 * Extracts summary from agent output (first few lines or key points)
 */
function extractSummary(output) {
    // Try to find a summary section
    const summaryMatch = output.match(/##\s*Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (summaryMatch) {
        return summaryMatch[1].trim();
    }
    // Otherwise take first paragraph
    const lines = output.split('\n').filter(l => l.trim());
    return lines.slice(0, 3).join('\n');
}
/**
 * Extracts error message from failed agent output
 */
function extractErrorMessage(output) {
    const errorMatch = output.match(/error:?\s*(.*)/i);
    if (errorMatch) {
        return errorMatch[1].trim();
    }
    return 'Unknown error';
}
/**
 * Detects conflicts between agent outputs
 */
function detectConflicts(results) {
    const conflicts = [];
    // Check for architect vs implementation conflicts
    const architect = results.find(r => r.agent_id === 'the_architect');
    const implementation = results.find(r => r.agent_id === 'hollowed_eyes');
    if (architect && implementation) {
        // Look for mentions of different technologies
        const archTechs = extractTechnologies(architect.output);
        const implTechs = extractTechnologies(implementation.output);
        const diffTechs = archTechs.filter(t => !implTechs.includes(t));
        if (diffTechs.length > 0) {
            conflicts.push({
                agents: ['the_architect', 'hollowed_eyes'],
                description: `Architecture specified ${diffTechs.join(', ')} but implementation may have used different approach`,
                resolution: 'Verify implementation follows architecture design'
            });
        }
    }
    // Check for testing conflicts
    const testing = results.find(r => r.agent_id === 'loveless');
    if (testing && implementation) {
        if (testing.output.toLowerCase().includes('fail') || testing.output.toLowerCase().includes('error')) {
            conflicts.push({
                agents: ['hollowed_eyes', 'loveless'],
                description: 'Implementation has issues detected by testing',
                resolution: 'hollowed_eyes should fix issues identified by loveless'
            });
        }
    }
    return conflicts;
}
/**
 * Extracts technology names from text
 */
function extractTechnologies(text) {
    const techs = [
        'react', 'vue', 'angular', 'svelte',
        'nextjs', 'nuxt', 'gatsby',
        'typescript', 'javascript',
        'tailwind', 'css', 'sass',
        'postgres', 'mongodb', 'redis',
        'express', 'fastapi', 'django'
    ];
    return techs.filter(tech => text.toLowerCase().includes(tech));
}
/**
 * Identifies gaps in what was delivered
 */
function identifyGaps(objective, results) {
    const gaps = [];
    const agentIds = results.map(r => r.agent_id);
    // Check if implementation happened without verification
    if (agentIds.includes('hollowed_eyes') && !agentIds.includes('loveless')) {
        gaps.push({
            description: 'Implementation completed but not verified by loveless',
            suggested_action: 'Run loveless to verify the implementation'
        });
    }
    // Check if new feature has no documentation
    if (objective.toLowerCase().includes('feature') || objective.toLowerCase().includes('implement')) {
        if (agentIds.includes('hollowed_eyes') && !agentIds.includes('the_scribe')) {
            gaps.push({
                description: 'New feature implemented but no documentation created',
                suggested_action: 'Run the_scribe to document the new feature'
            });
        }
    }
    // Check if deployment has no CI/CD
    if (objective.toLowerCase().includes('deploy') || objective.toLowerCase().includes('release')) {
        if (!agentIds.includes('the_sentinel') && !agentIds.includes('zhadyz')) {
            gaps.push({
                description: 'Deployment objective but no CI/CD setup',
                suggested_action: 'Consider running the_sentinel to set up CI/CD pipeline'
            });
        }
    }
    return gaps;
}
/**
 * Generates recommendations for next steps
 */
function generateRecommendations(objective, results, conflicts, gaps) {
    const recommendations = [];
    // Address conflicts first
    if (conflicts.length > 0) {
        recommendations.push(`Resolve ${conflicts.length} conflict(s) between agents`);
    }
    // Address gaps
    for (const gap of gaps) {
        recommendations.push(gap.suggested_action);
    }
    // General recommendations based on results
    const hasImplementation = results.some(r => r.agent_id === 'hollowed_eyes');
    const hasVerification = results.some(r => r.agent_id === 'loveless');
    if (hasImplementation && hasVerification) {
        const verification = results.find(r => r.agent_id === 'loveless');
        if (verification?.success) {
            recommendations.push('All verification passed - safe to proceed with deployment');
        }
    }
    // Suggest oracle review for major work
    if (results.length >= 3 && !results.some(r => r.agent_id === 'the_oracle')) {
        recommendations.push('Consider running the_oracle for strategic validation of this work');
    }
    // If no recommendations yet, add general one
    if (recommendations.length === 0) {
        recommendations.push('Objective completed successfully - ready for next task');
    }
    return recommendations;
}
/**
 * Determines if additional verification is needed
 */
function shouldVerify(results) {
    // If loveless already ran and passed, no additional verification needed
    const loveless = results.find(r => r.agent_id === 'loveless');
    if (loveless && loveless.success) {
        return false;
    }
    // If implementation happened without loveless, verification needed
    if (results.some(r => r.agent_id === 'hollowed_eyes') && !loveless) {
        return true;
    }
    // If any agent failed, verification needed after fixes
    if (results.some(r => !r.success)) {
        return true;
    }
    return false;
}
//# sourceMappingURL=coordinator.js.map