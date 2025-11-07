// LOVELESS Deep Analysis: Edge Case 2 Failure
// "Install Docker container orchestration" returns create_new instead of deploy

import { analyzeObjectiveSemantic } from './dist/knowledge/semantic_selector.js';

console.log('='.repeat(80));
console.log('DEEP ANALYSIS: Edge Case 2 Failure');
console.log('='.repeat(80));
console.log();

const objective = 'Install Docker container orchestration';

console.log('Objective:', objective);
console.log();

const result = analyzeObjectiveSemantic(objective);

console.log('Full Analysis Result:');
console.log(JSON.stringify(result, null, 2));
console.log();

console.log('Analysis Breakdown:');
console.log('-'.repeat(80));
console.log('Intent:', result.intent);
console.log('Domain:', result.domain);
console.log('Confidence:', result.confidence);
console.log('Reasoning:', result.reasoning);
console.log();

// Compare with similar objectives
console.log('Comparative Analysis:');
console.log('-'.repeat(80));

const compare1 = analyzeObjectiveSemantic('Install production infrastructure');
console.log('Compare: "Install production infrastructure"');
console.log('  Intent:', compare1.intent);
console.log('  Domain:', compare1.domain);
console.log();

const compare2 = analyzeObjectiveSemantic('Deploy Docker container orchestration');
console.log('Compare: "Deploy Docker container orchestration"');
console.log('  Intent:', compare2.intent);
console.log('  Domain:', compare2.domain);
console.log();

const compare3 = analyzeObjectiveSemantic('Setup Docker container orchestration');
console.log('Compare: "Setup Docker container orchestration"');
console.log('  Intent:', compare3.intent);
console.log('  Domain:', compare3.domain);
console.log();

const compare4 = analyzeObjectiveSemantic('Install Docker orchestration cluster');
console.log('Compare: "Install Docker orchestration cluster"');
console.log('  Intent:', compare4.intent);
console.log('  Domain:', compare4.domain);
console.log();

console.log('='.repeat(80));
console.log('HYPOTHESIS: The issue may be that "container" is being weighted');
console.log('more heavily than "orchestration + install" in the intent detection.');
console.log('The system correctly identifies infrastructure domain but misses');
console.log('the deployment intent when "container" appears with "install".');
console.log('='.repeat(80));
