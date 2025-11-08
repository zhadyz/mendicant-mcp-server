# Bump version to 0.6.2
$packageFile = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/package.json'
$content = Get-Content $packageFile -Raw
$content = $content -replace '"version": "0\.6\.1"', '"version": "0.6.2"'
Set-Content $packageFile $content -NoNewline
Write-Host "Version bumped to 0.6.2"
