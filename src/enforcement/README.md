# Delegation Enforcement V2

## Architecture

**Server-side enforcement** that blocks Claude from accumulating context and forces Task tool delegation.

### How It Works

The enforcement system tracks context usage **server-side** based on agent tool call patterns reported by MENDICANT_BIAS. When thresholds are exceeded, it returns minimal error messages forcing delegation.

### Integration Pattern

1. **MENDICANT_BIAS tracks tool calls** - Reports to enforcement system via `mendicant_track_context` tool
2. **Server-side rules evaluate** - Check against hard blocks and warnings
3. **Minimal error responses** - Return only `DELEGATION_REQUIRED: spawn {agent}`
4. **No Claude context pollution** - Enforcement rules stay server-side, never sent to Claude

### Enforcement Rules

**Hard Blocks (throw error):**
- Write/Edit file >200 lines → "DELEGATION_REQUIRED: spawn the_scribe"
- Read 3+ large files (>500 lines) in 60s → "DELEGATION_REQUIRED: spawn the_architect"
- Estimated context >25k tokens → "DELEGATION_REQUIRED: delegate current task"

**Warnings (add to response):**
- File 100-200 lines → "TIP: Consider delegating to preserve context"
- 2 large reads → "WARNING: Next read triggers delegation enforcement"
- Context 20k-25k → "WARNING: Approaching context limit (25k)"

### Usage

MENDICANT_BIAS calls these MCP tools:

```typescript
// Track a tool call that was executed
mendicant_track_context({
  tool_name: "Read",
  args: { file_path: "/path/to/file.ts" },
  response: { content: "..." }
})

// Check if next operation would be blocked
mendicant_check_delegation({
  tool_name: "Write",
  args: { content: largeContent }
})

// Reset after successful delegation
mendicant_reset_enforcement()
```

### Environment Variables

```bash
# Disable enforcement (for testing)
MENDICANT_DISABLE_DELEGATION_ENFORCEMENT=true
```

## Files

- `rules.ts` - Enforcement rules (stays server-side, never sent to Claude)
- `context-tracker.ts` - Server-side context estimation
- `delegation-enforcer.ts` - Core enforcer class
- `mcp-interceptor.ts` - MCP tool wrappers
- `index.ts` - Public API exports
