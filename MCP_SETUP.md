# MCP Server Setup for Claude Code

## Quick Start (Recommended)

### GitHub Installation

The easiest way to install the mendicant MCP server is directly from GitHub:

**1. Locate your Claude Code config file:**

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**2. Add to your config:**

```json
{
  "mcpServers": {
    "mendicant": {
      "command": "npx",
      "args": [
        "-y",
        "github:zhadyz/mendicant-mcp-server"
      ]
    }
  }
}
```

**3. Restart Claude Code completely:**
- Close all windows
- Exit from system tray
- Relaunch

**4. Verify it works:**
Ask Claude Code: `Can you list your available MCP tools?`

You should see:
- `mcp__mendicant__mendicant_plan`
- `mcp__mendicant__mendicant_coordinate`
- `mcp__mendicant__mendicant_analyze`

That's it! ✅

---

## Alternative: Local Installation

If you prefer to run from a local copy:

### 1. Clone the Repository

```bash
git clone https://github.com/zhadyz/mendicant-mcp-server.git
cd mendicant-mcp-server
npm install
npm run build
```

### 2. Locate Claude Code MCP Config

### 3. Add to Config

Use the **absolute path** to your cloned repository:

```json
{
  "mcpServers": {
    "mendicant": {
      "command": "node",
      "args": [
        "/absolute/path/to/mendicant-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Windows example:**
```json
{
  "mcpServers": {
    "mendicant": {
      "command": "node",
      "args": [
        "C:/Users/YourName/projects/mendicant-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Important:** Use forward slashes `/` or double backslashes `\\` in Windows paths.

### 4. Multiple Servers Example

If you have other MCP servers already configured:

```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "uvx",
      "args": ["mnemosyne-mcp-server"]
    },
    "mendicant": {
      "command": "node",
      "args": [
        "C:\\Users\\eclip\\Desktop\\MENDICANT\\mendicant-mcp-server\\dist\\index.js"
      ]
    },
    "serena": {
      "command": "python",
      "args": ["-m", "serena_mcp_server"]
    }
  }
}
```

### 5. Restart Claude Code

After saving the config file, **completely restart Claude Code**:
1. Close all Claude Code windows
2. Exit Claude Code from system tray (if running)
3. Relaunch Claude Code

### 6. Verify Installation

In Claude Code, type:
```
Can you list your available MCP tools?
```

You should see:
- `mcp__mendicant__mendicant_plan`
- `mcp__mendicant__mendicant_coordinate`
- `mcp__mendicant__mendicant_analyze`

## Testing the Server

### Test mendicant_plan

```
Can you call mcp__mendicant__mendicant_plan with:
{
  "objective": "scaffold a new authentication system",
  "context": {
    "project_type": "nodejs"
  }
}
```

Expected output:
```json
{
  "agents": [
    {"agent_id": "the_architect", ...},
    {"agent_id": "hollowed_eyes", ...},
    {"agent_id": "loveless", ...}
  ],
  "execution_strategy": "phased",
  "success_criteria": "Authentication implemented and verified"
}
```

### Test mendicant_analyze

```
Can you call mcp__mendicant__mendicant_analyze with:
{
  "context": {
    "test_results": {
      "passed": 45,
      "failed": 3
    }
  }
}
```

Expected output:
```json
{
  "health_score": 75,
  "critical_issues": [...],
  "recommendations": [...],
  "suggested_agents": ["loveless", "hollowed_eyes"]
}
```

## Troubleshooting

### Server Not Showing Up

**Check config file syntax:**
```bash
# Use a JSON validator
python -m json.tool "%APPDATA%\Claude\claude_desktop_config.json"
```

**Common issues:**
- Missing commas between servers
- Wrong path separators (use `\\` or `/`)
- Trailing comma after last server

### Server Fails to Start

**Check Node.js is installed:**
```bash
node --version  # Should show v18 or higher
```

**Check server runs manually:**
```bash
cd C:\Users\eclip\Desktop\MENDICANT\mendicant-mcp-server
node dist/index.js
```

Should output MCP protocol initialization (will wait for stdin).

**Check for build errors:**
```bash
cd C:\Users\eclip\Desktop\MENDICANT\mendicant-mcp-server
npm run build
```

Should complete without errors.

### Tools Not Appearing

**Restart Claude Code completely:**
- Don't just close windows
- Exit from system tray
- Kill process if necessary: `taskkill /f /im Claude.exe`

**Check MCP logs:**
Claude Code may show MCP connection errors in its logs. Look for:
```
Failed to connect to MCP server: mendicant
```

### Wrong Paths in Config

**If you moved the server:**
```bash
# Find the correct path
cd C:\Users\eclip\Desktop\MENDICANT\mendicant-mcp-server
pwd  # Copy this path
```

Update `claude_desktop_config.json` with the correct path.

## Using the Commands

Once MCP server is configured, you can use the updated commands:

```bash
/autonomous          # Proactive scanning and fixing
/build [objective]   # Build with orchestration
/fix [issue]         # Fix with orchestration
/go                  # Proactive execution
/release [version]   # Release preparation
```

These commands will now use the mendicant MCP server for intelligent orchestration planning.

## Next Steps

1. ✅ Verify MCP server appears in tools
2. Test `/fix` command with a simple issue
3. Test `/build` command with a small feature
4. Try `/autonomous` mode for project scanning
5. Read [USAGE_GUIDE.md](./USAGE_GUIDE.md) for advanced usage

---

Need help? Check the [README.md](./README.md) or ask Claude Code to:
- "Show me the mendicant MCP server documentation"
- "Test the mendicant_plan tool"
- "Explain how to use the orchestration patterns"
