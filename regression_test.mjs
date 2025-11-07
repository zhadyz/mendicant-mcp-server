import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('=== REGRESSION TEST SUITE ===\n');

const tests = [
  {
    name: 'Container orchestration (should be INFRASTRUCTURE)',
    objective: 'Deploy containers with Kubernetes orchestration',
    expectedDomain: 'infrastructure',
    shouldInclude: ['the_sentinel'],
    shouldExclude: ['cinna']
  },
  {
    name: 'Cloud orchestration (should be INFRASTRUCTURE)',
    objective: 'Setup AWS cloud orchestration cluster',
    expectedDomain: 'infrastructure',
    shouldInclude: ['the_sentinel'],
    shouldExclude: ['cinna']
  },
  {
    name: 'Container orchestration pipeline (should be INFRASTRUCTURE)',
    objective: 'Create container orchestration pipeline',
    expectedDomain: 'infrastructure',
    shouldInclude: ['the_sentinel'],
    shouldExclude: ['cinna']
  },
  {
    name: 'Pure backend API (should NOT include cinna)',
    objective: 'Create REST API for user authentication',
    expectedDomain: 'code',
    shouldInclude: ['hollowed_eyes'],
    shouldExclude: ['cinna']
  },
  {
    name: 'Database schema (should NOT include cinna)',
    objective: 'Design database schema for orders',
    expectedDomain: 'data',
    shouldInclude: [],
    shouldExclude: ['cinna']
  }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = analyzeObjectiveSemantic(test.objective);

  const domainMatch = result.domain === test.expectedDomain;
  const includeCheck = test.shouldInclude.every(agent => result.recommended_agents.includes(agent));
  const excludeCheck = test.shouldExclude.every(agent => !result.recommended_agents.includes(agent));

  const success = domainMatch && includeCheck && excludeCheck;

  if (success) {
    console.log('✓ PASS:', test.name);
    console.log('  Domain:', result.domain, '| Agents:', result.recommended_agents.join(', '));
    passed++;
  } else {
    console.log('✗ FAIL:', test.name);
    console.log('  Expected domain:', test.expectedDomain, '| Got:', result.domain);
    console.log('  Agents:', result.recommended_agents.join(', '));
    if (!includeCheck) console.log('  Missing required agents:', test.shouldInclude);
    if (!excludeCheck) console.log('  Has excluded agents:', test.shouldExclude);
    failed++;
  }
  console.log('');
});

console.log('=== REGRESSION SUMMARY ===');
console.log('Passed:', passed + '/' + tests.length);
console.log('Failed:', failed + '/' + tests.length);

process.exit(failed > 0 ? 1 : 0);
