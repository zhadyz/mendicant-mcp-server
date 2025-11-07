# Mendicant MCP Server - Usage Guide

## Introduction

This guide provides comprehensive usage patterns for the Mendicant MCP Server. The server implements the mendicant_bias orchestration pattern through a collection of tools that enable strategic planning, adaptive learning, and multi-agent coordination.

**Target Audience:** Claude Code instances orchestrating specialized agents
**Prerequisites:** Understanding of Claude Code's Task tool and agent system

## Quick Start

### Minimal Workflow

```typescript
// 1. Plan the objective
const plan = await mendicant_plan("implement user authentication");

// 2. Execute agents sequentially or in parallel
for (const agent of plan.agents) {
  await Task(agent.agent_id, agent.prompt);
}

// 3. Record feedback for learning
await mendicant_record_feedback({
  agent_id: "hollowed_eyes",
  success: true,
  tokens_used: 45000
});
```

### Progressive Adoption Path

**Week 1:** Use `mendicant_plan` for all multi-agent workflows
**Week 2:** Add `mendicant_analyze` for autonomous mode
**Week 3:** Integrate `mendicant_record_feedback` for learning
**Week 4:** Leverage `mendicant_predict_agents` for optimization

---

## Tool Categories

### Core Planning Tools

Tools for strategic planning and execution strategy.

#### `mendicant_plan`

**Purpose:** Generate strategic orchestration plan from objective

**When to use:**
- Multi-agent workflows (3+ agents)
- Unfamiliar problem domains
- Need execution strategy guidance (sequential vs parallel)
- Want to leverage pattern library

**When NOT to use:**
- Single-agent tasks (just spawn the agent directly)
- Already know exact agent sequence
- Simple, well-understood operations

**Capabilities:**
- Pattern matching against objective keywords
- Agent selection based on capabilities
- Dependency ordering
- Token estimation
- Execution strategy (sequential/parallel/phased)

**Limitations:**
- Prompts are templates requiring context enrichment
- Pattern matching is keyword-based, not semantic
- Cannot understand codebase specifics
- No awareness of prior conversation context

**Example:**

```typescript
// Input
const plan = await mendicant_plan("scaffold authentication system", {
  context: {
    project_type: "nextjs",
    has_tests: false
  },
  constraints: {
    max_agents: 5,
    prefer_parallel: false
  }
});

// Output
{
  agents: [
    {
      agent_id: "the_architect",
      task_description: "Design authentication architecture",
      prompt: "Design a secure authentication architecture for a Next.js application...",
      dependencies: [],
      priority: "high"
    },
    {
      agent_id: "hollowed_eyes",
      task_description: "Implement authentication",
      prompt: "Implement the authentication system based on the architecture...",
      dependencies: ["the_architect"],
      priority: "critical"
    },
    {
      agent_id: "loveless",
      task_description: "Verify implementation",
      prompt: "Test and verify the authentication implementation...",
      dependencies: ["hollowed_eyes"],
      priority: "critical"
    }
  ],
  execution_strategy: "sequential",
  success_criteria: "Authentication implemented and verified",
  estimated_tokens: 120000,
  pattern_matched: "SCAFFOLD"
}

// Usage
for (const agent of plan.agents) {
  // Enrich prompt with project-specific context
  const enriched_prompt = `${agent.prompt}\n\nProject context: ${project_details}`;
  await Task(agent.agent_id, enriched_prompt);
}
```

#### `mendicant_coordinate`

**Purpose:** Structured synthesis of multi-agent results

**When to use:**
- 5+ agents with complex interdependencies
- Need automated gap detection
- Building tooling that requires structured output
- Want basic conflict flagging

**When NOT to use:**
- 1-3 agents (natural synthesis is better)
- Need semantic conflict detection (you're better at this)
- Simple, clear results

**Capabilities:**
- Structured result aggregation
- Keyword-based conflict detection
- Gap identification (missing agents)
- Metadata extraction

**Limitations:**
- **Cannot perform semantic synthesis** (requires LLM intelligence)
- Conflict detection is keyword-based only
- Cannot resolve conflicts, only flag them
- Does not add intelligence, only structure

**Example:**

```typescript
// Input
const coordination = await mendicant_coordinate("implement state management", [
  {
    agent_id: "the_architect",
    output: "Recommended Redux for global state management...",
    success: true,
    duration_ms: 25000,
    tokens_used: 30000
  },
  {
    agent_id: "hollowed_eyes",
    output: "Implemented using Zustand for state management...",
    success: true,
    duration_ms: 40000,
    tokens_used: 45000
  },
  {
    agent_id: "loveless",
    output: "Tests passing with current implementation",
    success: true,
    duration_ms: 20000,
    tokens_used: 25000
  }
]);

// Output
{
  synthesis: "Three agents completed state management implementation",
  conflicts: [
    {
      agents: ["the_architect", "hollowed_eyes"],
      issue: "Different state management libraries mentioned (Redux vs Zustand)",
      severity: "high",
      requires_resolution: true
    }
  ],
  gaps: [],
  recommendations: [
    "Verify state management library consistency",
    "Ensure all components use the chosen solution"
  ],
  verification_needed: true
}

// Note: You would naturally detect this conflict anyway when reading the results
// This tool provides structure but not intelligence
```

#### `mendicant_analyze`

**Purpose:** Project health assessment and recommendations

**When to use:**
- Autonomous mode (proactive scanning)
- Before planning (understand current state)
- After major changes (verify health)
- Continuous monitoring scenarios

**When NOT to use:**
- You're already examining test results manually
- Need deep semantic analysis
- Want actual fixes (this only recommends)

**Capabilities:**
- Health score calculation (0-100)
- Critical issue flagging
- Agent recommendations
- Prioritization guidance

**Limitations:**
- Operates only on provided structured data
- Health score is heuristic-based
- Cannot read files or codebase
- Recommendations are rule-based

**Example:**

```typescript
// Input
const analysis = await mendicant_analyze({
  context: {
    git_status: "modified: 15 files, untracked: 3 files",
    test_results: {
      passed: 142,
      failed: 8,
      total: 150,
      coverage: 78.5
    },
    build_status: "success with warnings",
    recent_errors: [
      "TypeError in auth.service.ts",
      "Import resolution failure in test file"
    ]
  }
});

// Output
{
  health_score: 72,
  critical_issues: [
    {
      type: "test_failures",
      severity: "high",
      description: "8 tests failing (5.3% failure rate)",
      affected_files: ["auth.service.test.ts", "user.controller.test.ts"],
      suggested_fix: "Run loveless for investigation, then hollowed_eyes for fixes"
    },
    {
      type: "build_warnings",
      severity: "medium",
      description: "Build completed with warnings",
      suggested_fix: "Review build output and address warnings"
    }
  ],
  recommendations: [
    {
      action: "fix_failing_tests",
      priority: "critical",
      agents: ["loveless", "hollowed_eyes"]
    },
    {
      action: "reduce_uncommitted_changes",
      priority: "medium",
      agents: ["the_curator"]
    }
  ],
  suggested_agents: ["loveless", "hollowed_eyes", "the_curator"]
}

// Usage
const plan = await mendicant_plan(
  `Fix critical issues: ${analysis.critical_issues.map(i => i.description).join(', ')}`
);
```

---

### Adaptive Learning Tools (Mahoraga System)

Tools for continuous learning and optimization through execution history.

#### `mendicant_record_feedback`

**Purpose:** Record agent execution outcomes for passive learning

**When to use:**
- After every agent execution
- Building execution history
- Want performance tracking
- Enable adaptive improvements

**Usage Pattern:**

```typescript
// After agent execution
const result = await Task("hollowed_eyes", "implement feature X");

await mendicant_record_feedback({
  agent_id: "hollowed_eyes",
  success: result.success,
  tokens_used: result.tokens,
  duration_ms: result.duration,
  error: result.error || undefined
});
```

**Impact:** Builds statistical model for `mendicant_predict_agents` and `mendicant_analyze_failure`

#### `mendicant_discover_agents`

**Purpose:** Register custom agents at runtime

**When to use:**
- Created new specialized agents
- Integrating third-party agents
- Dynamic agent systems

**Example:**

```typescript
await mendicant_discover_agents({
  agent_ids: ["custom_ml_agent", "custom_security_agent"]
});
```

#### `mendicant_list_learned_agents`

**Purpose:** Query agent performance statistics

**Example:**

```typescript
// Get all agents
const all_agents = await mendicant_list_learned_agents({ ranked: false });

// Get agents ranked by success rate
const ranked = await mendicant_list_learned_agents({ ranked: true });

// Output
{
  "hollowed_eyes": {
    total_executions: 156,
    success_rate: 0.92,
    avg_tokens: 42000,
    avg_duration_ms: 35000,
    last_used: "2025-01-15T10:30:00Z"
  },
  "loveless": {
    total_executions: 203,
    success_rate: 0.95,
    avg_tokens: 28000,
    avg_duration_ms: 22000,
    last_used: "2025-01-15T11:15:00Z"
  }
}
```

#### `mendicant_predict_agents`

**Purpose:** Predict agent success rates before execution

**When to use:**
- Choosing between multiple agent candidates
- Resource optimization decisions
- Risk assessment before expensive operations

**Capabilities:**
- Statistical prediction based on history
- Confidence scoring
- Context-aware predictions

**Example:**

```typescript
const predictions = await mendicant_predict_agents({
  agent_ids: ["hollowed_eyes", "the_architect", "loveless"],
  objective: "implement authentication feature",
  context: { project_type: "nextjs" }
});

// Output
{
  predictions: [
    {
      agent_id: "hollowed_eyes",
      predicted_success_rate: 0.89,
      confidence: 0.85,
      similar_executions: 23,
      reasoning: "High success rate on similar implementation tasks in Next.js projects"
    },
    {
      agent_id: "the_architect",
      predicted_success_rate: 0.92,
      confidence: 0.78,
      similar_executions: 15,
      reasoning: "Consistently successful on architecture design tasks"
    },
    {
      agent_id: "loveless",
      predicted_success_rate: 0.94,
      confidence: 0.90,
      similar_executions: 31,
      reasoning: "Very high success rate on verification and testing tasks"
    }
  ]
}

// Usage: Prioritize agents with high predicted success rates
const best_agent = predictions.predictions.sort(
  (a, b) => b.predicted_success_rate - a.predicted_success_rate
)[0];
```

#### `mendicant_analyze_failure`

**Purpose:** Root cause analysis for agent failures

**When to use:**
- Agent execution failed
- Need to understand failure patterns
- Want alternative approaches
- Debugging orchestration issues

**Capabilities:**
- Pattern matching against historical failures
- Root cause hypothesis generation
- Alternative agent suggestions
- Avoidance rule generation

**Example:**

```typescript
// Agent failed during execution
const analysis = await mendicant_analyze_failure({
  objective: "implement database migrations",
  failed_agent_id: "hollowed_eyes",
  error: "ModuleNotFoundError: No module named 'alembic'",
  preceding_agents: ["the_architect"],
  context: { project_type: "python" }
});

// Output
{
  failure_patterns: [
    {
      pattern: "Missing dependency in implementation phase",
      frequency: 12,
      common_context: "python projects",
      typical_solution: "Install dependencies before implementation"
    }
  ],
  root_cause_hypothesis: "Dependencies were not installed before implementation agent execution",
  avoidance_rules: [
    "Always verify dependencies before spawning implementation agents",
    "Consider spawning the_sentinel first for dependency management"
  ],
  suggested_fixes: [
    "Install alembic package",
    "Update requirements.txt or pyproject.toml",
    "Re-run hollowed_eyes after dependency installation"
  ],
  alternative_agents: [
    {
      agent_id: "the_sentinel",
      reason: "Specialized in dependency and environment management",
      confidence: 0.88
    }
  ],
  confidence: 0.82
}
```

#### `mendicant_refine_plan`

**Purpose:** Improve failed plan using learned patterns

**When to use:**
- Plan execution failed
- Want systematic improvement
- Leverage historical successes

**Example:**

```typescript
// Original plan failed
const original_plan = { /* ... failed plan ... */ };
const failure_context = await mendicant_analyze_failure(/* ... */);

const refinement = await mendicant_refine_plan({
  original_plan,
  failure_context,
  objective: "implement database migrations",
  project_context: { project_type: "python" }
});

// Output
{
  refined_plan: {
    agents: [
      {
        agent_id: "the_sentinel",
        task_description: "Setup dependencies and environment",
        prompt: "Install and configure alembic and database dependencies...",
        dependencies: [],
        priority: "critical"
      },
      {
        agent_id: "hollowed_eyes",
        task_description: "Implement migrations",
        prompt: "Create database migration scripts...",
        dependencies: ["the_sentinel"],
        priority: "high"
      },
      {
        agent_id: "loveless",
        task_description: "Verify migrations",
        prompt: "Test migration up/down sequences...",
        dependencies: ["hollowed_eyes"],
        priority: "medium"
      }
    ],
    execution_strategy: "sequential"
  },
  changes_made: [
    {
      type: "agent_addition",
      agent_id: "the_sentinel",
      position: 0,
      reason: "Missing dependency management step"
    }
  ],
  reasoning: "Added the_sentinel at start to handle dependency installation before implementation",
  confidence: 0.85
}
```

#### `mendicant_find_patterns`

**Purpose:** Discover similar successful executions

**When to use:**
- Exploring new problem domains
- Want proven approaches
- Learning from history

**Example:**

```typescript
const patterns = await mendicant_find_patterns({
  objective: "implement real-time notifications",
  context: { project_type: "nextjs" },
  limit: 5
});

// Output
{
  patterns: [
    {
      objective: "implement real-time chat",
      agents_used: ["the_architect", "the_didact", "hollowed_eyes", "loveless"],
      similarity_score: 0.87,
      success_rate: 0.93,
      execution_count: 4,
      avg_tokens: 125000,
      context: { project_type: "nextjs" }
    },
    {
      objective: "add websocket support",
      agents_used: ["hollowed_eyes", "loveless"],
      similarity_score: 0.76,
      success_rate: 0.89,
      execution_count: 7,
      avg_tokens: 85000,
      context: { project_type: "nextjs" }
    }
  ]
}

// Usage: Leverage proven agent sequences for similar objectives
```

---

## Workflow Patterns

### Pattern: Basic Multi-Agent Task

```typescript
// 1. Plan
const plan = await mendicant_plan("implement user authentication");

// 2. Execute
for (const agent of plan.agents) {
  const result = await Task(agent.agent_id, agent.prompt);

  // 3. Record feedback
  await mendicant_record_feedback({
    agent_id: agent.agent_id,
    success: result.success,
    tokens_used: result.tokens,
    duration_ms: result.duration
  });
}
```

### Pattern: Adaptive Execution with Prediction

```typescript
// 1. Get predictions
const predictions = await mendicant_predict_agents({
  agent_ids: ["hollowed_eyes", "the_architect"],
  objective: "refactor legacy code",
  context: { project_type: "python" }
});

// 2. Choose best agent
const best = predictions.predictions[0];

// 3. Execute
const result = await Task(best.agent_id, prompt);

// 4. Record
await mendicant_record_feedback({
  agent_id: best.agent_id,
  success: result.success
});
```

### Pattern: Failure Recovery

```typescript
try {
  // 1. Execute agent
  const result = await Task("hollowed_eyes", "implement feature");

  if (!result.success) {
    // 2. Analyze failure
    const analysis = await mendicant_analyze_failure({
      objective: "implement feature",
      failed_agent_id: "hollowed_eyes",
      error: result.error,
      preceding_agents: []
    });

    // 3. Try alternative
    const alternative = analysis.alternative_agents[0];
    await Task(alternative.agent_id, prompt);
  }
} catch (error) {
  // Handle error
}
```

### Pattern: Autonomous Health Monitoring

```typescript
// 1. Analyze project
const analysis = await mendicant_analyze({
  context: {
    git_status: await bash("git status"),
    test_results: await parseTestOutput(),
    build_status: await parseBuildOutput()
  }
});

// 2. Plan intervention if needed
if (analysis.health_score < 80) {
  const plan = await mendicant_plan(
    `Address critical issues: ${analysis.critical_issues.map(i => i.description).join(', ')}`
  );

  // 3. Execute plan
  for (const agent of plan.agents) {
    await Task(agent.agent_id, agent.prompt);
  }
}
```

---

## Integration with Commands

### Autonomous Mode Command

```markdown
# .claude/commands/autonomous.md

You are embodying the **mendicant_bias orchestration pattern**.

**Workflow:**

1. **Assess:** `mendicant_analyze()` to evaluate project health
2. **Plan:** `mendicant_plan()` based on critical issues
3. **Execute:** Spawn agents using Task tool
4. **Learn:** `mendicant_record_feedback()` after each agent
5. **Synthesize:** Present unified results to user
```

### Fix Command

```markdown
# .claude/commands/fix.md

You are using mendicant intelligence for systematic issue resolution.

**Workflow:**

1. **Understand:** Gather context about the issue
2. **Predict:** `mendicant_predict_agents()` to choose best approach
3. **Plan:** `mendicant_plan()` for the fix
4. **Execute:** Run agents sequentially
5. **Recover:** If failure, use `mendicant_analyze_failure()` + `mendicant_refine_plan()`
6. **Learn:** Record all feedback
```

---

## Best Practices

### DO

✅ **Enrich prompts with context:** Plan prompts are templates - add project specifics
✅ **Record all executions:** Enable learning through consistent feedback
✅ **Use predictions strategically:** Let data guide agent selection
✅ **Leverage patterns:** Check `mendicant_find_patterns` for proven approaches
✅ **Handle failures systematically:** Use analyze_failure → refine_plan workflow

### DON'T

❌ **Don't call mendicant_plan for single agents:** Just spawn the agent directly
❌ **Don't expect semantic understanding:** Server provides structure, not intelligence
❌ **Don't over-rely on coordination:** You're better at synthesis than keyword matching
❌ **Don't skip feedback recording:** Learning requires consistent data
❌ **Don't treat predictions as guarantees:** They're statistical estimates

---

## Performance Optimization

### Token Efficiency

```typescript
// Inefficient: Over-planning
await mendicant_plan("run tests");  // Just spawn loveless directly

// Efficient: Plan complex workflows
await mendicant_plan("scaffold microservice with CI/CD");
```

### Execution Strategy

```typescript
// Use parallel execution for independent tasks
const plan = await mendicant_plan(objective, {
  constraints: { prefer_parallel: true }
});

// Respect dependencies for sequential tasks
if (plan.execution_strategy === "sequential") {
  for (const agent of plan.agents) {
    await Task(agent.agent_id, agent.prompt);
  }
}
```

---

## Troubleshooting

### Pattern Mismatch

**Problem:** Plan doesn't match objective

**Solutions:**
1. Make objective more specific: "debug login bug" → "investigate and fix OAuth login authentication failure"
2. Provide context: `{ project_type: "nextjs", has_tests: true }`
3. Check pattern library keywords in src/knowledge/patterns.ts

### Low Prediction Confidence

**Problem:** Predictions have low confidence scores

**Solutions:**
1. Record more execution feedback (bootstrap problem)
2. Provide richer context
3. Use `mendicant_find_patterns` to discover similar successful cases

### Coordination Misses Conflicts

**Problem:** Obvious conflicts not detected

**Explanation:** Coordination uses keyword matching, not semantic understanding

**Solution:** Do synthesis yourself - you're better at detecting semantic conflicts

---

## Advanced Usage

### Mnemosyne Integration

```typescript
// Store execution in mnemosyne
await mnemosyne.createEntities([{
  name: `Execution: ${objective}`,
  entityType: "execution_history",
  observations: [
    `Objective: ${objective}`,
    `Agents: ${agents.join(', ')}`,
    `Success: ${success}`,
    `Tokens: ${total_tokens}`
  ]
}]);

// Query history for planning
const past = await mnemosyne.searchNodes("authentication implementation");
const plan = await mendicant_plan(objective, {
  past_executions: past.results
});
```

### Custom Pattern Creation

Add patterns to your workflow by modifying agent sequences based on learned successes:

```typescript
// Discover successful pattern
const patterns = await mendicant_find_patterns({
  objective: "implement real-time feature",
  limit: 1
});

// Reuse agent sequence
const proven_sequence = patterns.patterns[0].agents_used;
for (const agent_id of proven_sequence) {
  await Task(agent_id, customPrompt);
}
```

---

## Metrics and Monitoring

Track orchestration effectiveness:

```typescript
const agents = await mendicant_list_learned_agents({ ranked: true });

// Monitor:
// - Success rates by agent
// - Average token consumption
// - Execution duration trends
// - Pattern match accuracy
```

---

## Cycle 5 Features Usage

Cycle 5 introduces semantic intelligence, cross-project learning, and hybrid real-time sync. All features are opt-in with graceful fallbacks.

### Semantic Agent Matching

**What it provides:** Embedding-based agent selection using OpenAI for 15-20% accuracy improvement.

**Setup:**
```bash
# Set API key
export OPENAI_API_KEY="sk-..."

# Configure in .mendicant/config.json
{
  "features": {
    "semanticMatching": {
      "enabled": true,
      "weight": 0.30
    }
  }
}
```

**Usage Pattern:**
```typescript
// Standard planning - semantic matching automatic
const plan = await mendicant_plan(
  "Fix OAuth authentication bug in Next.js"
);

// Server uses semantic understanding:
// - "OAuth" + "authentication" + "bug" → security + debugging
// - Selects hollowed_eyes with 87% semantic similarity
// - Final score: 30% semantic + 70% historical/context = 82%
```

**Performance Optimization:**
```typescript
// Check cache effectiveness
const stats = await intelligentSelector.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
console.log(`API calls saved: ${stats.hits} / ${stats.total}`);

// Expected steady state:
// - Hit rate: 94-96%
// - API calls: ~5% of total
// - Monthly cost: ~$0.003
```

**Fallback Behavior:**
```typescript
// If OpenAI API fails:
// 1. Automatic fallback to keyword-based matching
// 2. Confidence reduced to 0.5
// 3. Log warning but continue execution
// 4. Zero user intervention required

// Check logs for fallback mode:
// [SemanticMatchingService] No OpenAI API key, using keyword-based matching
```

**Cost Management:**
```typescript
// Monitor API usage
{
  "embeddings": {
    "cache": {
      "l1Size": 200,        // Increase for higher cache hit rate
      "l2TTL": 172800,      // 48 hours (longer persistence)
      "l3TTL": 15552000     // 180 days (maximum persistence)
    }
  }
}

// Result: 95%+ cache hit rate = ~$0.003/month typical usage
```

---

### Cross-Project Learning

**What it provides:** Learn from patterns across projects while respecting privacy boundaries.

**Setup:**
```json
{
  "crossProjectLearning": {
    "enabled": true,
    "scope": {
      "level": "project",        // user | project | organization | global
      "identifier": "my-app",
      "canShare": false,          // Disable cross-project sharing
      "sensitivity": "internal"   // public | internal | confidential | restricted
    }
  }
}
```

**Usage Pattern - Privacy-First:**
```typescript
// Scenario: Client project with sensitive data
{
  "scope": {
    "level": "project",
    "identifier": "acme-corp-crm",
    "canShare": false,           // Zero cross-project data flow
    "sensitivity": "confidential" // Automatic anonymization
  }
}

// Find patterns - restricted to project scope
const similar = await mendicant_find_patterns(
  "implement OAuth integration"
);

// Returns ONLY patterns from "acme-corp-crm"
// No cross-project leakage
// All PII automatically scrubbed
```

**Usage Pattern - Team Learning:**
```typescript
// Scenario: Internal project, team learning enabled
{
  "scope": {
    "level": "organization",
    "identifier": "engineering-dept",
    "canShare": true,            // Enable cross-project patterns
    "sensitivity": "internal"    // Anonymization still active
  }
}

// Find patterns - org-wide learning
const similar = await mendicant_find_patterns(
  "implement real-time notifications"
);

// Returns patterns from ALL projects in "engineering-dept"
// - chat-app (similarity: 0.89, success: 95%)
// - dashboard-v2 (similarity: 0.78, success: 88%)
// - live-tracker (similarity: 0.71, success: 92%)

// Learn from team's collective experience
```

**Usage Pattern - Public Patterns:**
```typescript
// Scenario: Open-source project, global learning
{
  "scope": {
    "level": "global",
    "identifier": "oss-library",
    "canShare": true,
    "sensitivity": "public"       // Minimal anonymization
  }
}

// Contribute to global pattern library
// Learn from community best practices
// No PII in public projects (verified via sensitivity check)
```

**Privacy Verification:**
```typescript
// Check what data is stored/shared
const scope = await crossProjectService.getCurrentScope();
console.log(`Level: ${scope.level}`);
console.log(`Can share: ${scope.canShare}`);
console.log(`Sensitivity: ${scope.sensitivity}`);

// Verify anonymization for sensitive scopes
if (scope.sensitivity === 'confidential' || scope.sensitivity === 'restricted') {
  // Automatic PII scrubbing enforced
  // - Emails: redacted
  // - Tokens: removed
  // - API keys: removed
  // - Passwords: removed
  // - File paths: anonymized
}
```

**Scoping Key Format:**
```typescript
// Pattern keys follow format:
// pattern:{level}:{identifier}:{type}:{suffix?}

// Examples:
"pattern:project:my-app:execution:auth-impl"      // Project-scoped
"pattern:org:acme-eng:execution:api-integration"  // Org-scoped
"pattern:user:john:execution:debug-workflow"      // User-scoped
"pattern:global:oss:execution:test-setup"         // Global-scoped
```

---

### Hybrid Real-Time Sync

**What it provides:** Critical operations sync immediately (<500ms), non-critical batch async (30s).

**Setup:**
```json
{
  "hybridSync": {
    "enabled": true,
    "realtimeTimeout": 500,
    "batchInterval": 30000
  }
}
```

**Usage Pattern - Automatic Classification:**
```typescript
// Critical operations (real-time sync):
// - Agent selection
// - Failure analysis
// - Conflict detection
// - Plan refinement

const plan = await mendicant_plan(objective);
// ↑ Real-time sync (<500ms)
// If timeout: Falls back to keyword-based selection
// User sees no latency impact

// Non-critical operations (async batch):
// - Pattern storage
// - Aggregate statistics
// - Cache updates
// - Historical analysis

await mendicant_record_feedback({...});
// ↑ Async batch (30s window)
// No blocking, queued for batch processing
```

**Monitoring Sync Performance:**
```typescript
const stats = await syncQueue.getStats();

console.log(`Real-time syncs: ${stats.realtime}`);
console.log(`Async syncs: ${stats.async}`);
console.log(`Timeout fallbacks: ${stats.timeouts}`);
console.log(`Success rate: ${stats.successRate}%`);

// Expected performance:
// - Real-time success: 95%+
// - Timeout fallbacks: <5%
// - Async reliability: 99%+
// - User-perceived latency: <500ms
```

**Failure Handling:**
```typescript
// Real-time operation timeout
const plan = await mendicant_plan(objective);

// If Mnemosyne sync times out (>500ms):
// 1. Falls back to keyword-based selection
// 2. Logs warning: "[HybridSync] Real-time timeout, using fallback"
// 3. Queues sync for next async batch
// 4. Returns result immediately (no blocking)
// 5. User experience: seamless, no errors

// Check retry queue
const queueStatus = await syncQueue.getPendingOps();
console.log(`Pending retries: ${queueStatus.length}`);
```

---

### Cycle 5 Configuration Examples

**Maximum Performance (Production):**
```json
{
  "features": {
    "semanticMatching": {
      "enabled": true,
      "weight": 0.30
    },
    "crossProjectLearning": {
      "enabled": true,
      "scope": {
        "level": "organization",
        "identifier": "engineering",
        "canShare": true,
        "sensitivity": "internal"
      }
    },
    "hybridSync": {
      "enabled": true,
      "realtimeTimeout": 500
    }
  },
  "embeddings": {
    "cache": {
      "l1Size": 200,
      "l2TTL": 172800,
      "l3TTL": 15552000
    }
  }
}
```

**Privacy-First (Client Work):**
```json
{
  "features": {
    "semanticMatching": {
      "enabled": true,
      "weight": 0.30
    },
    "crossProjectLearning": {
      "enabled": false  // No cross-project learning
    },
    "hybridSync": {
      "enabled": true
    }
  }
}
```

**Cost-Optimized (Budget Constrained):**
```json
{
  "features": {
    "semanticMatching": {
      "enabled": false  // No OpenAI API costs
    },
    "crossProjectLearning": {
      "enabled": true   // Free, uses keyword matching
    },
    "hybridSync": {
      "enabled": true   // Free, performance optimization
    }
  }
}
```

---

### Troubleshooting Cycle 5

**Issue: Semantic matching not working**

**Symptoms:**
- All similarity scores are 0.5
- Logs show "keyword fallback"

**Diagnosis:**
```bash
echo $OPENAI_API_KEY
grep "Semantic" /tmp/mendicant-debug.log
```

**Solutions:**
1. API key not set: `export OPENAI_API_KEY="sk-..."`
2. Server not restarted after setting key
3. Firewall blocking OpenAI API
4. API key expired (regenerate at https://platform.openai.com)

---

**Issue: High OpenAI API costs**

**Symptoms:**
- Unexpected billing
- High API call volume

**Diagnosis:**
```typescript
const stats = await intelligentSelector.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

**Solutions:**
1. Low cache hit rate (<80%): Increase L1 size
2. High query diversity: Use keyword fallback for unique queries
3. Development environment: Disable semantic matching in dev
4. Cache not persisting: Check L2/L3 TTL configuration

---

**Issue: Cross-project data leakage concerns**

**Symptoms:**
- Patterns visible across projects
- Privacy requirements not met

**Diagnosis:**
```typescript
const scope = await crossProjectService.getCurrentScope();
console.log(`Can share: ${scope.canShare}`);
console.log(`Sensitivity: ${scope.sensitivity}`);
```

**Solutions:**
1. Set `canShare: false` in config
2. Increase `sensitivity` to "confidential" or "restricted"
3. Use `level: "project"` for strict isolation
4. Verify scoping keys: `pattern:project:{identifier}:*`

---

**Issue: Slow agent selection**

**Symptoms:**
- Agent selection taking >5 seconds
- Timeout fallbacks frequent

**Diagnosis:**
```typescript
console.time('agent-selection');
const plan = await mendicant_plan(objective);
console.timeEnd('agent-selection');
```

**Solutions:**
1. Cold cache: First query always slow (~500ms) - expected
2. Network latency: Check OpenAI API latency
3. Rate limiting: Requests being throttled (check API dashboard)
4. Large agent pool: Reduce number of agents in registry

**Optimization:**
```json
{
  "embeddings": {
    "cache": {
      "l1Size": 200,
      "preload": ["hollowed_eyes", "loveless", "the_architect"]
    }
  }
}
```

---

## Conclusion

The Mendicant MCP Server provides structural intelligence for orchestration. Combine it with your semantic understanding for optimal results:

- **Server:** Pattern matching, learning, structure, semantic intelligence
- **You:** Context, synthesis, intelligence, final decisions

**Cycle 5 Enhancements:**
- Semantic agent matching for 15-20% accuracy improvement
- Cross-project learning with privacy-first design
- Hybrid real-time sync for optimal latency and reliability

Start with `mendicant_plan`, add `mendicant_record_feedback` for learning, and leverage Mahoraga predictions as your execution history grows.

**Additional Resources:**
- Implementation details: [README.md](./README.md)
- Feature documentation: [CYCLE5_FEATURES.md](./CYCLE5_FEATURES.md)
- Migration guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- API setup: [OPENAI_SETUP.md](./OPENAI_SETUP.md)
