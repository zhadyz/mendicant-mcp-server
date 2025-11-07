const fs = require('fs');
const file = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/knowledge/mahoraga.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix: extractFailureContext should handle both agent_results and failure_reason
const oldExtractFailure = `  private extractFailureContext(pattern: ExecutionPattern): FailureContext | null {
    const failedResult = pattern.agent_results.find(r => !r.success);
    if (!failedResult) return null;

    const failedIndex = pattern.execution_order.indexOf(failedResult.agent_id);
    const precedingAgents = failedIndex > 0
      ? pattern.execution_order.slice(0, failedIndex)
      : [];

    return {
      pattern_id: pattern.id,
      objective: pattern.objective,
      failed_agent: failedResult.agent_id,
      error_message: failedResult.output,
      error_type: this.classifyError(failedResult.output),
      preceding_agents: precedingAgents,
      project_context: pattern.project_context,
      attempted_dependencies: [],
      learned_avoidance: this.generateAvoidanceRule(pattern, failedResult),
      timestamp: Date.now()
    };
  }`;

const newExtractFailure = `  private extractFailureContext(pattern: ExecutionPattern): FailureContext | null {
    // Try to find failed agent result
    const failedResult = pattern.agent_results.find(r => !r.success);

    // If no failed agent result but pattern has failure_reason, use that
    if (!failedResult && pattern.failure_reason) {
      // Use the last agent in execution order as the failed agent
      const failed_agent = pattern.execution_order[pattern.execution_order.length - 1];
      const precedingAgents = pattern.execution_order.length > 1
        ? pattern.execution_order.slice(0, -1)
        : [];

      return {
        pattern_id: pattern.id,
        objective: pattern.objective,
        failed_agent: failed_agent,
        error_message: pattern.failure_reason,
        error_type: this.classifyError(pattern.failure_reason),
        preceding_agents: precedingAgents,
        project_context: pattern.project_context,
        attempted_dependencies: [],
        learned_avoidance: \`\${failed_agent} failed for \${pattern.objective_type} in \${pattern.project_context?.project_type || 'unknown'} project\`,
        timestamp: Date.now()
      };
    }

    if (!failedResult) return null;

    const failedIndex = pattern.execution_order.indexOf(failedResult.agent_id);
    const precedingAgents = failedIndex > 0
      ? pattern.execution_order.slice(0, failedIndex)
      : [];

    return {
      pattern_id: pattern.id,
      objective: pattern.objective,
      failed_agent: failedResult.agent_id,
      error_message: failedResult.output,
      error_type: this.classifyError(failedResult.output),
      preceding_agents: precedingAgents,
      project_context: pattern.project_context,
      attempted_dependencies: [],
      learned_avoidance: this.generateAvoidanceRule(pattern, failedResult),
      timestamp: Date.now()
    };
  }`;

content = content.replace(oldExtractFailure, newExtractFailure);

fs.writeFileSync(file, content);
console.log('✅ Fixed extractFailureContext to handle failure_reason field');
