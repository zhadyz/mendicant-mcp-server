# Update index.ts to use actual ports from bridge and launcher

$indexFile = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/index.ts'
$content = Get-Content $indexFile -Raw

# Update bridge log to use actual port
$content = $content -replace "debugLog\('\[Dashboard\] SSE bridge started on port 3001'\);", "debugLog(``[Dashboard] SSE bridge started on port `${dashboardBridge.getPort()}``)"

# Update launcher log to use actual port
$content = $content -replace "debugLog\('\[Dashboard\] Next.js dashboard started on port 3000'\);", "debugLog(``[Dashboard] Next.js dashboard started on port `${dashboardLauncher.getPort()}``)"

# Update browser URL to use launcher's actual port
$content = $content -replace "const dashboardUrl = `http://localhost:\$\{process\.env\.DASHBOARD_PORT \|\| '3000'\}/realtime`;",'const dashboardUrl = ``http://localhost:${dashboardLauncher.getPort()}/realtime``;'

Set-Content $indexFile $content -NoNewline
Write-Host "Updated $indexFile"
