/**
 * SEMANTIC AGENT SELECTOR
 *
 * Intelligent agent selection based on intent, domain, and task type.
 * Replaces primitive keyword matching with contextual understanding.
 */

import type { AgentId } from '../types.js';
import { getAgentSpec } from './agent_specs.js';

export interface ObjectiveAnalysis {
  intent: Intent;
  domain: Domain;
  task_type: TaskType;
  complexity: 'simple' | 'moderate' | 'complex';
  recommended_agents: AgentId[];
  confidence: number;
  reasoning: string;
}

export type Intent =
  | 'create_new'       // Building something from scratch
  | 'modify_existing'  // Changing existing code/content
  | 'investigate'      // Research, exploration, understanding
  | 'validate'         // Testing, verification, quality checks
  | 'document'         // Writing docs, explanations
  | 'deploy'           // Shipping, releasing, deploying
  | 'fix_issue'        // Bug fixing, problem solving
  | 'optimize'         // Performance, refactoring, cleanup
  | 'design';          // Architecture, planning, design

export type Domain =
  | 'code'             // Software implementation
  | 'infrastructure'   // DevOps, deployment, CI/CD
  | 'security'         // Security, vulnerabilities, audits
  | 'data'             // Databases, data processing
  | 'ui_ux'            // User interface, design systems
  | 'documentation'    // Technical writing, docs
  | 'testing'          // QA, tests, validation
  | 'creative'         // Art, writing, creative work
  | 'research'         // Investigation, exploration
  | 'architecture';    // System design, planning

export type TaskType =
  | 'technical'        // Requires coding/technical skills
  | 'analytical'       // Requires analysis/investigation
  | 'creative'         // Requires creativity/imagination
  | 'operational'      // Requires execution/deployment
  | 'communicative';   // Requires writing/documentation

/**
 * Analyzes an objective to determine intent, domain, and task type
 */
export function analyzeObjectiveSemantic(objective: string): ObjectiveAnalysis {
  const lower = objective.toLowerCase();

  // Determine intent
  const intent = detectIntent(lower);

  // Determine domain
  const domain = detectDomain(lower, intent);

  // Determine task type
  const task_type = detectTaskType(lower, intent, domain);

  // Determine complexity
  const complexity = detectComplexity(lower);

  // Recommend agents based on intent + domain + task_type
  const { agents, confidence, reasoning } = recommendAgents(intent, domain, task_type, complexity, lower);

  return {
    intent,
    domain,
    task_type,
    complexity,
    recommended_agents: agents,
    confidence,
    reasoning
  };
}

/**
 * Detects the primary intent behind the objective
 */
function detectIntent(objective: string): Intent {
  // DEPLOY - Check this FIRST before CREATE_NEW to catch infrastructure setup
  // Includes both traditional deployment verbs AND setup verbs with infrastructure context
  if (
    // Traditional deployment verbs (don't need infrastructure keywords)
    /\b(deploy|release|publish|ship|launch)\b/.test(objective) ||
    // Setup verbs WITH infrastructure keywords
    (
      /\b(provision|configure|setup|install|establish|initialize)\b/.test(objective) &&
      /\b(infrastructure|cloud|production|server|cluster|environment|deployment|resources)\b/.test(objective)
    )
  ) {
    return 'deploy';
  }

  // CREATE_NEW - Building from scratch
  if (
    /\b(create|build|generate|make|develop|implement|add|setup|configure|install|provision|establish|initialize)\s+(a|an|new)/.test(objective) ||
    /^(create|build|generate|make|setup|configure|install|provision)\s+\w+/.test(objective)
  ) {
    return 'create_new';
  }

  // INVESTIGATE - Research and exploration
  if (
    /\b(research|investigate|explore|understand|learn|find out|discover|analyze)\b/.test(objective) ||
    /^(what|how|why|where|when)\b/.test(objective)
  ) {
    return 'investigate';
  }

  // VALIDATE - Testing and verification
  if (
    /\b(test|verify|validate|check|ensure|confirm|audit)\b/.test(objective) &&
    !/\b(create|build|implement)\b/.test(objective)
  ) {
    return 'validate';
  }

  // FIX_ISSUE - Bug fixing and problem solving
  if (
    /\b(fix|repair|resolve|solve|debug|patch|correct)\b/.test(objective) ||
    /\b(bug|error|issue|problem|broken)\b/.test(objective)
  ) {
    return 'fix_issue';
  }

  // MODIFY_EXISTING - Changing what exists
  if (
    /\b(update|modify|change|edit|adjust|refactor|improve|enhance|style|restyle|redesign)\b/.test(objective) &&
    !/\b(create|build|new)\b/.test(objective)
  ) {
    return 'modify_existing';
  }

  // DOCUMENT - Writing documentation
  if (
    /\b(document|write|explain|describe)\b.*\b(docs|documentation|readme|guide|tutorial)\b/.test(objective) ||
    /\b(docs|documentation|readme)\b/.test(objective)
  ) {
    return 'document';
  }

  // OPTIMIZE - Performance and cleanup
  if (
    /\b(optimize|improve|refactor|cleanup|clean up|streamline)\b/.test(objective) &&
    !/\b(create|build|new)\b/.test(objective)
  ) {
    return 'optimize';
  }

  // DESIGN - Architecture and planning
  if (
    /\b(design|architect|plan|blueprint|structure)\b/.test(objective) &&
    !/\b(implement|code|build)\b/.test(objective)
  ) {
    return 'design';
  }

  // Default: If contains implementation keywords, assume create_new
  if (/\b(implement|code|develop)\b/.test(objective)) {
    return 'create_new';
  }

  // Ultimate default: investigate (safest assumption)
  return 'investigate';
}

/**
 * Detects the domain/area of the objective
 */
function detectDomain(objective: string, intent: Intent): Domain {
  // CREATIVE - Art, writing, creative content
  // Check this FIRST before other domains to avoid misclassification
  const creativeIndicators = [
    /\b(poem|haiku|sonnet|limerick|verse|rhyme|poetry)\b/,
    /\b(story|tale|narrative|fiction|novel)\b/,
    /\b(art|artwork|drawing|painting|illustration)\b/,
    /\b(creative|artistic|imaginative)\b/,
    /\b(quote|saying|proverb|motto|slogan)\b/,
    /\b(joke|pun|riddle)\b/,
    /\b(song|lyrics|music)\b/
  ];

  if (creativeIndicators.some(pattern => pattern.test(objective))) {
    return 'creative';
  }

  // SECURITY - Security and vulnerabilities
  // Only if it's actually about security, not just containing the word
  if (
    /\b(security|vulnerability|vulnerabilities|exploit|cve|penetration|audit)\b/.test(objective) &&
    (
      /\b(scan|test|check|audit|fix|patch)\b/.test(objective) ||
      intent === 'validate' ||
      intent === 'investigate'
    )
  ) {
    return 'security';
  }

  // INFRASTRUCTURE - DevOps, CI/CD, deployment
  // Check for infrastructure/cloud platform keywords
  if (
    /\b(docker|kubernetes|k8s|ci\/cd|pipeline|github actions|vercel|infrastructure)\b/.test(objective) ||
    /\b(aws|azure|gcp|cloud)\b/.test(objective) && intent === 'deploy' ||
    (
      /\b(container|cloud|aws|azure|gcp|cluster)\b/.test(objective) &&
      /\b(orchestration)\b/.test(objective)
    )
  ) {
    return 'infrastructure';
  }

  // TESTING - QA and test execution
  if (
    /\b(test|testing|qa|quality assurance|e2e|integration|unit)\b/.test(objective) &&
    intent === 'validate'
  ) {
    return 'testing';
  }

  // UI_UX - Design systems and user interfaces
  // Check for explicit UI/UX keywords first
  // BUT: "React component" without design/UI context should be code domain
  if (
    /\b(ui|ux|design system|component library|interface|frontend)\b/.test(objective) ||
    (
      /\b(react|vue|svelte)\b/.test(objective) &&
      /\b(design|interface|layout|styling|visual|dashboard)\b/.test(objective)
    )
  ) {
    return 'ui_ux';
  }

  // Check for visual/styling keywords, but exclude database-related design
  if (
    /\b(style|layout|responsive|visual|dashboard|visualization)\b/.test(objective) &&
    !/\b(database|schema|table|sql)\b/.test(objective)
  ) {
    return 'ui_ux';
  }

  // "design" keyword only triggers ui_ux if combined with UI-related context
  if (
    /\b(design)\b/.test(objective) &&
    /\b(component|interface|layout|page|screen|view|mockup|prototype)\b/.test(objective) &&
    !/\b(database|schema|table|api|system architecture)\b/.test(objective)
  ) {
    return 'ui_ux';
  }

  // DATA - Databases and data processing
  if (
    /\b(database|sql|nosql|postgres|mongo|data|dataset|query|schema)\b/.test(objective)
  ) {
    return 'data';
  }

  // DOCUMENTATION - Technical writing
  if (
    /\b(docs|documentation|readme|guide|tutorial|manual|wiki)\b/.test(objective) ||
    intent === 'document'
  ) {
    return 'documentation';
  }

  // ARCHITECTURE - System design
  if (
    /\b(architecture|design|pattern|structure|blueprint|system design)\b/.test(objective) &&
    intent === 'design'
  ) {
    return 'architecture';
  }

  // RESEARCH - Investigation and exploration
  if (intent === 'investigate') {
    return 'research';
  }

  // CODE - Default for technical work
  if (
    /\b(code|implement|develop|build|function|class|api|endpoint|feature)\b/.test(objective) ||
    intent === 'create_new' ||
    intent === 'modify_existing' ||
    intent === 'fix_issue'
  ) {
    return 'code';
  }

  // Default to code for technical intents
  return 'code';
}

/**
 * Detects the task type
 */
function detectTaskType(objective: string, intent: Intent, domain: Domain): TaskType {
  // CREATIVE - Creative domain is always creative task
  if (domain === 'creative') {
    return 'creative';
  }

  // COMMUNICATIVE - Documentation and writing
  if (domain === 'documentation' || intent === 'document') {
    return 'communicative';
  }

  // ANALYTICAL - Research and investigation
  if (intent === 'investigate' || domain === 'research') {
    return 'analytical';
  }

  // OPERATIONAL - Deployment and infrastructure
  if (domain === 'infrastructure' || intent === 'deploy') {
    return 'operational';
  }

  // TECHNICAL - Everything else (code, testing, security, data)
  return 'technical';
}

/**
 * Detects complexity level
 */
function detectComplexity(objective: string): 'simple' | 'moderate' | 'complex' {
  const words = objective.split(/\s+/).length;

  // Complexity indicators
  const complexIndicators = [
    /\b(entire|complete|full|comprehensive|end-to-end)\b/,
    /\b(multiple|several|various|many)\b/,
    /\b(integrate|integration|across|between)\b/,
    /\b(system|platform|framework|architecture)\b/
  ];

  const hasComplexIndicator = complexIndicators.some(pattern => pattern.test(objective));

  // Very short = simple
  if (words <= 5 && !hasComplexIndicator) {
    return 'simple';
  }

  // Long or has complexity indicators = complex
  if (words > 15 || hasComplexIndicator) {
    return 'complex';
  }

  return 'moderate';
}

/**
 * Recommends agents based on semantic analysis
 */
function recommendAgents(
  intent: Intent,
  domain: Domain,
  task_type: TaskType,
  complexity: 'simple' | 'moderate' | 'complex',
  objective: string
): { agents: AgentId[]; confidence: number; reasoning: string } {
  const agents: AgentId[] = [];
  let reasoning = '';

  // CREATIVE TASKS - Very specific handling
  if (task_type === 'creative') {
    agents.push('the_scribe'); // Creative writing and content generation
    agents.push('cinna'); // Visual design and creative content
    reasoning = `Creative task detected (${domain}). Creative content specialists selected.`;
    return { agents, confidence: 0.95, reasoning };
  }

  // ANALYTICAL TASKS - Research and investigation
  if (task_type === 'analytical') {
    agents.push('the_didact'); // Research and investigation
    if (domain === 'code' || domain === 'architecture') {
      agents.push('the_cartographer'); // Code analysis
    }
    reasoning = `Analytical task (${intent}) in ${domain} domain. Research and analysis agents selected.`;
    return { agents, confidence: 0.9, reasoning };
  }

  // COMMUNICATIVE TASKS - Documentation
  if (task_type === 'communicative') {
    agents.push('the_scribe'); // Technical writing
    if (domain === 'code') {
      agents.push('the_cartographer'); // Code documentation
    }
    reasoning = `Documentation task in ${domain} domain. Writing specialists selected.`;
    return { agents, confidence: 0.9, reasoning };
  }

  // OPERATIONAL TASKS - Deployment and infrastructure
  if (task_type === 'operational') {
    agents.push('the_sentinel'); // DevOps and deployment
    if (domain === 'infrastructure') {
      agents.push('the_curator'); // Dependency and config management
    }
    reasoning = `Operational task (${intent}) in ${domain} domain. DevOps agents selected.`;
    return { agents, confidence: 0.9, reasoning };
  }

  // UI_UX DOMAIN TASKS - Design and visual work
  if (domain === 'ui_ux') {
    agents.push('cinna'); // Design specialist
    if (intent === 'create_new' || intent === 'design') {
      agents.push('the_architect'); // System design
    }
    agents.push('hollowed_eyes'); // Implementation
    reasoning = `UI/UX task in ${domain} domain. Design and implementation specialists selected.`;
    return { agents, confidence: 0.9, reasoning };
  }

  // TECHNICAL TASKS - Code implementation
  if (task_type === 'technical') {
    // Intent-based selection
    switch (intent) {
      case 'create_new':
      case 'modify_existing':
        // Check if task involves visual/design work (beyond pure ui_ux domain)
        if (/\b(visual|dashboard|interface|design|component library)\b/.test(objective)) {
          agents.push('cinna'); // Design first
        }
        agents.push('hollowed_eyes'); // Primary implementation
        if (complexity === 'complex') {
          agents.push('the_architect'); // For complex architectural decisions
        }
        reasoning = `Implementation task (${intent}) with ${complexity} complexity. Implementation agents selected.`;
        break;

      case 'fix_issue':
        agents.push('hollowed_eyes'); // Bug fixing and code changes
        agents.push('loveless'); // Verification after fix
        reasoning = `Bug fix task in ${domain} domain. Implementation + verification agents selected.`;
        break;

      case 'validate':
        agents.push('loveless'); // Testing and QA
        if (domain === 'security') {
          agents.push('the_sentinel'); // Security validation
        }
        reasoning = `Validation task in ${domain} domain. QA and testing agents selected.`;
        break;

      case 'design':
        agents.push('the_architect'); // Architecture and design
        reasoning = `Design task in ${domain} domain. Architecture specialist selected.`;
        break;

      case 'optimize':
        agents.push('hollowed_eyes'); // Code refactoring
        agents.push('the_curator'); // Dependency optimization
        reasoning = `Optimization task in ${domain} domain. Refactoring specialists selected.`;
        break;

      case 'deploy':
        agents.push('the_sentinel'); // Deployment
        reasoning = `Deployment task. DevOps specialist selected.`;
        break;

      default:
        agents.push('hollowed_eyes'); // Default to implementation
        reasoning = `Technical task (${intent}) in ${domain} domain. Default implementation agent selected.`;
    }

    return { agents, confidence: 0.85, reasoning };
  }

  // FALLBACK - Should rarely reach here
  agents.push('the_didact'); // Default to research
  reasoning = `Unclear task classification. Defaulting to research agent for investigation.`;
  return { agents, confidence: 0.6, reasoning };
}

/**
 * Get capabilities for backward compatibility with existing code
 */
export function getCapabilitiesFromAnalysis(analysis: ObjectiveAnalysis): string[] {
  const capabilities: string[] = [];

  // Map domain to capabilities
  switch (analysis.domain) {
    case 'code':
      capabilities.push('code_implementation');
      break;
    case 'infrastructure':
      capabilities.push('deployment_automation', 'docker_orchestration');
      break;
    case 'security':
      capabilities.push('security_validation', 'vulnerability_scanning');
      break;
    case 'testing':
      capabilities.push('test_execution', 'quality_assurance');
      break;
    case 'ui_ux':
      capabilities.push('visual_design', 'ui_ux_design');
      break;
    case 'documentation':
      capabilities.push('technical_writing', 'api_documentation');
      break;
    case 'data':
      capabilities.push('data_processing', 'database_management');
      break;
    case 'architecture':
      capabilities.push('architecture_design', 'design_patterns');
      break;
    case 'research':
      capabilities.push('documentation_research', 'investigation');
      break;
    case 'creative':
      capabilities.push('creative_writing', 'content_generation');
      break;
  }

  // Map intent to additional capabilities
  switch (analysis.intent) {
    case 'validate':
      capabilities.push('quality_assurance', 'testing_automation');
      break;
    case 'deploy':
      capabilities.push('deployment_automation', 'release_preparation');
      break;
    case 'investigate':
      capabilities.push('documentation_research', 'investigation');
      break;
  }

  return capabilities.length > 0 ? capabilities : ['code_implementation'];
}
