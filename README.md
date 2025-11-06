# Mendicant MCP Server

Strategic orchestration intelligence for Claude Code's distributed agent ecosystem, featuring adaptive learning through pattern recognition.

## Overview

Mendicant MCP Server provides planning, coordination, and adaptive learning capabilities for orchestrating Claude Code's specialized agents. The server implements the mendicant_bias orchestration pattern, enabling intelligent multi-agent workflows with continuous improvement through execution feedback.

**Core Capabilities:**
- Strategic agent selection and execution planning
- Adaptive learning from execution history (Mahoraga system)
- Failure analysis and plan refinement
- Project health assessment and recommendations
- Result coordination and synthesis support

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
mendicant_plan(objective, context) → Strategic orchestration plan
    ↓
Claude spawns agents via Task tool (parallel/sequential/phased)
    ↓
Task(hollowed_eyes), Task(loveless), Task(the_architect), etc.
    ↓
[Optional] mendicant_coordinate(results) → Structured synthesis
    ↓
[Feedback Loop] mendicant_record_feedback() → Mahoraga learning
    ↓
Present unified output to user
```

### Design Philosophy

**Separation of Concerns:**
- **MCP Server:** Pattern matching, agent selection, execution strategy, learning from history
- **Claude Code:** Semantic understanding, synthesis, context awareness, execution

**Key Principle:** This server provides *structural intelligence*, not *semantic understanding*. Claude Code remains the orchestrator; the server provides strategic guidance.

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

## Limitations

**What the server provides:**
- Agent capability matching
- Execution ordering and dependency management
- Pattern-based workflow templates
- Statistical learning from execution history
- Structured planning and coordination output

**What the server cannot do:**
- Semantic conflict detection (requires LLM intelligence)
- Codebase-specific understanding (context must be provided)
- True synthesis (coordination provides structure, not understanding)
- Real-time context awareness (operates on provided data)

**Design rationale:** Structural intelligence in the MCP; semantic intelligence in Claude Code.

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
