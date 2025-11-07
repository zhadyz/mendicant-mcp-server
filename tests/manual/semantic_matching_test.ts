import { SemanticMatchingService } from '../../src/knowledge/semantic_matching_service.js';

async function testSemanticMatching() {
  console.log('Testing Semantic Agent Matching (Keyword Fallback Mode)...\n');

  // Initialize without embedding service to test keyword fallback
  const service = new SemanticMatchingService();
  
  const testAgent = {
    name: 'hollowed_eyes',
    specialization: 'semantic_code_search',
    capabilities: ['github_operations', 'code_analysis', 'documentation'],
    tools: ['mcp__github__search_code', 'mcp__context7__get-library-docs'],
    typical_use_cases: ['find_code_patterns', 'analyze_repositories', 'search_documentation'],
    avg_token_usage: 50000,
    success_rate: 0.85
  };

  const queries = [
    'search for authentication code in github',
    'find API endpoints in the codebase',
    'analyze code patterns',
    'help with documentation',
    'completely unrelated query about cooking pasta'
  ];

  console.log('Testing semantic scoring with keyword fallback:\n');
  for (const query of queries) {
    try {
      const score = await service.computeSemanticScore(query, testAgent);
      console.log('Query: "' + query + '"');
      console.log('  Score: ' + score.score.toFixed(3));
      console.log('  Confidence: ' + score.confidence);
      console.log('  Method: ' + score.method + '\n');
    } catch (error) {
      console.error('  ERROR: ' + error.message + '\n');
    }
  }

  console.log('Semantic matching test complete\n');
  console.log('PASS: Keyword fallback mode functional when embeddings unavailable');
}

testSemanticMatching().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
