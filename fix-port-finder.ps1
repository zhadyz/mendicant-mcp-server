# Fix IPv4/IPv6 port binding mismatch in port-finder.ts
$sourceFile = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/utils/port-finder.ts'
$content = Get-Content $sourceFile -Raw
$content = $content -replace 'server\.listen\(port, host\);', 'server.listen(port); // Test all interfaces'
Set-Content $sourceFile $content -NoNewline
Write-Host "Fixed port-finder.ts IPv4/IPv6 binding"
