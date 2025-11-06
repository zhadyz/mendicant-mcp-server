# mendicant MCP Server - Usage Guide

## Start Here: MVP Path (Recommended)

**Week 1:** Use only `mendicant_plan` with 2 patterns

```javascript
// Your workflow:
1. User: "scaffold authentication system"
2. Call: mendicant_plan("scaffold authentication system")
3. Get: Plan with [the_architect, hollowed_eyes, loveless]
4. You: Spawn agents sequentially using Task tool
5. You: Synthesize results naturally in your response
```

**Why MVP first?**
- Validates core hypothesis: Does planning intelligence improve orchestration?
- Keeps complexity low while learning usage patterns
- You (Claude) already excel at synthesis - don't outsource it yet

---

## Tool-by-Tool Usage Guide

### 1. `mendicant_plan` - USE THIS FIRST ✅

**What it does well:**
- Selects appropriate agents based on objective
- Orders agents correctly (architect before implementation, verification after)
- Matches objectives to proven patterns (SCAFFOLD, FIX_TESTS, etc.)
- Provides execution strategy (sequential vs parallel vs phased)

**What it doesn't do:**
- Understand your specific codebase context (you add that when spawning)
- Generate deeply customized prompts (uses templates)
- Know about your current project state (git status, test failures, etc.)

**When to use:**
- Every multi-agent workflow
- When you're unsure which agents to spawn
- When you need execution strategy guidance

**Example:**
```javascript
// Scenario: User asks to "fix failing tests"
const plan = await mendicant_plan("fix failing tests");

// Returns:
{
  agents: [
    { agent_id: "loveless", task: "Identify test failures", priority: "critical" },
    { agent_id: "hollowed_eyes", task: "Implement fixes", dependencies: ["loveless"] },
    { agent_id: "loveless", task: "Verify fixes", dependencies: ["hollowed_eyes"] }
  ],
  execution_strategy: "sequential",
  success_criteria: "All tests passing"
}

// You then:
Task(loveless, prompt="Investigate test failures in the test suite...")
// Wait for results
Task(hollowed_eyes, prompt="Fix the following test failures: [loveless results]...")
// Wait for results
Task(loveless, prompt="Re-run tests to verify fixes...")
```

**Limitations:**
- Prompts are generic templates - you enhance them with project context
- Doesn't know about past executions initially (bootstrap problem)
- Pattern matching is keyword-based, not semantic

---

### 2. `mendicant_analyze` - ADD WHEN USEFUL ⚠️

**What it does well:**
- Quick health score (0-100) based on structured data
- Flags critical issues from test results, build status
- Recommends agents to fix specific issues
- Lightweight and fast

**What it doesn't do:**
- Understand semantic issues ("code is messy but works")
- Read your actual codebase (needs you to provide context)
- Detect subtle problems (security vulns, performance issues)

**When to use:**
- Autonomous mode (scan project, prioritize fixes)
- Before planning (get context about current state)
- After major changes (verify project health)

**When NOT to use:**
- You're already looking at test results
- You need deep code analysis (use the_didact instead)
- You want actual fixes (this just recommends)

**Example:**
```javascript
// Autonomous mode workflow:
const analysis = await mendicant_analyze({
  test_results: { passed: 45, failed: 3, errors: ["auth.test.js", "db.test.js"] },
  build_status: "passing",
  git_status: { uncommitted_changes: 12, untracked_files: 2 }
});

// Returns:
{
  health_score: 75,
  critical_issues: [
    { type: "test_failure", file: "auth.test.js", severity: "high" },
    { type: "test_failure", file: "db.test.js", severity: "high" }
  ],
  recommendations: [
    { action: "fix_tests", agent: "loveless", priority: "critical" }
  ],
  suggested_agents: ["loveless", "hollowed_eyes"]
}

// Then:
const plan = await mendicant_plan("fix failing tests in auth.test.js and db.test.js");
// Execute plan...
```

**Limitations:**
- Only analyzes structured data you provide (can't read files itself)
- Health score is heuristic-based, not intelligent
- Recommendations are rule-based, not context-aware

---

### 3. `mendicant_coordinate` - DEFER UNTIL PROVEN NECESSARY ⚠️⚠️

**What it does well:**
- Structures multi-agent results for easier processing
- Detects obvious conflicts (keyword matching)
- Identifies missing agents (gap detection)
- Provides metadata about results

**What it CANNOT do:**
- Semantic conflict detection (can't understand "architect said Redux, hollowed_eyes used Zustand")
- True synthesis (that requires LLM intelligence - which is YOU)
- Resolve conflicts (only flags them)
- Deep content analysis

**When to use:**
- You're running 5+ agents and need structure
- You want automated gap detection
- You're building a UI that needs result metadata

**When NOT to use:**
- 1-3 agents (you synthesize naturally)
- You need actual understanding (you're better at this)
- Results are simple and clear

**Example:**
```javascript
// After running multiple agents:
const results = [
  { agent_id: "the_architect", output: "Use Redux for state...", success: true },
  { agent_id: "hollowed_eyes", output: "Implemented with Zustand...", success: true },
  { agent_id: "loveless", output: "Tests passing", success: true }
];

const coordination = await mendicant_coordinate("implement state management", results);

// Returns:
{
  synthesis: "Multiple agents completed state management tasks",
  conflicts: [
    {
      agents: ["the_architect", "hollowed_eyes"],
      issue: "Different state management solutions mentioned",
      severity: "high"
    }
  ],
  gaps: [],
  recommendations: ["Verify state management consistency"],
  verification_needed: true
}

// But you (Claude) would naturally notice this conflict when reading the results anyway!
// This tool just structures it - it doesn't add intelligence
```

**Limitations:**
- **This tool is over-engineered for MVP**
- Conflict detection is keyword-based, not semantic
- Cannot resolve conflicts, only flag them
- **You (Claude) are better at synthesis than this tool**

**Recommendation:** Skip this tool entirely until you find yourself repeatedly doing the same synthesis pattern. Then add it as a time-saver, not an intelligence augmentation.

---

## Recommended Progression

### Stage 1: MVP (This Weekend)

```javascript
// ONLY use mendicant_plan
// Patterns: SCAFFOLD, FIX_TESTS

// Example workflow:
User: "scaffold authentication for EDPT project"
  ↓
You: mendicant_plan("scaffold authentication system", { project_type: "web app" })
  ↓
MCP: Returns plan with [the_architect, hollowed_eyes, the_scribe, loveless]
  ↓
You: Task(the_architect, "Design authentication architecture...")
      Wait for result
      Task(hollowed_eyes, "Implement [architecture]...")
      Wait for result
      Task(the_scribe, "Document authentication system...")
      Wait for result
      Task(loveless, "Verify implementation and docs...")
  ↓
You: Synthesize all results naturally in your response
```

**Validate:**
- Did planning improve agent selection?
- Were execution strategies helpful?
- Did prompts need heavy customization?

### Stage 2: Add Analysis (Next Week)

```javascript
// Add mendicant_analyze for autonomous mode

// Example: Autonomous scan workflow
You: mendicant_analyze({ test_results, build_status, git_status })
  ↓
MCP: Returns health score + critical issues + recommendations
  ↓
You: mendicant_plan("fix critical issues: [issues from analysis]")
  ↓
You: Execute plan with agents
```

**Validate:**
- Does analysis save you time in autonomous mode?
- Are recommendations accurate?
- Is health score useful?

### Stage 3: Add Learning (Later)

```javascript
// Store executions in mnemosyne
// Query past successful executions in planning

// This requires:
1. Execution tracking (store plans + results)
2. mnemosyne integration working
3. Pattern library stabilized
```

### Stage 4: Consider Coordination (Only if Needed)

```javascript
// ONLY add if you find yourself:
- Repeatedly synthesizing 5+ agent results
- Manually checking for conflicts every time
- Building a UI that needs structured results

// Otherwise, skip this tool permanently
```

---

## Pattern Library Usage

### Available Patterns

1. **SCAFFOLD** - New project setup
   - Agents: the_architect → the_scribe → hollowed_eyes → loveless
   - Use when: Starting new feature, new service, new module

2. **FIX_TESTS** - Test failure resolution
   - Agents: loveless → hollowed_eyes → loveless
   - Use when: Tests failing, need debugging

3. **SECURITY_FIX** - Security vulnerability remediation
   - Agents: loveless → hollowed_eyes → loveless → the_scribe
   - Use when: Security scan found issues, CVE needs fixing

4. **DEPLOYMENT** - Deployment configuration
   - Agents: the_sentinel → zhadyz → loveless
   - Use when: Setting up CI/CD, deployment pipelines

5. **FEATURE_IMPLEMENTATION** - New feature development
   - Agents: the_didact → the_architect → hollowed_eyes → loveless → the_scribe
   - Use when: Implementing complex new functionality

6. **BUG_FIX** - Bug investigation and repair
   - Agents: the_didact → hollowed_eyes → loveless
   - Use when: Bug reported, needs investigation

### Pattern Matching Logic

Patterns match on keywords in the objective:

```javascript
// Examples that trigger patterns:
"scaffold a new authentication system"    → SCAFFOLD
"fix the failing unit tests"              → FIX_TESTS
"security vulnerability in dependencies"  → SECURITY_FIX
"set up deployment pipeline"              → DEPLOYMENT
"implement user profile feature"          → FEATURE_IMPLEMENTATION
"bug in payment processing"               → BUG_FIX

// If no pattern matches:
// Custom plan generated based on agent capabilities
```

---

## Anti-Patterns (Don't Do This)

### ❌ Calling MCP for Single-Agent Tasks

```javascript
// BAD:
mendicant_plan("run the tests")
// Returns: [loveless]
Task(loveless, "run tests")

// GOOD:
// Just spawn loveless directly - you don't need planning for single agents
Task(loveless, "run the full test suite and report failures")
```

### ❌ Using mendicant_coordinate for Simple Results

```javascript
// BAD:
Task(hollowed_eyes, "implement login form")
const result = await hollowed_eyes.result;
mendicant_coordinate("implement login form", [result])

// GOOD:
Task(hollowed_eyes, "implement login form")
// Just read the result and respond naturally
```

### ❌ Calling mendicant_analyze Without Context

```javascript
// BAD:
mendicant_analyze({}) // Empty context - returns nothing useful

// GOOD:
// Gather context first
const testResults = parseTestOutput(await bash("npm test"));
const gitStatus = parseGitStatus(await bash("git status"));
mendicant_analyze({ test_results: testResults, git_status: gitStatus })
```

### ❌ Over-relying on Pattern Matching

```javascript
// BAD:
// Blindly using pattern without understanding objective
const plan = await mendicant_plan("do something with auth");
// Might match wrong pattern

// GOOD:
// Be specific in objective
const plan = await mendicant_plan("scaffold a new authentication system with JWT tokens");
// Clear objective → correct pattern
```

---

## Integration with Commands

### Updated Command Structure

```markdown
## OLD (.claude/commands/autonomous.md)
Spawn mendicant_bias in autonomous mode.
Use Task tool with subagent_type="mendicant_bias".
❌ Broken: mendicant_bias can't spawn agents

## NEW (.claude/commands/autonomous.md)
You are Claude Code embodying **mendicant_bias orchestration patterns**.

1. Call: mendicant_analyze() to assess project health
2. Call: mendicant_plan(objective) to get strategy
3. Spawn agents: Task(hollowed_eyes), Task(loveless)
4. Synthesize results naturally (no coordination tool needed)
5. Present unified output

✅ Works: You embody mendicant_bias, MCP provides intelligence
```

---

## Success Metrics

**How to know if this is working:**

✅ **Week 1 Success:**
- `mendicant_plan` correctly identifies agents needed
- Execution strategies (sequential/parallel/phased) are helpful
- You spawn fewer wrong agents
- Multi-agent workflows feel more structured

⚠️ **Week 1 Concerns:**
- Prompts too generic (need heavy customization)
- Pattern matching misses objectives
- Planning adds overhead without value

✅ **Week 2 Success:**
- `mendicant_analyze` saves time in autonomous mode
- Health scores align with your assessment
- Recommendations are actionable

⚠️ **Week 2 Concerns:**
- Analysis misses critical issues
- Health scores don't reflect reality
- You ignore recommendations

---

## When to Simplify

**Consider removing features if:**

- `mendicant_coordinate`: You never use it after 2 weeks
- `mendicant_analyze`: Health scores are consistently wrong
- Pattern library: Patterns never match your actual workflows
- mnemosyne integration: Learning doesn't improve planning

**Simplification options:**
1. Remove unused tools from MCP server
2. Simplify pattern library (fewer patterns)
3. Make prompts more generic (less template complexity)
4. Remove mnemosyne integration if learning doesn't help

---

## Debugging Guide

### Plan Doesn't Match Objective

```javascript
// Symptom: mendicant_plan returns wrong agents
mendicant_plan("fix the login bug")
// Returns: [the_scribe] ??? Should be [hollowed_eyes, loveless]

// Debug:
1. Check pattern matching in patterns.ts
2. Verify agent_specs.ts has correct capabilities
3. Add logging to see which pattern matched
4. Make objective more specific: "debug and fix login authentication bug"
```

### Agents Spawned in Wrong Order

```javascript
// Symptom: Dependencies not respected
// Plan says: the_architect → hollowed_eyes
// But you spawned: hollowed_eyes → the_architect

// Fix:
1. Check plan.execution_strategy (sequential vs parallel)
2. If "sequential", spawn one at a time and wait
3. If "phased", respect phase order
4. Check dependencies array in AgentSpec
```

### Coordination Returns Empty Conflicts

```javascript
// Symptom: Obvious conflict but mendicant_coordinate returns []

// Explanation:
// Conflict detection is keyword-based, not semantic
// It can't understand "architect said Redux, hollowed_eyes used Zustand"

// Solution:
// Do synthesis yourself - you're better at it
// Only use coordination for structural metadata, not intelligence
```

---

## Next Steps

1. **Test MVP:** Run `mendicant_plan` with SCAFFOLD pattern on EDPT project
2. **Iterate:** Fix pattern matching issues as they arise
3. **Add analysis:** Once planning works, add `mendicant_analyze` for autonomous mode
4. **Defer coordination:** Don't use `mendicant_coordinate` until proven necessary
5. **Add learning:** Once patterns stabilize, integrate with mnemosyne

**Remember:** The MCP provides structure and pattern matching. You (Claude) provide intelligence and synthesis. Don't outsource your strengths.
