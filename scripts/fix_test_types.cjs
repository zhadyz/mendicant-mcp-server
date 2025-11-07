const fs = require('fs');
const file = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/test_adaptations.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix type mismatches
content = content.replace(/assert\(versionError\.domain === 'dependency_management'/g,
  "assert(versionError.domain === 'configuration'");
content = content.replace(/assert\(networkError\.recovery_strategy === 'retry_with_backoff'/g,
  "assert(networkError.recovery_strategy === 'retry_backoff'");

// Remove project_type from ExecutionPattern - use project_context instead
const pattern1 = content.match(/const pattern1: ExecutionPattern = \{[\s\S]*?\};/);
if (pattern1) {
  let newPattern1 = pattern1[0]
    .replace(/project_type: 'nextjs',/g, "project_context: { project_type: 'nextjs' },");
  content = content.replace(pattern1[0], newPattern1);
}

const pattern2 = content.match(/const pattern2: ExecutionPattern = \{[\s\S]*?\};/);
if (pattern2) {
  let newPattern2 = pattern2[0]
    .replace(/project_type: 'nextjs',/g, "project_context: { project_type: 'nextjs' },");
  content = content.replace(pattern2[0], newPattern2);
}

const similarPattern1 = content.match(/const similarPattern1: ExecutionPattern = \{[\s\S]*?\};/);
if (similarPattern1) {
  let newSimilarPattern1 = similarPattern1[0]
    .replace(/project_type: 'typescript',/g, "project_context: { project_type: 'typescript' },");
  content = content.replace(similarPattern1[0], newSimilarPattern1);
}

const similarPattern2 = content.match(/const similarPattern2: ExecutionPattern = \{[\s\S]*?\};/);
if (similarPattern2) {
  let newSimilarPattern2 = similarPattern2[0]
    .replace(/project_type: 'typescript',/g, "project_context: { project_type: 'typescript' },");
  content = content.replace(similarPattern2[0], newSimilarPattern2);
}

const differentPattern = content.match(/const differentPattern: ExecutionPattern = \{[\s\S]*?\};/);
if (differentPattern) {
  let newDifferentPattern = differentPattern[0]
    .replace(/project_type: 'nextjs',/g, "project_context: { project_type: 'nextjs' },");
  content = content.replace(differentPattern[0], newDifferentPattern);
}

// Add execution_order and agent_results arrays (required fields)
content = content.replace(/agents_used: \['the_curator' as AgentId\],/g,
  `agents_used: ['the_curator' as AgentId],
  execution_order: ['the_curator' as AgentId],
  agent_results: [],
  conflicts: [],
  gaps: [],`);

content = content.replace(/agents_used: \['the_sentinel' as AgentId\],/g,
  `agents_used: ['the_sentinel' as AgentId],
  execution_order: ['the_sentinel' as AgentId],
  agent_results: [],
  conflicts: [],
  gaps: [],`);

content = content.replace(/agents_used: \['hollowed_eyes' as AgentId\],/g,
  `agents_used: ['hollowed_eyes' as AgentId],
  execution_order: ['hollowed_eyes' as AgentId],
  agent_results: [],
  conflicts: [],
  gaps: [],`);

// Add type annotations to arrow functions
content = content.replace(/\.find\(f => f\.pattern_id/g, '.find((f: any) => f.pattern_id');
content = content.replace(/\.every\(p => p\.timestamp/g, '.every((p: any) => p.timestamp');

fs.writeFileSync(file, content);
console.log('Fixed all type errors in test file');
