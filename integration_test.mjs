/**
 * Integration tests for semantic selector with real-world scenarios
 * Tests cinna agent selection in production-like conditions
 */

import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('='.repeat(80));
console.log('MENDICANT SEMANTIC SELECTOR INTEGRATION TEST');
console.log('='.repeat(80));
console.log('');

// Test cases that SHOULD select cinna
console.log('TEST CASES THAT SHOULD SELECT CINNA:');
console.log('-'.repeat(80));

// Test 1: Dashboard creation (the original failing case)
console.log('\n[TEST 1] Dashboard creation with visualization');
console.log('Objective: "Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns"');
const result1 = analyzeObjectiveSemantic('Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns');
console.log('Recommended agents:', result1.recommended_agents);
console.log('Domain:', result1.domain);
console.log('Task type:', result1.task_type);
console.log('Intent:', result1.intent);
console.log('Confidence:', result1.confidence);
console.log('Reasoning:', result1.reasoning);
console.log('✓ PASS:', result1.recommended_agents.includes('cinna') ? 'YES' : 'FAIL - cinna not selected!');

// Test 2: UI component work
console.log('\n[TEST 2] Responsive navigation component');
console.log('Objective: "Build a responsive navigation component"');
const result2 = analyzeObjectiveSemantic('Build a responsive navigation component');
console.log('Recommended agents:', result2.recommended_agents);
console.log('Domain:', result2.domain);
console.log('Task type:', result2.task_type);
console.log('Confidence:', result2.confidence);
console.log('Reasoning:', result2.reasoning);
console.log('✓ PASS:', result2.recommended_agents.includes('cinna') ? 'YES' : 'FAIL - cinna not selected!');

// Test 3: Visualization
console.log('\n[TEST 3] Data visualization charts');
console.log('Objective: "Create data visualization charts"');
const result3 = analyzeObjectiveSemantic('Create data visualization charts');
console.log('Recommended agents:', result3.recommended_agents);
console.log('Domain:', result3.domain);
console.log('Task type:', result3.task_type);
console.log('Confidence:', result3.confidence);
console.log('Reasoning:', result3.reasoning);
console.log('✓ PASS:', result3.recommended_agents.includes('cinna') ? 'YES' : 'FAIL - cinna not selected!');

// Test 4: Design system
console.log('\n[TEST 4] Component library design');
console.log('Objective: "Design a component library for our app"');
const result4 = analyzeObjectiveSemantic('Design a component library for our app');
console.log('Recommended agents:', result4.recommended_agents);
console.log('Domain:', result4.domain);
console.log('Task type:', result4.task_type);
console.log('Confidence:', result4.confidence);
console.log('Reasoning:', result4.reasoning);
console.log('✓ PASS:', result4.recommended_agents.includes('cinna') ? 'YES' : 'FAIL - cinna not selected!');

// Test cases that should NOT select cinna
console.log('\n\n' + '='.repeat(80));
console.log('TEST CASES THAT SHOULD NOT SELECT CINNA:');
console.log('-'.repeat(80));

// Test 5: Backend API
console.log('\n[TEST 5] Backend REST API');
console.log('Objective: "Create a REST API endpoint for user authentication"');
const result5 = analyzeObjectiveSemantic('Create a REST API endpoint for user authentication');
console.log('Recommended agents:', result5.recommended_agents);
console.log('Domain:', result5.domain);
console.log('Task type:', result5.task_type);
console.log('Confidence:', result5.confidence);
console.log('Reasoning:', result5.reasoning);
console.log('✓ PASS:', !result5.recommended_agents.includes('cinna') ? 'YES (cinna NOT selected as expected)' : 'FAIL - cinna incorrectly selected!');

// Test 6: Database work
console.log('\n[TEST 6] Database schema design');
console.log('Objective: "Design a database schema for products"');
const result6 = analyzeObjectiveSemantic('Design a database schema for products');
console.log('Recommended agents:', result6.recommended_agents);
console.log('Domain:', result6.domain);
console.log('Task type:', result6.task_type);
console.log('Confidence:', result6.confidence);
console.log('Reasoning:', result6.reasoning);
console.log('✓ PASS:', !result6.recommended_agents.includes('cinna') ? 'YES (cinna NOT selected as expected)' : 'FAIL - cinna incorrectly selected!');

// EDGE CASE TESTING
console.log('\n\n' + '='.repeat(80));
console.log('EDGE CASE TESTING:');
console.log('-'.repeat(80));

// Test 7: Empty objective
console.log('\n[TEST 7] Empty objective string');
console.log('Objective: ""');
try {
  const result7 = analyzeObjectiveSemantic('');
  console.log('Recommended agents:', result7.recommended_agents);
  console.log('Domain:', result7.domain);
  console.log('✓ PASS: Handled gracefully');
} catch (error) {
  console.log('✗ FAIL: Threw error:', error.message);
}

// Test 8: Conflicting keywords
console.log('\n[TEST 8] Conflicting keywords');
console.log('Objective: "Create a database design visualization dashboard"');
const result8 = analyzeObjectiveSemantic('Create a database design visualization dashboard');
console.log('Recommended agents:', result8.recommended_agents);
console.log('Domain:', result8.domain);
console.log('Task type:', result8.task_type);
console.log('Confidence:', result8.confidence);
console.log('Reasoning:', result8.reasoning);
console.log('Analysis: Should prioritize visualization over database context');

// Test 9: Very long objective
console.log('\n[TEST 9] Very long objective (>500 words)');
const longObjective = 'Create a comprehensive enterprise-level web application dashboard ' + 'with advanced visualization capabilities '.repeat(50);
console.log('Objective length:', longObjective.length, 'characters');
try {
  const result9 = analyzeObjectiveSemantic(longObjective);
  console.log('Recommended agents:', result9.recommended_agents);
  console.log('Domain:', result9.domain);
  console.log('✓ PASS: Handled long input');
} catch (error) {
  console.log('✗ FAIL: Threw error:', error.message);
}

// Test 10: SQL injection attempt
console.log('\n[TEST 10] SQL injection attempt in objective');
console.log('Objective: "Create dashboard\'; DROP TABLE users; --"');
try {
  const result10 = analyzeObjectiveSemantic("Create dashboard'; DROP TABLE users; --");
  console.log('Recommended agents:', result10.recommended_agents);
  console.log('Domain:', result10.domain);
  console.log('✓ PASS: Treated as regular string, no code execution');
} catch (error) {
  console.log('✗ FAIL: Threw error:', error.message);
}

// REGRESSION TESTING
console.log('\n\n' + '='.repeat(80));
console.log('REGRESSION TESTING:');
console.log('-'.repeat(80));

console.log('\n[REGRESSION 1] Fix authentication bug');
const reg1 = analyzeObjectiveSemantic('Fix authentication bug');
console.log('Recommended agents:', reg1.recommended_agents);
console.log('Expected: hollowed_eyes + loveless');
console.log('✓ PASS:', reg1.recommended_agents.includes('hollowed_eyes') && reg1.recommended_agents.includes('loveless') ? 'YES' : 'FAIL');

console.log('\n[REGRESSION 2] Deploy to production');
const reg2 = analyzeObjectiveSemantic('Deploy to production');
console.log('Recommended agents:', reg2.recommended_agents);
console.log('Expected: the_sentinel');
console.log('✓ PASS:', reg2.recommended_agents.includes('the_sentinel') ? 'YES' : 'FAIL');

console.log('\n[REGRESSION 3] Write API documentation');
const reg3 = analyzeObjectiveSemantic('Write API documentation');
console.log('Recommended agents:', reg3.recommended_agents);
console.log('Expected: the_scribe');
console.log('✓ PASS:', reg3.recommended_agents.includes('the_scribe') ? 'YES' : 'FAIL');

console.log('\n[REGRESSION 4] Optimize database queries');
const reg4 = analyzeObjectiveSemantic('Optimize database queries');
console.log('Recommended agents:', reg4.recommended_agents);
console.log('Expected: hollowed_eyes + the_curator');
console.log('✓ PASS:', reg4.recommended_agents.includes('hollowed_eyes') && reg4.recommended_agents.includes('the_curator') ? 'YES' : 'FAIL');

console.log('\n' + '='.repeat(80));
console.log('INTEGRATION TEST COMPLETE');
console.log('='.repeat(80));
