# Mendicant MCP Server

Orchestration intelligence for the mendicant_bias distributed agent system.

## 🚀 Start Here

**New to this server?** Read [USAGE_GUIDE.md](./USAGE_GUIDE.md) first.

**TL;DR:**
- Start with MVP: Use only `mendicant_plan` with SCAFFOLD + FIX_TESTS patterns
- You (Claude) do synthesis - don't outsource to `mendicant_coordinate` yet
- Add `mendicant_analyze` only after planning proven useful
- This server provides structure, YOU provide intelligence

## Installation

Add to your Claude Code MCP config (`claude_desktop_config.json`):

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

Restart Claude Code, then verify: `Can you list your available MCP tools?`

For detailed setup instructions, see [MCP_SETUP.md](./MCP_SETUP.md).

## What Is This?

This MCP server provides **strategic planning and coordination logic** for orchestrating Claude Code's specialized agents. It does NOT execute agents itself - instead, it provides intelligence that Claude Code consults when deciding:

- Which agents to spawn
- In what order
- With what prompts
- How to coordinate their results

## Architecture

```
User Request
    ↓
Claude Code (embodying mendicant_bias role)
    ↓
mendicant_plan(objective) → Returns orchestration plan
    ↓
Claude spawns agents via Task tool
    ↓
Task(hollowed_eyes), Task(loveless), etc. [parallel]
    ↓
mendicant_coordinate(results) → Returns synthesized output
    ↓
Present to user
```

**Key Insight:** mendicant_bias is a **framework/pattern**, not an agent. This MCP server embodies the orchestration intelligence, while Claude Code executes the plan.

## Limitations (Important!)

**What this server does well:**
- Agent selection based on capabilities
- Execution ordering (dependencies)
- Pattern matching for common workflows
- Structured planning output

**What this server CANNOT do:**
- Semantic understanding (conflict detection requires LLM intelligence - that's Claude's job)
- Deep context awareness (doesn't read your codebase)
- True synthesis (coordination tool is metadata only)
- Understand past conversation context

**Design Philosophy:**
- MCP provides **structure and pattern matching**
- Claude provides **intelligence and synthesis**
- Don't outsource your strengths to the MCP

See [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed limitations of each tool.

## Tools

### 1. `mendicant_plan`

Creates strategic orchestration plan for an objective.

**Input:**
```json
{
  "objective": "Build Next.js app with authentication",
  "context": {
    "project_type": "nextjs",
    "has_tests": false
  },
  "constraints": {
    "max_agents": 5,
    "prefer_parallel": true
  }
}
```

**Output:**
```json
{
  "agents": [
    {
      "agent_id": "the_architect",
      "task_description": "Design authentication architecture",
      "prompt": "...",
      "dependencies": [],
      "priority": "high"
    },
    {
      "agent_id": "hollowed_eyes",
      "task_description": "Implement authentication",
      "prompt": "...",
      "dependencies": ["the_architect"],
      "priority": "critical"
    },
    {
      "agent_id": "loveless",
      "task_description": "Verify security",
      "prompt": "...",
      "dependencies": ["hollowed_eyes"],
      "priority": "critical"
    }
  ],
  "execution_strategy": "phased",
  "phases": [...],
  "success_criteria": "Authentication implemented and verified",
  "estimated_tokens": 150000
}
```

### 2. `mendicant_coordinate`

Synthesizes results from multiple agents into unified output.

**Input:**
```json
{
  "objective": "Build Next.js app",
  "agent_results": [
    {
      "agent_id": "hollowed_eyes",
      "output": "Implemented Next.js scaffold...",
      "success": true,
      "duration_ms": 45000,
      "tokens_used": 50000
    },
    {
      "agent_id": "loveless",
      "output": "Verified build succeeds...",
      "success": true,
      "duration_ms": 30000,
      "tokens_used": 40000
    }
  ]
}
```

**Output:**
```json
{
  "synthesis": "## Orchestration Complete...",
  "conflicts": [],
  "gaps": [],
  "recommendations": ["All verification passed - safe to proceed"],
  "verification_needed": false
}
```

### 3. `mendicant_analyze`

Analyzes project health and provides recommendations.

**Input:**
```json
{
  "context": {
    "git_status": "modified: 3 files",
    "test_results": {
      "passed": 45,
      "failed": 3,
      "total": 48
    },
    "build_status": "success with warnings",
    "linear_issues": [...]
  }
}
```

**Output:**
```json
{
  "health_score": 75,
  "critical_issues": [
    {
      "type": "failing_tests",
      "severity": "high",
      "description": "3 tests failing",
      "suggested_fix": "Run loveless to investigate, then hollowed_eyes to fix"
    }
  ],
  "recommendations": [...],
  "suggested_agents": ["loveless", "hollowed_eyes"]
}
```

## Installation

1. Install dependencies:
```bash
cd mendicant-mcp-server
npm install
```

2. Build:
```bash
npm run build
```

3. Add to Claude Code's MCP settings:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mendicant": {
      "command": "node",
      "args": [
        "C:\\Users\\eclip\\Desktop\\MENDICANT\\mendicant-mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

4. Restart Claude Code

## Integration with Mnemosyne

This server integrates with the mnemosyne MCP server for learning:

1. **Past Executions:** Claude Code queries mnemosyne for similar past objectives
2. **Pattern Learning:** Successful patterns are reused for similar objectives
3. **Storage:** After execution, Claude stores results in mnemosyne for future learning

## Usage in Commands

Update your `.claude/commands/` files to use mendicant:

**Before (broken):**
```markdown
Spawn mendicant_bias to fix issue.
Use Task tool with subagent_type="mendicant_bias".
```

**After (correct):**
```markdown
You are Claude Code embodying mendicant_bias orchestration patterns.

1. Call: `mendicant_plan("fix failing tests")`
2. Spawn agents according to plan using Task tool
3. Call: `mendicant_coordinate(agent_results)` 
4. Present synthesis to user
```

## Common Patterns

The server includes pre-built patterns for:

- **Scaffold:** New project setup
- **Fix Tests:** Investigate and fix failing tests
- **Security Fix:** Audit and fix vulnerabilities  
- **Deployment:** Release preparation and deployment
- **Feature Implementation:** Build new features
- **Bug Fix:** Debug and fix issues

Patterns are automatically matched from objective keywords.

## Development

**Watch mode:**
```bash
npm run watch
```

**Test manually:**
```bash
node dist/index.js
```

Then send MCP protocol messages via stdin.

## License

MIT
