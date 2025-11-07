// LOVELESS Performance Testing
// Verify semantic selector performance with new verb recognition

import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('='.repeat(80));
console.log('PERFORMANCE TESTING: Semantic Selector');
console.log('='.repeat(80));
console.log();

const testCases = [
  'Setup AWS cloud orchestration cluster',
  'Configure Kubernetes deployment',
  'Install production infrastructure',
  'Provision cloud resources',
  'Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns',
  'Setup a new React component',
  'Configure ESLint for the project',
  'Deploy the application to production',
  'Fix bug in authentication service',
  'Optimize database query performance'
];

console.log('Running 100 iterations of 10 diverse objectives...');
console.log();

const iterations = 100;
const startTime = performance.now();

for (let i = 0; i < iterations; i++) {
  for (const testCase of testCases) {
    analyzeObjectiveSemantic(testCase);
  }
}

const endTime = performance.now();
const totalTime = endTime - startTime;
const totalOperations = iterations * testCases.length;
const avgTime = totalTime / totalOperations;

console.log('Performance Results:');
console.log('-'.repeat(80));
console.log('Total Operations:', totalOperations);
console.log('Total Time:', totalTime.toFixed(2), 'ms');
console.log('Average Time per Analysis:', avgTime.toFixed(4), 'ms');
console.log('Operations per Second:', (1000 / avgTime).toFixed(2));
console.log();

// Performance threshold check
const PERFORMANCE_THRESHOLD_MS = 1.0; // Each analysis should take less than 1ms
console.log('Performance Threshold:', PERFORMANCE_THRESHOLD_MS, 'ms');
console.log('Status:', avgTime < PERFORMANCE_THRESHOLD_MS ? '✓ PASS' : '✗ FAIL');
console.log();

// Memory usage check
const memUsage = process.memoryUsage();
console.log('Memory Usage:');
console.log('-'.repeat(80));
console.log('RSS:', (memUsage.rss / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap Total:', (memUsage.heapTotal / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap Used:', (memUsage.heapUsed / 1024 / 1024).toFixed(2), 'MB');
console.log();

console.log('='.repeat(80));
console.log('PERFORMANCE TEST COMPLETE');
console.log('='.repeat(80));
