// LOVELESS Cycle 1 Regression Testing
// Ensure previous cinna selection fix still works after setup verb changes

import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('='.repeat(80));
console.log('CYCLE 1 REGRESSION TESTING: Cinna Selection Fix');
console.log('='.repeat(80));
console.log();

// Original Cycle 1 Test Case: Dashboard with "orchestration" keyword
console.log('TEST: Dashboard Creation with Orchestration Keyword');
console.log('-'.repeat(80));
const dashboard = analyzeObjectiveSemantic(
  'Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns'
);

console.log('Objective:', 'Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns');
console.log();
console.log('Results:');
console.log('  Intent:', dashboard.intent);
console.log('  Domain:', dashboard.domain);
console.log('  Recommended Agents:', dashboard.recommended_agents);
console.log();

// Validate Cycle 1 expectations
let allPass = true;

console.log('Validation:');
console.log('-'.repeat(80));

// Check 1: Domain should be ui_ux
if (dashboard.domain === 'ui_ux') {
  console.log('✓ PASS: Domain is ui_ux (not infrastructure)');
} else {
  console.log('✗ FAIL: Domain is', dashboard.domain, '(expected ui_ux)');
  allPass = false;
}

// Check 2: Should include cinna
if (dashboard.recommended_agents.includes('cinna')) {
  console.log('✓ PASS: Cinna is recommended for visual dashboard');
} else {
  console.log('✗ FAIL: Cinna not recommended (expected cinna in agent list)');
  allPass = false;
}

// Check 3: Intent should be create_new (not deploy)
if (dashboard.intent === 'create_new') {
  console.log('✓ PASS: Intent is create_new (dashboard creation, not deployment)');
} else {
  console.log('✗ FAIL: Intent is', dashboard.intent, '(expected create_new)');
  allPass = false;
}

console.log();
console.log('='.repeat(80));
console.log('Additional Cycle 1 Test Cases');
console.log('='.repeat(80));
console.log();

// Additional orchestration disambiguation tests
const testCases = [
  {
    objective: 'Build a visualization dashboard for workflow orchestration',
    expectedDomain: 'ui_ux',
    expectedAgent: 'cinna',
    description: 'Workflow orchestration visualization'
  },
  {
    objective: 'Deploy container orchestration cluster',
    expectedDomain: 'infrastructure',
    expectedAgent: 'the_sentinel',
    description: 'Container orchestration deployment'
  },
  {
    objective: 'Setup cloud orchestration with Kubernetes',
    expectedDomain: 'infrastructure',
    expectedAgent: 'the_sentinel',
    description: 'Cloud orchestration setup'
  },
  {
    objective: 'Create UI components for task orchestration display',
    expectedDomain: 'ui_ux',
    expectedAgent: 'cinna',
    description: 'UI for orchestration display'
  }
];

for (const testCase of testCases) {
  console.log('Test:', testCase.description);
  console.log('Objective:', testCase.objective);

  const result = analyzeObjectiveSemantic(testCase.objective);

  const domainMatch = result.domain === testCase.expectedDomain;
  const agentMatch = result.recommended_agents.includes(testCase.expectedAgent);

  console.log('  Domain:', result.domain, domainMatch ? '✓' : '✗');
  console.log('  Agents:', result.recommended_agents, agentMatch ? '✓' : '✗');

  if (!domainMatch || !agentMatch) {
    allPass = false;
  }

  console.log();
}

console.log('='.repeat(80));
if (allPass) {
  console.log('✓ ALL CYCLE 1 REGRESSION TESTS PASSED');
} else {
  console.log('✗ SOME CYCLE 1 REGRESSION TESTS FAILED');
}
console.log('='.repeat(80));
