# V2: Delegation Enforcement

## Overview

**mendicant-mcp-server v0.7.0** introduces server-side delegation enforcement that blocks Claude from accumulating context and forces Task tool usage for large operations.

### Key Pattern

The enforcement system acts as a **circuit breaker** - silent until triggered, then hard block with minimal error messages. All enforcement rules stay server-side, never polluting Claude's context.

## New Features

### 1. Server-Side Context Tracking

The MCP server tracks estimated context usage based on tool call history:

- **Read operations**: Estimates tokens from file content
- **Write operations**: Estimates tokens from content being written  
- **Command execution**: Estimates from command + output
- **Time-windowed tracking**: 60-second windows for operation frequency

### 2. Hard Block Rules

**Automatically enforced** - throw errors:

```
Write/Edit >200 lines → "DELEGATION_REQUIRED: spawn the_scribe"
Read 3+ files >500 lines in 60s → "DELEGATION_REQUIRED: spawn the_architect"  
Context >25k tokens → "DELEGATION_REQUIRED: delegate current task"
```

### 3. Warning System

**Soft warnings** - added to responses:

```
Write 100-200 lines → "TIP: Consider delegating to preserve context"
2 large reads → "WARNING: Next read triggers delegation enforcement"
Context 20k-25k → "WARNING: Approaching context limit (25k)"
```

### 4. New MCP Tools

**For MENDICANT_BIAS orchestrator use only:**

#### `mendicant_track_context`
Track agent tool call for context estimation.

```typescript
mendicant_track_context({
  tool_name: "Read",
  args: { file_path: "/path/to/file.ts" },
  response: { content: "file contents..." }
})
```

#### `mendicant_check_delegation`
Check if next operation would trigger enforcement.

```typescript
mendicant_check_delegation({
  tool_name: "Write",
  args: { content: largeContent }
})
// Returns: { blocked: false, warning: "TIP: Consider delegating..." }
// Or throws: Error("DELEGATION_REQUIRED: spawn the_scribe")
```

#### `mendicant_reset_enforcement`
Reset session after successful delegation.

```typescript
mendicant_reset_enforcement()
// Resets context counters and operation history
```

#### `mendicant_get_enforcement_stats`
Get current enforcement stats for debugging.

```typescript
mendicant_get_enforcement_stats()
// Returns: { sessionTokens: 15432, recentReadsCount: 2, recentWritesCount: 1 }
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  MENDICANT_BIAS (Orchestrator)                          │
│  ├─ Reports tool calls → mendicant_track_context        │
│  ├─ Checks limits → mendicant_check_delegation          │
│  └─ Resets on delegation → mendicant_reset_enforcement  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  mendicant-mcp-server (Server-Side)                     │
│  ├─ ContextTracker: Estimates tokens from tool calls    │
│  ├─ DelegationEnforcer: Evaluates rules                 │
│  └─ Rules: Hard blocks + warnings (NEVER sent to Claude)│
└─────────────────────────────────────────────────────────┘
                          ↓
              DELEGATION_REQUIRED (minimal error)
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Task Tool: Spawn Specialized Agent                      │
│  ├─ the_scribe (large file operations)                  │
│  ├─ the_architect (codebase exploration)                │
│  └─ {specialized agent} (context overflow)               │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Disable enforcement (for testing/debugging)
MENDICANT_DISABLE_DELEGATION_ENFORCEMENT=true

# Default: enforcement ENABLED
```

## Implementation Files

```
src/enforcement/
├── rules.ts                 # Enforcement rules (server-side only)
├── context-tracker.ts       # Server-side context estimation
├── delegation-enforcer.ts   # Core enforcer class
├── mcp-interceptor.ts       # MCP tool wrappers
├── index.ts                 # Public API exports
└── README.md                # Architecture docs
```

## Testing

```bash
npm test -- delegation-enforcer
```

All tests passing:
- ✓ Large write block (>200 lines)
- ✓ Multiple large reads block (3+ in 60s)
- ✓ Context overflow block (>25k tokens)
- ✓ Warning system
- ✓ Session reset
- ✓ Disable enforcement

## Usage Pattern

### MENDICANT_BIAS Integration

```typescript
// After agent executes Read/Write/Edit/Bash
await mendicant_track_context({
  tool_name: "Read",
  args: { file_path: "/src/large-file.ts" },
  response: { content: fileContents }
});

// Before delegating large operation
try {
  const check = await mendicant_check_delegation({
    tool_name: "Write",
    args: { content: massiveContent }
  });
  
  if (check.warning) {
    console.log(check.warning); // Show warning to user
  }
  
  // Proceed with operation
  
} catch (error) {
  // DELEGATION_REQUIRED error
  // → Spawn specialized agent via Task tool
  await spawnAgent('the_scribe', task);
  
  // Reset enforcement session
  await mendicant_reset_enforcement();
}
```

## Anthropic Code Execution Pattern

This implementation follows the **server-side enforcement** pattern described in Anthropic's "Code Execution with MCP" blog post:

1. **MCP server tracks state** - Not Claude
2. **Rules stay server-side** - Never sent to Claude
3. **Minimal error messages** - No verbose schemas
4. **Circuit breaker pattern** - Silent until triggered

## Migration from 0.6.x

No breaking changes to existing tools. New enforcement tools are additive:

```diff
# Before (v0.6.x)
- No delegation enforcement
- Agents accumulate unlimited context

# After (v0.7.0)
+ Server-side context tracking
+ Automatic delegation on limits
+ Zero context pollution
```

## Version

**0.7.0** - Initial V2 release with delegation enforcement

### Changelog

- Added delegation enforcement system
- Added 4 new MCP tools for enforcement
- Added context tracking infrastructure
- Added comprehensive test suite
- Updated to comply with Anthropic MCP patterns

---

**Implementation**: `HOLLOWED_EYES` - Elite developer with MCP superpowers
**Pattern**: Anthropic Code Execution with MCP (server-side enforcement)
**Status**: Ready for integration testing with MENDICANT_BIAS
