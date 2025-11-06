import { agentRegistry } from './knowledge/agent_registry.js';
import { mahoraga } from './knowledge/mahoraga.js';
import { detectExecutionConflicts } from './knowledge/conflict_detector.js';
import { memoryBridge } from './knowledge/memory_bridge.js';
import { createMnemosyneEntities, createMnemosyneRelations } from './integration/mnemosyne_mcp.js';
import { feedbackLoop } from './knowledge/feedback_loop.js';
import { semanticEmbedder } from './knowledge/semantic_embedder.js';
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
    // Detect conflicts using comprehensive conflict detector
    const conflicts = detectExecutionConflicts(agentResults);
    // Identify gaps
    const gaps = identifyGaps(objective, agentResults);
    // Generate recommendations
    const recommendations = generateRecommendations(objective, agentResults, conflicts, gaps);
    // Determine if verification is needed
    const verification_needed = shouldVerify(agentResults);
    // NEW: Comprehensive closed-loop learning via feedback loop system
    // This updates ALL intelligence systems based on execution outcomes
    if (plan) {
        recordExecutionWithFeedbackLoop(objective, plan, agentResults, conflicts, gaps, projectContext);
    }
    else {
        // Fallback to legacy agent feedback recording
        recordAgentFeedback(agentResults);
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
 * AND consolidates to Mnemosyne for long-term persistent memory
 *
 * DUAL-LAYER MEMORY ARCHITECTURE:
 * 1. Mahoraga (RAM) - Immediate, in-session learning
 * 2. Memory Bridge → Mnemosyne (Persistent) - Long-term knowledge graph
 */
async function recordExecutionPattern(objective, plan, results, conflicts, gaps, projectContext) {
    try {
        // LAYER 1: Record to Mahoraga (RAM) for immediate learning
        mahoraga.recordExecution(objective, plan, results, conflicts, gaps, projectContext);
        // LAYER 2: Consolidate to Mnemosyne (Persistent) via intelligent bridge
        // The bridge decides if this memory is valuable enough to persist
        const decision = await memoryBridge.consolidateExecutionPattern(objective, plan, results, conflicts, gaps, projectContext);
        if (decision.should_persist) {
            console.log(`[Memory Bridge] Persisting execution pattern: ${decision.score.reasoning}`);
            // Persist to Mnemosyne knowledge graph
            await createMnemosyneEntities(decision.entities_to_create);
            await createMnemosyneRelations(decision.relations_to_create);
            console.log(`[Memory Bridge] Successfully persisted ${decision.entities_to_create.length} entities and ${decision.relations_to_create.length} relations`);
        }
        else {
            console.log(`[Memory Bridge] Skipping persistence (score: ${decision.score.value.toFixed(2)} < threshold)`);
        }
    }
    catch (err) {
        console.error('Failed to record execution pattern:', err);
    }
}
/**
 * NEW: Comprehensive closed-loop learning system
 * Combines legacy Mahoraga/Mnemosyne recording with advanced feedback loop
 * that updates ALL intelligence systems
 */
async function recordExecutionWithFeedbackLoop(objective, plan, results, conflicts, gaps, projectContext) {
    try {
        // PHASE 1: Legacy learning systems (Mahoraga + Mnemosyne)
        await recordExecutionPattern(objective, plan, results, conflicts, gaps, projectContext);
        // PHASE 2: Advanced feedback loop - Updates ALL intelligence systems
        console.log(`[Feedback Loop] Processing execution feedback for closed-loop learning`);
        // Get semantic analysis from the planning phase
        const semanticEmbedding = await semanticEmbedder.analyzeObjective(objective);
        // Extract predicted intents and domains
        const predicted_intents = Array.from(semanticEmbedding.intent_scores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([intent, _]) => intent);
        const predicted_domains = Array.from(semanticEmbedding.domain_scores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([domain, _]) => domain);
        // Calculate overall success
        const successfulAgents = results.filter(r => r.success).length;
        const actual_success = successfulAgents >= results.length * 0.7; // 70% threshold
        // Calculate totals
        const total_duration_ms = results.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
        const total_tokens = results.reduce((sum, r) => sum + (r.tokens_used || 0), 0);
        // Extract errors
        const errors_encountered = results
            .filter(r => !r.success)
            .map(r => `${r.agent_id}: ${r.output}`);
        // Map conflicts to feedback format
        const conflicts_feedback = conflicts.map(c => ({
            agent_a: c.agents[0] || 'unknown',
            agent_b: c.agents[1] || 'unknown',
            conflict_type: 'unknown', // Must be one of: "unknown" | "resource" | "semantic" | "ordering"
            severity: 0.5 // Default severity (0.0 to 1.0)
        }));
        // Build comprehensive feedback object
        const feedback = {
            objective,
            agents_used: plan.agents.map(a => a.agent_id),
            predicted_confidence: semanticEmbedding.confidence,
            predicted_intents,
            predicted_domains,
            actual_success,
            actual_duration_ms: total_duration_ms,
            actual_tokens_used: total_tokens,
            errors_encountered,
            conflicts_detected: conflicts_feedback,
            user_satisfaction: undefined, // Could be added in future with user feedback
            timestamp: Date.now()
        };
        // Process through comprehensive feedback loop
        const learningMetrics = await feedbackLoop.processFeedback(feedback);
        // Log learning improvements
        console.log(`[Feedback Loop] Learning metrics:`);
        console.log(`  - Calibration improvement: ${learningMetrics.calibration_improvement.toFixed(4)}`);
        console.log(`  - Semantic accuracy: ${(learningMetrics.semantic_accuracy * 100).toFixed(1)}%`);
        console.log(`  - Conflict prediction accuracy: ${(learningMetrics.conflict_prediction_accuracy * 100).toFixed(1)}%`);
        console.log(`  - Temporal health improvement: ${learningMetrics.temporal_health_improvement.toFixed(4)}`);
        // Legacy agent registry feedback
        for (const result of results) {
            agentRegistry.recordFeedback({
                agent_id: result.agent_id,
                success: result.success,
                tokens_used: result.tokens_used,
                duration_ms: result.duration_ms
            }).catch(err => {
                console.error(`Failed to record legacy feedback for ${result.agent_id}:`, err);
            });
        }
    }
    catch (err) {
        console.error('[Feedback Loop] Failed to process comprehensive feedback:', err);
        // Fallback to legacy recording
        await recordExecutionPattern(objective, plan, results, conflicts, gaps, projectContext);
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