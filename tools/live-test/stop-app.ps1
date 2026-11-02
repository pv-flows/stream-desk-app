# Stops the app started by start-app.ps1 (whole process tree: cmd -> npm -> vite/cargo -> desktop.exe).
$pidFile = Join-Path $PSScriptRoot "out\app.pid"
if (-not (Test-Path $pidFile)) {
  Write-Output "No app.pid found (app was not started by start-app.ps1)."
  exit 0
}
$appPid = Get-Content $pidFile
taskkill /T /F /PID $appPid 2>&1 | Out-Null
Remove-Item $pidFile -ErrorAction SilentlyContinue
Write-Output "STOPPED pid=$appPid"

