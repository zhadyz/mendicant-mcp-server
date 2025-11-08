# Update dashboard_bridge.ts with dynamic port allocation

$bridgeFile = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/events/dashboard_bridge.ts'
$content = Get-Content $bridgeFile -Raw

# Add import for findAvailablePort
$content = $content -replace "(import { orchestrationEvents, OrchestrationEventType } from './event_emitter.js';)", "`$1`nimport { findAvailablePort } from '../utils/port-finder.js';"

# Add actualPort property
$content = $content -replace '(private config: DashboardBridgeConfig;\r?\n  private sseClients)', "private config: DashboardBridgeConfig;`n  private actualPort: number = 0;`n  private sseClients"

# Add getPort method
$getPortMethod = @"
  /**
   * Get the actual port the server is listening on
   */
  getPort(): number {
    return this.actualPort;
  }

"@
$content = $content -replace '(\s+/\*\*\r?\n\s+\* Start the bridge server)', "$getPortMethod`$1"

# Add port finding logic at start of start() method
$portLogic = @"
    const preferredPort = this.config.port;
    this.actualPort = await findAvailablePort(preferredPort, this.config.host);
    if (this.actualPort !== preferredPort) {
      console.log(``[DashboardBridge] Port `${preferredPort} in use, using port `${this.actualPort} instead``);
    }
"@
$content = $content -replace '(async start\(\): Promise<void> \{\r?\n\s+return new Promise)', "async start(): Promise<void> {`n$portLogic`n    return new Promise"

# Replace this.config.port with this.actualPort in listen() call
$content = $content -replace 'this\.server\.listen\(this\.config\.port,', 'this.server.listen(this.actualPort,'

# Update log message to use actualPort
$content = $content -replace 'Listening on http://\$\{this\.config\.host\}:\$\{this\.config\.port\}', 'Listening on http://${this.config.host}:${this.actualPort}'

# Fix environment variable name
$content = $content -replace "process\.env\.DASHBOARD_PORT \|\| '3001'", "process.env.DASHBOARD_BRIDGE_PORT || '3001'"

Set-Content $bridgeFile $content -NoNewline
Write-Host "Updated $bridgeFile"
