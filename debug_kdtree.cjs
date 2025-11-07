const { testMemory } = require('./dist/knowledge/mahoraga.js');

console.log('=== KD-Tree Debug ===\n');

// Create test patterns
const pattern1 = {
  id: 'debug_test_1',
  objective: 'Fix TypeScript compilation errors',
  agents_used: ['hollowed_eyes'],
  execution_order: ['hollowed_eyes'],
  agent_results: [],
  conflicts: [],
  gaps: [],
  success: true,
  total_duration_ms: 12000,
  total_tokens: 2500,
  timestamp: Date.now(),
  project_context: { project_type: 'typescript' },
  tags: ['typescript', 'compilation', 'error-fix'],
  objective_type: 'code_modification'
};

const pattern2 = {
  id: 'debug_test_2',
  objective: 'Deploy to production server',
  agents_used: ['the_sentinel'],
  execution_order: ['the_sentinel'],
  agent_results: [],
  conflicts: [],
  gaps: [],
  success: true,
  total_duration_ms: 30000,
  total_tokens: 5000,
  timestamp: Date.now(),
  project_context: { project_type: 'nextjs' },
  tags: ['deployment', 'production'],
  objective_type: 'deployment'
};

console.log('Recording patterns...');
testMemory.recordPattern(pattern1);
testMemory.recordPattern(pattern2);

console.log('\nSearching for similar patterns...');

// First check calculateSimilarity directly
console.log('\nTesting calculateSimilarity...');
const objectiveType = testMemory.extractObjectiveType('Fix compilation errors in TypeScript project');
const objectiveTags = testMemory.extractTags('Fix compilation errors in TypeScript project', { project_type: 'typescript' });
console.log(`Objective type: ${objectiveType}`);
console.log(`Objective tags: [${objectiveTags.join(', ')}]`);

const sim1 = testMemory.calculateSimilarity(
  'Fix compilation errors in TypeScript project',
  objectiveType,
  objectiveTags,
  pattern1,
  { project_type: 'typescript' }
);
console.log(`Similarity to pattern1: ${sim1.toFixed(3)}`);

const matches = testMemory.findSimilarPatterns('Fix compilation errors in TypeScript project');

console.log(`\nFound ${matches.length} matches`);
if (matches.length > 0) {
  matches.forEach((match, i) => {
    console.log(`Match ${i + 1}:`);
    console.log(`  ID: ${match.pattern.id}`);
    console.log(`  Similarity: ${match.similarity_score.toFixed(3)}`);
    console.log(`  Objective: ${match.pattern.objective}`);
  });
} else {
  console.log('No matches found!');

  // Check if KD-tree has data
  console.log('\nChecking KD-tree internals...');
  const kdTree = testMemory.kdTree;
  console.log(`KD-tree size: ${kdTree.size()}`);

  // Try to get features
  const featureExtractor = testMemory.featureExtractor;
  console.log('\nExtracting query features...');
  try {
    const queryFeatures = featureExtractor.extractQueryFeatures(
      'Fix compilation errors in TypeScript project',
      'code_modification',
      ['typescript', 'compilation', 'error-fix'],
      'typescript'
    );
    console.log(`Query features: [${queryFeatures.slice(0, 5).join(', ')}...]`);
    console.log(`Feature vector length: ${queryFeatures.length}`);

    // Try to extract pattern features to compare
    console.log('\nExtracting pattern features...');
    const pattern1Features = featureExtractor.extractFeatures(pattern1);
    console.log(`Pattern1 features: [${pattern1Features.slice(0, 5).join(', ')}...]`);

    // Try kNearestNeighbors directly
    console.log('\nTrying kNearestNeighbors directly...');
    const neighbors = kdTree.kNearestNeighbors(queryFeatures, 5);
    console.log(`Neighbors found: ${neighbors.length}`);
    if (neighbors.length > 0) {
      neighbors.forEach((n, i) => {
        console.log(`  Neighbor ${i + 1}: distance=${n.distance.toFixed(3)}`);
      });
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
    console.log(e.stack);
  }
}
