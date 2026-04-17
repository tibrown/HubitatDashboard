<#
.SYNOPSIS
  Starts the project Kanban board and opens it in the default browser.

.DESCRIPTION
  Uses the server.js already bundled in <agentsPath>\ui\ — no patching needed,
  since server.js resolves BASE_DIR from __dirname automatically.

.PARAMETER AgentsPath
  Full path to the project's agents folder (e.g. C:\projects\gitrepo\MyApp-agents).

.PARAMETER Port
  Port to run the dashboard on. Defaults to 8765.

.EXAMPLE
  .\scripts\start-dashboard.ps1 -AgentsPath "C:\projects\gitrepo\MyApp-agents"
#>

param(
  [Parameter(Mandatory)]
  [string]$AgentsPath,

  [int]$Port = 8765
)

$ErrorActionPreference = "SilentlyContinue"

$serverScript = Join-Path $AgentsPath "ui\server.js"
$url          = "http://localhost:$Port"

# ── Guard: node must be available ────────────────────────────────────────────

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Warning "Node.js not found — dashboard skipped. Install Node.js to enable it."
  return
}

if (-not (Test-Path $serverScript)) {
  Write-Warning "Dashboard server not found at: $serverScript — skipped."
  return
}

# ── Kill any process already listening on $Port ───────────────────────────────

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  $ownerPid = ($existing | Select-Object -First 1).OwningProcess
  if ($ownerPid) {
    Stop-Process -Id $ownerPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 600
    Write-Host "  [dashboard] Stopped previous process (PID $ownerPid)"
  }
}

# ── Start the server as a detached background process ────────────────────────

$env:OPEN_ZEU_PORT = "$Port"

$proc = Start-Process `
  -FilePath        "node" `
  -ArgumentList    "`"$serverScript`"" `
  -WorkingDirectory (Join-Path $AgentsPath "ui") `
  -PassThru `
  -WindowStyle     Hidden

Start-Sleep -Seconds 2

# ── Health-check ──────────────────────────────────────────────────────────────

$alive = $false
try {
  $null = Invoke-WebRequest -Uri $url -TimeoutSec 4 -UseBasicParsing
  $alive = $true
} catch { }

if ($alive) {
  Write-Host "  [dashboard] Running at $url  (PID $($proc.Id))"
} else {
  Write-Host "  [dashboard] Starting at $url  (PID $($proc.Id)) — may still be warming up"
}

# ── Open in app-mode browser (PWA-like, no address bar) ─────────────────────

$chromePaths = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)
$edgePaths = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
)

$browser = $null
foreach ($p in ($chromePaths + $edgePaths)) {
  if (Test-Path $p) { $browser = $p; break }
}

if ($browser) {
  $appArgs = @("--app=$url", "--window-size=1440,900", "--no-default-browser-check", "--disable-extensions")
  Start-Process -FilePath $browser -ArgumentList $appArgs
  Write-Host "  [dashboard] App window opened → $url"
} else {
  Start-Process $url
  Write-Host "  [dashboard] Browser opened → $url  (install Chrome or Edge for app-mode)"
}
