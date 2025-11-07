// LOVELESS QA Manual Verification Script
// Testing the specific fixes from Cycle 1

import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('='.repeat(80));
console.log('LOVELESS QA: Manual Verification of Cycle 1 Fixes');
console.log('='.repeat(80));
console.log();

// Test 1: Setup AWS (THE ORIGINAL FAILING CASE)
console.log('TEST 1: Setup AWS cloud orchestration cluster');
console.log('-'.repeat(80));
const result1 = analyzeObjectiveSemantic('Setup AWS cloud orchestration cluster');
console.log('Intent:', result1.intent);
console.log('Expected: deploy');
console.log('Status:', result1.intent === 'deploy' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log('Domain:', result1.domain);
console.log('Expected: infrastructure');
console.log('Status:', result1.domain === 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log('Recommended Agents:', result1.recommended_agents);
console.log('Expected: Should include the_sentinel');
console.log('Status:', result1.recommended_agents.includes('the_sentinel') ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Test 2: Configure Kubernetes
console.log('TEST 2: Configure Kubernetes deployment');
console.log('-'.repeat(80));
const result2 = analyzeObjectiveSemantic('Configure Kubernetes deployment');
console.log('Intent:', result2.intent);
console.log('Expected: deploy');
console.log('Status:', result2.intent === 'deploy' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log('Domain:', result2.domain);
console.log('Expected: infrastructure');
console.log('Status:', result2.domain === 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Test 3: Install production
console.log('TEST 3: Install production infrastructure');
console.log('-'.repeat(80));
const result3 = analyzeObjectiveSemantic('Install production infrastructure');
console.log('Intent:', result3.intent);
console.log('Expected: deploy');
console.log('Status:', result3.intent === 'deploy' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Test 4: Provision cloud
console.log('TEST 4: Provision cloud resources');
console.log('-'.repeat(80));
const result4 = analyzeObjectiveSemantic('Provision cloud resources');
console.log('Intent:', result4.intent);
console.log('Expected: deploy');
console.log('Status:', result4.intent === 'deploy' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Test 5: Context-aware - Setup React component (should NOT be deploy)
console.log('TEST 5: Setup a new React component (Context-Aware Test)');
console.log('-'.repeat(80));
const result5 = analyzeObjectiveSemantic('Setup a new React component');
console.log('Intent:', result5.intent);
console.log('Expected: create_new (NOT deploy)');
console.log('Status:', result5.intent !== 'deploy' && (result5.intent === 'create_new' || result5.intent === 'modify_existing') ? '✓ PASS' : '✗ FAIL');
console.log();
console.log('Domain:', result5.domain);
console.log('Expected: code or ui_ux (NOT infrastructure)');
console.log('Status:', result5.domain !== 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Test 6: Context-aware - Configure ESLint
console.log('TEST 6: Configure ESLint for the project (Context-Aware Test)');
console.log('-'.repeat(80));
const result6 = analyzeObjectiveSemantic('Configure ESLint for the project');
console.log('Intent:', result6.intent);
console.log('Expected: create_new or modify_existing (NOT deploy)');
console.log('Status:', result6.intent !== 'deploy' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log('Domain:', result6.domain);
console.log('Expected: code (NOT infrastructure)');
console.log('Status:', result6.domain === 'code' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Test 7: Regression - Dashboard from Cycle 1
console.log('TEST 7: Regression Test - Dashboard Creation (Cycle 1 Fix)');
console.log('-'.repeat(80));
const dashboard = analyzeObjectiveSemantic(
  'Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns'
);
console.log('Domain:', dashboard.domain);
console.log('Expected: ui_ux');
console.log('Status:', dashboard.domain === 'ui_ux' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log('Recommended Agents:', dashboard.recommended_agents);
console.log('Expected: Should include cinna');
console.log('Status:', dashboard.recommended_agents.includes('cinna') ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Edge Cases
console.log('='.repeat(80));
console.log('EDGE CASE TESTING');
console.log('='.repeat(80));
console.log();

// Edge Case 1: Multiple verbs
console.log('EDGE CASE 1: Setup and configure production infrastructure');
console.log('-'.repeat(80));
const edge1 = analyzeObjectiveSemantic('Setup and configure production infrastructure');
console.log('Intent:', edge1.intent);
console.log('Domain:', edge1.domain);
console.log('Expected: deploy intent, infrastructure domain');
console.log('Status:', edge1.intent === 'deploy' && edge1.domain === 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Edge Case 2: Conflicting keywords
console.log('EDGE CASE 2: Install Docker container orchestration');
console.log('-'.repeat(80));
const edge2 = analyzeObjectiveSemantic('Install Docker container orchestration');
console.log('Intent:', edge2.intent);
console.log('Domain:', edge2.domain);
console.log('Expected: deploy intent, infrastructure domain');
console.log('Status:', edge2.intent === 'deploy' && edge2.domain === 'infrastructure' ? '✓ PASS' : '✗ FAIL');
console.log();
console.log();

// Edge Case 3: Provision + database
console.log('EDGE CASE 3: Provision new database schema');
console.log('-'.repeat(80));
const edge3 = analyzeObjectiveSemantic('Provision new database schema');
console.log('Intent:', edge3.intent);
console.log('Domain:', edge3.domain);
console.log('Expected: deploy or create_new, data domain (schema is database design work)');
console.log('Status:', edge3.domain === 'data' ? '✓ PASS' : '⚠ REVIEW');
console.log('Note: "provision" suggests deployment, but "schema" is design work');
console.log();
console.log();

console.log('='.repeat(80));
console.log('MANUAL VERIFICATION COMPLETE');
console.log('='.repeat(80));
