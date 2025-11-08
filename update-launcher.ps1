# Update dashboard_launcher.ts with dynamic port allocation

$launcherFile = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/events/dashboard_launcher.ts'
$content = Get-Content $launcherFile -Raw

# Add import for findAvailablePort
$content = $content -replace "(import { fileURLToPath } from 'url';)", "`$1`nimport { findAvailablePort } from '../utils/port-finder.js';"

# Add actualPort property to class
$content = $content -replace '(private config: DashboardLauncherConfig;\r?\n  private httpServer)', "private config: DashboardLauncherConfig;`n  private actualPort: number = 0;`n  private httpServer"

# Add getPort method before start method
$getPortMethod = @"
  /**
   * Get the actual port the server is listening on
   */
  getPort(): number {
    return this.actualPort;
  }

"@
$content = $content -replace '(\s+/\*\*\r?\n\s+\* Start the dashboard)', "$getPortMethod`$1"

# Add port finding logic before listen() call
$portLogic = @"

    // Find an available port
    const preferredPort = this.config.port;
    this.actualPort = await findAvailablePort(preferredPort, '127.0.0.1');
    if (this.actualPort !== preferredPort) {
      console.log(``[DashboardLauncher] Port `${preferredPort} in use, using port `${this.actualPort} instead``);
    }
"@
$content = $content -replace '(\s+// Start listening)', "$portLogic`n`$1"

# Replace this.config.port with this.actualPort in listen() call
$content = $content -replace 'this\.httpServer!\.listen\(this\.config\.port,', 'this.httpServer!.listen(this.actualPort,'

# Update log message to use actualPort
$content = $content -replace 'Dashboard HTTP server started on http://localhost:\$\{this\.config\.port\}', 'Dashboard HTTP server started on http://localhost:${this.actualPort}'

# Update getStatus() to return actualPort
$content = $content -replace '(getStatus\(\) \{[\s\S]*?port: )this\.config\.port', "`${1}this.actualPort"
$content = $content -replace '(url: `http://localhost:)\$\{this\.config\.port\}', "`${1}`${this.actualPort}"

Set-Content $launcherFile $content -NoNewline
Write-Host "Updated $launcherFile"
