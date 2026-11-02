# Starts the real Stream Desk app (tauri dev) with WebView2 remote debugging (CDP) enabled,
# so tools/live-test/probe.mjs can drive it. Reuses an already-running instance.
# Bounded wait: never blocks longer than -TimeoutSec.
param(
  [int]$Port = 9222,
  [int]$TimeoutSec = 300
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$desktop = Join-Path $root "desktop"
$out = Join-Path $PSScriptRoot "out"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$log = Join-Path $out "app.log"
$pidFile = Join-Path $out "app.pid"

function Test-Cdp {
  try {
    Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/version" -TimeoutSec 2 | Out-Null
    return $true
  } catch { return $false }
}

if (Test-Cdp) {
  Write-Output "READY (reused) cdp=http://127.0.0.1:$Port"
  exit 0
}

$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=$Port"
$proc = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npm run tauri dev > `"$log`" 2>&1" `
  -WorkingDirectory $desktop -WindowStyle Hidden -PassThru
Set-Content -Path $pidFile -Value $proc.Id

$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
  if (Test-Cdp) {
    Write-Output "READY cdp=http://127.0.0.1:$Port pid=$($proc.Id) log=$log"
    # Keep this script alive while the app runs: agent harnesses kill the process tree
    # when the launching command ends. Run this script as a daemon/background task.
    $proc.WaitForExit()
    Write-Output "APP EXITED (code $($proc.ExitCode))"
    exit 0
  }
  if ($proc.HasExited) {
    Write-Output "FAILED app exited early (code $($proc.ExitCode)). Last log lines:"
    Get-Content $log -Tail 25 -ErrorAction SilentlyContinue
    exit 2
  }
  Start-Sleep -Seconds 3
}

Write-Output "TIMEOUT after ${TimeoutSec}s. Last log lines:"
Get-Content $log -Tail 25 -ErrorAction SilentlyContinue
exit 2
