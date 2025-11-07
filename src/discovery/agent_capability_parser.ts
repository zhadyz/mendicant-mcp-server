/**
 * Agent Capability Parser
 *
 * Extracts agent capabilities from natural language descriptions.
 * Used for parsing dynamically discovered agents from MCP context.
 */

import type { AgentCapability, AgentId } from '../types.js';

/**
 * Agent category based on specialization
 */
export type AgentCategory =
  | 'development'      // Code implementation, refactoring
  | 'architecture'     // System design, planning
  | 'qa_security'      // Testing, security, validation
  | 'documentation'    // Technical writing, docs
  | 'research'         // Investigation, exploration
  | 'design'           // UI/UX, visual design
  | 'analysis'         // Data analysis, metrics
  | 'planning'         // Requirements, specifications
  | 'operations'       // DevOps, deployment, infrastructure
  | 'unknown';         // Cannot determine category

/**
 * Raw agent information from MCP discovery
 */
export interface RawAgentInfo {
  agent_id: AgentId;
  description?: string;
  tools?: string[];
  metadata?: Record<string, any>;
}

/**
 * Specialization keywords for pattern matching
 */
const SPECIALIZATION_PATTERNS: Record<AgentCategory, string[]> = {
  development: [
    'code', 'implement', 'develop', 'build', 'refactor', 'debug',
    'programming', 'coding', 'software', 'feature', 'bug', 'fix'
  ],
  architecture: [
    'architect', 'design', 'system', 'structure', 'pattern',
    'scalability', 'technical decision', 'adr', 'blueprint'
  ],
  qa_security: [
    'test', 'qa', 'quality', 'security', 'audit', 'validate',
    'verify', 'check', 'vulnerability', 'penetration', 'assess'
  ],
  documentation: [
    'document', 'write', 'doc', 'readme', 'guide', 'tutorial',
    'explain', 'description', 'manual', 'handbook'
  ],
  research: [
    'research', 'investigate', 'explore', 'study', 'analyze',
    'discover', 'intelligence', 'inquiry', 'examination'
  ],
  design: [
    'design', 'ui', 'ux', 'visual', 'style', 'aesthetic',
    'layout', 'interface', 'graphic', 'creative', 'art'
  ],
  analysis: [
    'analyze', 'analytics', 'metrics', 'data', 'statistics',
    'insight', 'report', 'performance', 'measurement'
  ],
  planning: [
    'plan', 'requirement', 'specification', 'clarify', 'refine',
    'scope', 'define', 'organize', 'strategy'
  ],
  operations: [
    'deploy', 'devops', 'infrastructure', 'ci', 'cd', 'pipeline',
    'container', 'orchestration', 'release', 'production'
  ],
  unknown: []
};

/**
 * Tool patterns for capability inference
 */
const TOOL_CAPABILITY_MAP: Record<string, string[]> = {
  'github': ['git_operations', 'code_management', 'pr_creation', 'issue_tracking'],
  'serena': ['semantic_search', 'code_navigation', 'refactoring'],
  'playwright': ['browser_testing', 'e2e_testing', 'automation'],
  'chrome-devtools': ['debugging', 'performance_profiling', 'network_analysis'],
  'mnemosyne': ['knowledge_storage', 'pattern_learning', 'memory_persistence'],
  'filesystem': ['file_operations', 'directory_management', 'file_search'],
  'context7': ['documentation_lookup', 'api_reference', 'library_research'],
  'docker': ['containerization', 'deployment', 'orchestration'],
  'vercel': ['hosting', 'deployment', 'serverless'],
  'canva': ['visual_design', 'graphic_creation', 'asset_generation'],
  'mermaid': ['diagramming', 'visualization', 'flowcharts'],
  'pdf-tools': ['pdf_generation', 'document_processing', 'report_creation'],
  'google-workspace': ['document_management', 'collaboration', 'productivity'],
  'stripe': ['payment_processing', 'billing', 'subscription_management'],
  'linear': ['project_management', 'issue_tracking', 'workflow_automation']
};

/**
 * Parse agent description and extract capabilities
 */
export function parseAgentFromDescription(raw: RawAgentInfo): AgentCapability {
  const { agent_id, description = '', tools = [], metadata = {} } = raw;

  // Categorize agent
  const category = categorizeAgent(agent_id, description);

  // Extract specialization
  const specialization = extractSpecialization(agent_id, description, category);

  // Infer capabilities from description and tools
  const capabilities = inferCapabilities(description, tools);

  // Extract typical use cases from description
  const typical_use_cases = extractUseCases(description, category);

  // Estimate token usage based on category
  const avg_token_usage = estimateTokenUsage(category);

  // Default success rate for unknown agents
  const success_rate = 0.5;

  return {
    name: agent_id,
    specialization,
    capabilities,
    tools,
    typical_use_cases,
    avg_token_usage,
    success_rate
  };
}

/**
 * Categorize agent based on name and description
 */
export function categorizeAgent(agentId: AgentId, description: string): AgentCategory {
  const text = `${agentId} ${description}`.toLowerCase();

  // Count matches for each category
  const scores: Record<AgentCategory, number> = {
    development: 0,
    architecture: 0,
    qa_security: 0,
    documentation: 0,
    research: 0,
    design: 0,
    analysis: 0,
    planning: 0,
    operations: 0,
    unknown: 0
  };

  for (const [category, keywords] of Object.entries(SPECIALIZATION_PATTERNS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category as AgentCategory]++;
      }
    }
  }

  // Find category with highest score
  let maxScore = 0;
  let bestCategory: AgentCategory = 'unknown';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as AgentCategory;
    }
  }

  return bestCategory;
}

/**
 * Extract specialization string
 */
function extractSpecialization(agentId: AgentId, description: string, category: AgentCategory): string {
  // Try to extract first meaningful phrase from description
  if (description) {
    const sentences = description.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].length > 10) {
      return sentences[0].trim().toLowerCase().replace(/\s+/g, '_');
    }
  }

  // Fallback to agent ID pattern
  if (agentId.includes('_')) {
    return agentId.toLowerCase();
  }

  // Fallback to category
  return category;
}

/**
 * Infer capabilities from description and tools
 */
function inferCapabilities(description: string, tools: string[]): string[] {
  const capabilities = new Set<string>();

  // Extract from tools
  for (const tool of tools) {
    for (const [pattern, caps] of Object.entries(TOOL_CAPABILITY_MAP)) {
      if (tool.toLowerCase().includes(pattern)) {
        caps.forEach(cap => capabilities.add(cap));
      }
    }
  }

  // Extract from description keywords
  const descLower = description.toLowerCase();

  // Common capability patterns
  const capabilityPatterns: Record<string, string[]> = {
    'implement': ['code_implementation', 'feature_development'],
    'test': ['testing', 'validation', 'quality_assurance'],
    'design': ['design', 'architecture'],
    'deploy': ['deployment', 'release_management'],
    'document': ['documentation', 'technical_writing'],
    'analyze': ['analysis', 'investigation'],
    'refactor': ['code_refactoring', 'optimization'],
    'debug': ['debugging', 'troubleshooting'],
    'security': ['security_analysis', 'vulnerability_scanning'],
    'performance': ['performance_optimization', 'profiling']
  };

  for (const [keyword, caps] of Object.entries(capabilityPatterns)) {
    if (descLower.includes(keyword)) {
      caps.forEach(cap => capabilities.add(cap));
    }
  }

  // Return unique capabilities
  return Array.from(capabilities);
}

/**
 * Extract typical use cases from description
 */
function extractUseCases(description: string, category: AgentCategory): string[] {
  const descLower = description.toLowerCase();
  const useCases: string[] = [];

  // Category-based default use cases
  const categoryUseCases: Record<AgentCategory, string[]> = {
    development: [
      'implement_feature',
      'refactor_code',
      'fix_bugs',
      'code_generation'
    ],
    architecture: [
      'design_system',
      'architecture_review',
      'technical_decisions',
      'create_adrs'
    ],
    qa_security: [
      'verify_implementation',
      'security_audit',
      'test_execution',
      'quality_assurance'
    ],
    documentation: [
      'create_documentation',
      'update_readme',
      'api_docs',
      'user_guides'
    ],
    research: [
      'research_libraries',
      'investigate_approaches',
      'competitive_analysis',
      'technology_research'
    ],
    design: [
      'create_design_system',
      'visual_design',
      'ui_implementation',
      'style_guide'
    ],
    analysis: [
      'analyze_data',
      'create_visualizations',
      'extract_insights',
      'performance_metrics'
    ],
    planning: [
      'clarify_vague_requests',
      'expand_requirements',
      'specification_refinement',
      'requirement_analysis'
    ],
    operations: [
      'deploy_to_production',
      'setup_infrastructure',
      'configure_ci_cd',
      'deployment_automation'
    ],
    unknown: [
      'general_tasks',
      'custom_operations'
    ]
  };

  // Start with category defaults
  useCases.push(...categoryUseCases[category]);

  // Extract action verbs from description
  const actionVerbs = [
    'create', 'build', 'implement', 'develop', 'design',
    'test', 'verify', 'validate', 'deploy', 'release',
    'analyze', 'investigate', 'research', 'document', 'write',
    'refactor', 'optimize', 'fix', 'debug', 'troubleshoot'
  ];

  for (const verb of actionVerbs) {
    if (descLower.includes(verb)) {
      // Try to extract context after verb
      const verbIndex = descLower.indexOf(verb);
      const context = descLower.substring(verbIndex, verbIndex + 50);
      const words = context.split(/\s+/).slice(1, 4);

      if (words.length > 0) {
        const useCase = `${verb}_${words.join('_')}`.replace(/[^a-z_]/g, '');
        if (useCase.length > verb.length + 1) {
          useCases.push(useCase);
        }
      }
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(useCases)).slice(0, 6); // Limit to 6 use cases
}

/**
 * Estimate token usage based on category
 */
function estimateTokenUsage(category: AgentCategory): number {
  const estimates: Record<AgentCategory, number> = {
    development: 50000,       // Code generation is token-heavy
    architecture: 60000,      // Design discussions are verbose
    qa_security: 40000,       // Testing is moderate
    documentation: 35000,     // Writing is efficient
    research: 45000,          // Investigation varies
    design: 45000,            // Creative work moderate
    analysis: 48000,          // Data processing moderate
    planning: 30000,          // Planning is concise
    operations: 40000,        // DevOps moderate
    unknown: 40000            // Conservative estimate
  };

  return estimates[category];
}

/**
 * Validate and normalize agent capability
 */
export function normalizeAgentCapability(agent: Partial<AgentCapability>): AgentCapability {
  return {
    name: agent.name || 'unknown_agent',
    specialization: agent.specialization || 'custom_agent',
    capabilities: agent.capabilities || [],
    tools: agent.tools || [],
    typical_use_cases: agent.typical_use_cases || ['general_tasks'],
    avg_token_usage: agent.avg_token_usage || 40000,
    success_rate: agent.success_rate !== undefined ? agent.success_rate : 0.5
  };
}
