/**
 * Verification script for the orchestration keyword bug fix
 * Tests the exact failing objective and related edge cases
 */

import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('=== ORCHESTRATION KEYWORD BUG FIX VERIFICATION ===\n');

// TEST 1: The exact failing objective
console.log('TEST 1: Dashboard visualizing orchestration patterns');
console.log('Objective: "Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns"');
const result1 = analyzeObjectiveSemantic(
  'Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns'
);
console.log('Domain:', result1.domain);
console.log('Agents:', result1.recommended_agents);
console.log('Expected: domain=ui_ux, agents includes cinna, agents does NOT include the_sentinel');
console.log('Status:',
  result1.domain === 'ui_ux' &&
  result1.recommended_agents.includes('cinna') &&
  !result1.recommended_agents.includes('the_sentinel')
    ? '✓ PASS' : '✗ FAIL'
);
console.log();

// TEST 2: Container orchestration should still trigger INFRASTRUCTURE
console.log('TEST 2: Container orchestration (should be INFRASTRUCTURE)');
console.log('Objective: "Deploy containers with Kubernetes orchestration"');
const result2 = analyzeObjectiveSemantic('Deploy containers with Kubernetes orchestration');
console.log('Domain:', result2.domain);
console.log('Agents:', result2.recommended_agents);
console.log('Expected: domain=infrastructure, agents includes the_sentinel');
console.log('Status:',
  result2.domain === 'infrastructure' &&
  result2.recommended_agents.includes('the_sentinel')
    ? '✓ PASS' : '✗ FAIL'
);
console.log();

// TEST 3: Cloud orchestration should still trigger INFRASTRUCTURE
console.log('TEST 3: Cloud orchestration cluster (should be INFRASTRUCTURE)');
console.log('Objective: "Setup container orchestration cluster"');
const result3 = analyzeObjectiveSemantic('Setup container orchestration cluster');
console.log('Domain:', result3.domain);
console.log('Agents:', result3.recommended_agents);
console.log('Expected: domain=infrastructure');
console.log('Status:', result3.domain === 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();

// TEST 4: Workflow orchestration visualization should be UI_UX
console.log('TEST 4: Workflow orchestration dashboard (should be UI_UX)');
console.log('Objective: "Create orchestration workflow dashboard"');
const result4 = analyzeObjectiveSemantic('Create orchestration workflow dashboard');
console.log('Domain:', result4.domain);
console.log('Agents:', result4.recommended_agents);
console.log('Expected: domain=ui_ux, agents includes cinna');
console.log('Status:',
  result4.domain === 'ui_ux' &&
  result4.recommended_agents.includes('cinna')
    ? '✓ PASS' : '✗ FAIL'
);
console.log();

// TEST 5: AWS orchestration should still trigger INFRASTRUCTURE
console.log('TEST 5: AWS cloud orchestration (should be INFRASTRUCTURE)');
console.log('Objective: "Setup AWS cloud orchestration"');
const result5 = analyzeObjectiveSemantic('Setup AWS cloud orchestration');
console.log('Domain:', result5.domain);
console.log('Agents:', result5.recommended_agents);
console.log('Expected: domain=infrastructure');
console.log('Status:', result5.domain === 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();

console.log('=== VERIFICATION COMPLETE ===');
