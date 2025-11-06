# Example: Updated Autonomous Command

This shows how to update `.claude/commands/autonomous.md` to use the mendicant MCP server.

## OLD (Broken) Version

```markdown
---
description: Activate autonomous proactive mode
---

Spawn mendicant_bias in **AUTONOMOUS PROACTIVE MODE**.

Use Task tool with subagent_type="mendicant_bias".
```

❌ **Problem:** Tries to spawn mendicant_bias as an agent, which then can't spawn other agents.

## NEW (Working) Version

```markdown
---
description: Activate autonomous proactive mode
---

You are Claude Code embodying **mendicant_bias orchestration patterns**.

## PHASE 1: Analyze Project Health

Gather context:
```bash
# Get git status
git status

# Get test results (if applicable)
npm test || pytest || cargo test

# Get build status
npm run build || make build
```

Then call:
```javascript
mendicant_analyze({
  context: {
    git_status: <git status output>,
    test_results: <parsed test results>,
    build_status: <build status>
  }
})
```

This returns:
- health_score
- critical_issues
- recommendations  
- suggested_agents

## PHASE 2: Create Orchestration Plan

For each critical issue (or user objective if provided), call:

```javascript
mendicant_plan({
  objective: "fix failing tests",  // or user's {{ARGUMENT}}
  context: {
    project_type: "nextjs",  // infer from package.json
    has_tests: true
  }
})
```

This returns:
- agents to spawn
- execution_strategy (parallel/sequential/phased)
- optimized prompts for each agent
- dependencies between agents
- success_criteria

## PHASE 3: Execute Plan

**If execution_strategy is "parallel":**
```javascript
// Spawn ALL agents in ONE response
Task(subagent_type="hollowed_eyes", prompt=<from plan>)
Task(subagent_type="loveless", prompt=<from plan>)
Task(subagent_type="the_scribe", prompt=<from plan>)
```

**If execution_strategy is "sequential":**
```javascript
// Spawn first agent, wait for completion
Task(subagent_type="the_architect", prompt=<from plan>)
// Then spawn next agent
Task(subagent_type="hollowed_eyes", prompt=<from plan>)
```

**If execution_strategy is "phased":**
```javascript
// Execute each phase
// Phase 1: spawn agents in phase, wait
// Phase 2: spawn agents in phase, wait
// Phase 3: spawn agents in phase, complete
```

## PHASE 4: Coordinate Results

After all agents complete, call:

```javascript
mendicant_coordinate({
  objective: "fix failing tests",
  agent_results: [
    {
      agent_id: "loveless",
      output: <loveless's full output>,
      success: true,
      duration_ms: 30000,
      tokens_used: 40000
    },
    {
      agent_id: "hollowed_eyes",
      output: <hollowed_eyes's full output>,
      success: true,
      duration_ms: 45000,
      tokens_used: 50000
    }
  ]
})
```

This returns:
- synthesis (unified output from all agents)
- conflicts (if any agents disagreed)
- gaps (what's missing)
- recommendations (next steps)
- verification_needed (boolean)

## PHASE 5: Present Results

Show the synthesis to the user. If verification_needed, spawn loveless to verify.

If gaps exist, ask user if they want to address them.

## PHASE 6: Store in Mnemosyne (Optional)

For learning, store execution record:

```javascript
mcp__mnemosyne__create_entities({
  entities: [{
    name: `execution_${Date.now()}`,
    entityType: 'orchestration_execution',
    observations: [
      `Objective: ${objective}`,
      `Agents: ${agents.join(', ')}`,
      `Success: ${all_success}`,
      `Duration: ${total_duration}ms`,
      `Pattern: ${pattern_name}`
    ]
  }]
})
```

---

## User Objective

User provided: {{ARGUMENT}}

Execute the protocol above for this objective.
```

✅ **Solution:** Claude embodies mendicant_bias role and spawns agents directly using MCP server for intelligence.

## Usage

```bash
# In Claude Code:
/autonomous "fix failing tests"

# Claude will:
# 1. Call mendicant_analyze to assess project health
# 2. Call mendicant_plan to get orchestration strategy
# 3. Spawn Task(loveless), Task(hollowed_eyes) in parallel
# 4. Call mendicant_coordinate to synthesize results
# 5. Present unified output to user
```

## Key Differences

| Old Approach | New Approach |
|-------------|--------------|
| Spawn mendicant_bias agent | Claude embodies mendicant_bias |
| Agent tries to spawn agents ❌ | Claude spawns agents directly ✅ |
| No intelligence/planning | MCP server provides intelligence |
| Fake coordination | Real parallel agent execution |
| No learning | Integrates with mnemosyne for learning |
