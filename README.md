# Mendicant MCP Server

Advanced adaptive intelligence for Claude Code's distributed agent ecosystem, featuring genuine probabilistic reasoning and closed-loop learning.

## Overview

Mendicant MCP Server provides strategic planning, real-time adaptive execution, and comprehensive learning capabilities for orchestrating Claude Code's specialized agents. The server implements the mendicant_bias orchestration pattern with **8 advanced intelligence systems** enabling genuine adaptive AI behavior.

**Core Capabilities:**
- Strategic agent selection with Bayesian inference
- Real-time adaptive execution with mid-execution plan modification
- Temporal knowledge decay with domain-specific half-lives
- Multi-objective Pareto optimization (accuracy/cost/latency)
- Predictive conflict detection and automatic resolution
- Semantic understanding of objectives (multi-label classification)
- Comprehensive closed-loop learning across all systems
- Agent communication and coordination infrastructure

## Version History

### v0.2.0 - Advanced Adaptive Intelligence (2025-01-05)
**Commit:** `fdbb15c` - feat: Implement advanced adaptive intelligence systems

**Architectural Transformation:**
- Evolved from rule-based orchestration to genuine adaptive AI
- Implemented 8 new intelligence systems (4,657 lines added)
- Integrated Bayesian probabilistic reasoning throughout
- Enabled real-time plan adaptation during execution
- Established comprehensive closed-loop learning

**New Intelligence Systems:**

1. **Bayesian Confidence Engine** (`bayesian_confidence.ts`)
   - Probabilistic inference with prior/likelihood/posterior calculation
   - Isotonic regression calibration with Brier score tracking
   - 95% confidence intervals using z-score = 1.96
   - Adaptive prior learning from execution outcomes

2. **Temporal Decay Engine** (`temporal_decay.ts`)
   - Domain-specific knowledge half-lives:
     - React/Frameworks: 45 days
     - APIs: 120 days
     - Databases: 270 days
     - Algorithms: 550 days
     - Fundamentals: 730 days
   - Exponential decay: `relevance(t) = score × exp(-λt)` where `λ = ln(2)/half_life`
   - Automatic staleness filtering for pattern matching

3. **Feedback Loop System** (`feedback_loop.ts`)
   - Comprehensive closed-loop learning after every execution
   - Updates all intelligence systems based on outcomes
   - Tracks 5 learning metrics:
     - Calibration quality (Brier score)
     - Semantic accuracy
     - Agent prediction accuracy
     - Conflict prediction accuracy
     - Temporal knowledge freshness
   - Automatic Bayesian prior updates

4. **Adaptive Executor** (`adaptive_executor.ts`)
   - Real-time plan modification during execution
   - 5 recovery strategies:
     - Retry (transient failures)
     - Substitute (swap failed agent)
     - Skip (non-critical agent)
     - Alternative path (different approach)
     - Rollback (undo and restart)
   - 5 execution states: running, recovering, adapting, failed, completed
   - Mahoraga-style adaptation with continuous replanning

5. **Pareto Optimizer** (`pareto_optimizer.ts`)
   - Multi-objective optimization balancing:
     - Prediction accuracy
     - Token cost
     - Execution latency
   - Finds non-dominated solutions on Pareto frontier
   - Weighted objective function: `w₁×accuracy + w₂×(1-cost) + w₃×(1-latency)`

6. **Predictive Conflict Detector** (`predictive_conflict_detector.ts`)
   - 4 conflict types:
     - Resource contention
     - Semantic contradiction
     - Ordering dependency
     - Capability overlap
   - Automatic resolution recommendations (reorder, remove, modify)
   - Confidence scoring per prediction
   - Historical conflict pattern learning

7. **Semantic Embedder** (`semantic_embedder.ts`)
   - Multi-label classification for objectives
   - 12 intent categories: implementation, refactoring, testing, documentation, debugging, optimization, research, deployment, security, migration, monitoring, maintenance
   - 15 domain categories: frontend, backend, database, devops, api, testing, security, documentation, infrastructure, performance, ui_ux, data, ml, mobile, desktop
   - Cosine similarity for pattern matching
   - TF-IDF weighting for keyword importance

8. **Agent Communication Bus** (`agent_communication_bus.ts`)
   - Multi-agent coordination infrastructure
   - 6 message types: info, request, response, coordination, error, completion
   - 4 priority levels: low, normal, high, urgent
   - Request/response pattern with timeout handling
   - Message history and conversation threading

**Core System Enhancements:**

- **planner.ts** - Integrated all 7 intelligence systems
  - Semantic analysis for objective understanding
  - Bayesian + Pareto for low-confidence scenarios
  - Temporal filtering for stale patterns
  - Predictive conflict detection with auto-resolution

- **executor.ts** - Real-time adaptive execution
  - Adaptive execution loop with state machine
  - Automatic recovery from agent failures
  - Safety limits to prevent infinite loops
  - Continuous plan optimization during execution

- **coordinator.ts** - Closed-loop learning
  - `recordExecutionWithFeedbackLoop()` updates all systems
  - Comprehensive feedback collection
  - Dual-layer memory: Mahoraga (RAM) + Mnemosyne (persistent)
  - Performance metrics tracking and logging

- **mahoraga.ts** - Enhanced with advanced intelligence
  - Bayesian inference in `calculatePredictiveScore()`
  - Temporal decay filtering for pattern relevance
  - Multi-objective `refinePlan()` with Pareto optimization
  - `generateAlternativePlans()` for plan variations
  - Async-compatible API

**Impact:**
- Before: Rule-based orchestration with simple heuristics
- After: Advanced adaptive AI with genuine probabilistic reasoning
- Learning: Every execution improves future predictions
- Adaptation: Plans modify in real-time based on agent performance

### v0.1.1 - Initial Release (2025-01-04)
**Commit:** `99154f2` - Initial Mahoraga implementation

**Core Features:**
- Basic orchestration planning with pattern matching
- Agent registry with performance tracking
- Simple Mahoraga adaptive learning system
- Failure analysis and plan refinement
- Project health assessment
- Built-in workflow patterns (SCAFFOLD, FIX_TESTS, etc.)

## Installation

### NPX (Recommended)

Add to your Claude Code MCP configuration:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mendicant": {
      "command": "npx",
      "args": ["-y", "github:zhadyz/mendicant-mcp-server"]
    }
  }
}
```

Restart Claude Code, then verify:
```
Can you list your available MCP tools?
```

### Local Development

```bash
git clone https://github.com/zhadyz/mendicant-mcp-server.git
cd mendicant-mcp-server
npm install
npm run build
```

Add to MCP configuration:

```json
{
  "mcpServers": {
    "mendicant": {
      "command": "node",
      "args": ["<absolute-path>/mendicant-mcp-server/dist/index.js"]
    }
  }
}
```

## Architecture

```
User Request
    ↓
Claude Code (embodying mendicant_bias orchestration pattern)
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ mendicant_plan(objective, context)                              │
│   ├─ Semantic Embedder: Multi-label classification             │
│   ├─ Temporal Decay: Filter stale patterns                     │
│   ├─ Bayesian Engine: Calculate confidence intervals           │
│   ├─ Conflict Detector: Predict and resolve conflicts          │
│   ├─ Pareto Optimizer: Multi-objective optimization            │
│   └─ Output: Strategic orchestration plan                      │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Adaptive Executor: Real-time plan modification                 │
│   ├─ Execute agent via Task tool                               │
│   ├─ Monitor execution state (running/recovering/adapting)     │
│   ├─ Apply recovery strategies if needed                       │
│   └─ Continuous replanning based on results                    │
└─────────────────────────────────────────────────────────────────┘
    ↓
Task(hollowed_eyes), Task(loveless), Task(the_architect), etc.
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ mendicant_coordinate(results, plan, context)                   │
│   ├─ Synthesize agent outputs                                  │
│   ├─ Detect conflicts and gaps                                 │
│   └─ Generate recommendations                                  │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Feedback Loop: Comprehensive closed-loop learning              │
│   ├─ Update Bayesian priors from outcomes                      │
│   ├─ Calibrate semantic embeddings                             │
│   ├─ Update agent prediction models                            │
│   ├─ Learn conflict patterns                                   │
│   ├─ Apply temporal decay to knowledge                         │
│   └─ Record to Mahoraga (RAM) + Mnemosyne (persistent)        │
└─────────────────────────────────────────────────────────────────┘
    ↓
Present unified output to user
```

### Design Philosophy

**Separation of Concerns:**
- **MCP Server:** Probabilistic reasoning, adaptive execution, multi-objective optimization, temporal awareness, predictive conflict detection
- **Claude Code:** Semantic understanding, synthesis, context awareness, final execution decisions

**Key Principle:** This server provides *adaptive intelligence* through Bayesian inference, temporal decay, and closed-loop learning. Claude Code remains the orchestrator with semantic understanding; the server provides strategic guidance with probabilistic confidence.

**Adaptive Intelligence:**
- Every execution improves future predictions (Bayesian priors)
- Knowledge ages with domain-specific half-lives (temporal decay)
- Plans adapt in real-time during execution (adaptive executor)
- Multiple objectives balanced automatically (Pareto optimization)
- Conflicts predicted and resolved proactively (conflict detector)

## Tools Reference

### Planning & Coordination

#### `mendicant_plan`
Creates strategic orchestration plan from objective.

**Input:**
```typescript
{
  objective: string;              // User's goal
  context?: {
    project_type?: string;        // "nextjs", "python", "rust"
    has_tests?: boolean;
    linear_issues?: any[];
    recent_errors?: any[];
  };
  constraints?: {
    max_agents?: number;
    prefer_parallel?: boolean;
    max_tokens?: number;
  };
  past_executions?: any[];        // From mnemosyne integration
}
```

**Output:**
```typescript
{
  agents: AgentSpec[];            // Ordered agent list
  execution_strategy: string;     // "sequential" | "parallel" | "phased"
  phases?: Phase[];               // If phased execution
  success_criteria: string;
  estimated_tokens: number;
  pattern_matched?: string;       // Which pattern was used
}
```

#### `mendicant_coordinate`
Synthesizes results from multiple agents. Provides structured output and basic conflict detection.

**Input:**
```typescript
{
  objective: string;
  agent_results: AgentResult[];
  plan?: object;                  // Original plan for Mahoraga learning
  project_context?: object;       // For Mahoraga learning
}
```

**Output:**
```typescript
{
  synthesis: string;              // Structured summary
  conflicts: Conflict[];          // Detected conflicts
  gaps: string[];                 // Missing coverage
  recommendations: string[];
  verification_needed: boolean;
}
```

#### `mendicant_analyze`
Analyzes project health and recommends actions.

**Input:**
```typescript
{
  context: {
    git_status?: string;
    test_results?: object;
    build_status?: string;
    linear_issues?: any[];
    recent_commits?: any[];
    recent_errors?: any[];
  }
}
```

**Output:**
```typescript
{
  health_score: number;           // 0-100
  critical_issues: Issue[];
  recommendations: Recommendation[];
  suggested_agents: string[];
}
```

### Adaptive Learning (Mahoraga System)

#### `mendicant_record_feedback`
Records agent execution feedback for passive learning.

**Input:**
```typescript
{
  agent_id: string;
  success: boolean;
  tokens_used?: number;
  duration_ms?: number;
  error?: string;
}
```

#### `mendicant_discover_agents`
Registers new agents at runtime.

**Input:**
```typescript
{
  agent_ids: string[];
}
```

#### `mendicant_list_learned_agents`
Lists all agents with performance statistics.

**Input:**
```typescript
{
  ranked?: boolean;               // Sort by success rate
}
```

#### `mendicant_predict_agents`
Predicts agent success rates for an objective based on historical patterns.

**Input:**
```typescript
{
  agent_ids: string[];
  objective: string;
  context?: object;
}
```

**Output:**
```typescript
{
  predictions: {
    agent_id: string;
    predicted_success_rate: number;
    confidence: number;
    similar_executions: number;
  }[];
}
```

#### `mendicant_analyze_failure`
Analyzes why an agent failed using historical context.

**Input:**
```typescript
{
  objective: string;
  failed_agent_id: string;
  error: string;
  preceding_agents: string[];
  context?: object;
}
```

**Output:**
```typescript
{
  failure_patterns: Pattern[];
  root_cause_hypothesis: string;
  avoidance_rules: string[];
  suggested_fixes: string[];
  alternative_agents: string[];
}
```

#### `mendicant_refine_plan`
Refines a failed plan using Mahoraga pattern analysis.

**Input:**
```typescript
{
  original_plan: object;
  failure_context: object;        // From analyze_failure
  objective: string;
  project_context?: object;
}
```

**Output:**
```typescript
{
  refined_plan: object;
  changes_made: Change[];
  reasoning: string;
  confidence: number;
}
```

#### `mendicant_find_patterns`
Finds similar successful execution patterns.

**Input:**
```typescript
{
  objective: string;
  context?: object;
  limit?: number;                 // Default: 10
}
```

**Output:**
```typescript
{
  patterns: {
    objective: string;
    agents_used: string[];
    similarity_score: number;
    success_rate: number;
  }[];
}
```

## Built-in Patterns

The server includes pre-configured patterns for common workflows:

| Pattern | Trigger Keywords | Agent Sequence | Use Case |
|---------|-----------------|----------------|----------|
| **SCAFFOLD** | scaffold, setup, initialize | architect → scribe → hollowed_eyes → loveless | New project/feature setup |
| **FIX_TESTS** | test, failing, debug | loveless → hollowed_eyes → loveless | Test failure resolution |
| **SECURITY_FIX** | security, vulnerability, CVE | loveless → hollowed_eyes → loveless → scribe | Security remediation |
| **DEPLOYMENT** | deploy, release, CI/CD | sentinel → zhadyz → loveless | Deployment configuration |
| **FEATURE_IMPLEMENTATION** | implement, feature, build | didact → architect → hollowed_eyes → loveless → scribe | Complex feature development |
| **BUG_FIX** | bug, issue, error | didact → hollowed_eyes → loveless | Bug investigation and repair |

## Usage Examples

### Basic Planning
```typescript
// Claude Code workflow
const plan = await mendicant_plan("scaffold authentication system", {
  project_type: "nextjs",
  has_tests: false
});

// Execute agents according to plan
for (const agent of plan.agents) {
  await Task(agent.agent_id, agent.prompt);
}
```

### Adaptive Learning
```typescript
// Record execution feedback
await mendicant_record_feedback({
  agent_id: "hollowed_eyes",
  success: true,
  tokens_used: 45000,
  duration_ms: 30000
});

// Query predictions before next execution
const predictions = await mendicant_predict_agents(
  ["hollowed_eyes", "loveless"],
  "implement authentication",
  { project_type: "nextjs" }
);
```

### Failure Recovery
```typescript
// Agent failed - analyze why
const analysis = await mendicant_analyze_failure(
  "fix failing tests",
  "hollowed_eyes",
  "Import resolution error in test file",
  ["loveless"]
);

// Refine the plan
const refinement = await mendicant_refine_plan(
  original_plan,
  analysis,
  "fix failing tests"
);

// Execute refined plan
```

## Integration with Command System

Update `.claude/commands/` files to leverage mendicant:

```markdown
# .claude/commands/autonomous.md

You are Claude Code embodying the **mendicant_bias orchestration pattern**.

**Workflow:**

1. Assess project health:
   ```
   mendicant_analyze({ test_results, git_status, build_status })
   ```

2. Plan intervention:
   ```
   mendicant_plan(objective_from_analysis)
   ```

3. Execute plan using Task tool for each agent

4. Record feedback for learning:
   ```
   mendicant_record_feedback({ agent_id, success, tokens_used })
   ```

5. Synthesize and present results
```

## Mnemosyne Integration

For persistent learning across sessions, integrate with mnemosyne MCP:

1. Store execution history in mnemosyne knowledge graph
2. Pass `past_executions` parameter to `mendicant_plan`
3. Query similar patterns via `mendicant_find_patterns`
4. Build institutional memory of successful patterns

## Capabilities & Limitations

**What the server provides (v0.2.0):**
- ✅ Probabilistic agent selection with Bayesian inference
- ✅ Real-time adaptive execution with automatic recovery
- ✅ Temporal knowledge decay with domain-specific half-lives
- ✅ Multi-objective optimization (accuracy/cost/latency)
- ✅ Predictive conflict detection with automatic resolution
- ✅ Semantic objective classification (multi-label)
- ✅ Comprehensive closed-loop learning across all systems
- ✅ Pattern-based workflow templates with confidence scoring
- ✅ Agent communication and coordination infrastructure
- ✅ Execution ordering and dependency management
- ✅ Structured planning and coordination output

**What the server cannot do:**
- Deep semantic understanding (requires LLM intelligence - provided by Claude Code)
- Codebase-specific analysis (context must be provided)
- Code synthesis (coordination provides structure, not implementation)
- Direct file system operations (Claude Code handles this)

**Design rationale:** Adaptive probabilistic intelligence in the MCP; semantic understanding and execution in Claude Code.

**Comparison:**

| Capability | v0.1.1 | v0.2.0 |
|-----------|--------|--------|
| Planning | Rule-based | Bayesian + Pareto |
| Execution | Static | Real-time adaptive |
| Learning | Simple statistics | Closed-loop + temporal |
| Confidence | Heuristic | Probabilistic (95% CI) |
| Conflicts | Post-detection | Predictive + resolution |
| Knowledge | No decay | Domain-specific decay |
| Optimization | Single objective | Multi-objective (Pareto) |

## Development

**Build:**
```bash
npm run build
```

**Watch mode:**
```bash
npm run watch
```

**Manual testing:**
```bash
npm start
# Send MCP protocol messages via stdin
```

**Debug logging:**
Check `%TEMP%\mendicant-debug.log` (Windows) or `/tmp/mendicant-debug.log` (Unix)

## Technical Details

**Version:** 0.1.1
**Dependencies:**
- `@modelcontextprotocol/sdk` ^1.0.4
- TypeScript ^5.7.2

**Agent Registry:** Dynamic learning system that tracks agent performance and capabilities

**Mahoraga System:** Adaptive intelligence layer that learns from execution patterns, predicts outcomes, and refines strategies. The name speaks for itself. 

## License

MIT License - See LICENSE file for details

## Repository

**GitHub:** https://github.com/zhadyz/mendicant-mcp-server
**Issues:** https://github.com/zhadyz/mendicant-mcp-server/issues
**Mnemosyne** https://github.com/zhadyz/mnemosyne-mcp
**Author:** zhadyz

---

**For detailed usage guidance, see [USAGE_GUIDE.md](./USAGE_GUIDE.md)**
