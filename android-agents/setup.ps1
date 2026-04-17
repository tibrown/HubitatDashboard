# Raava Agent Team -- One-Time Setup
# Run from the repo root:
#   .\setup.cmd                                               (recommended — no policy needed)
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1     (direct PowerShell invocation)
# Re-run at any time to pull the latest changes and reinstall the agent.

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Raava Agent Team Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# -- Pull latest changes -- prefer 'internal' remote if it exists, else 'origin' --
Write-Host "Checking for updates..." -ForegroundColor Cyan
try {
  $remotes = git -C $PSScriptRoot remote 2>&1
  $pullRemote = if ($remotes -contains "internal") { "internal" } else { "origin" }
  $gitStatus = git -C $PSScriptRoot pull $pullRemote main 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host $gitStatus -ForegroundColor DarkGray
  } else {
    Write-Host "git pull skipped: $($gitStatus | Select-Object -Last 1)" -ForegroundColor Yellow
  }
} catch {
  Write-Host "git pull skipped (offline or no remote configured)." -ForegroundColor Yellow
}

# -- Set AGENT_TEAM_PATH so Raava can find the template from any project folder --
[System.Environment]::SetEnvironmentVariable("AGENT_TEAM_PATH", $PSScriptRoot, "User")
$env:AGENT_TEAM_PATH = $PSScriptRoot
Write-Host "[OK] AGENT_TEAM_PATH set to: $PSScriptRoot" -ForegroundColor Green

# -- Install Raava as a global Copilot CLI agent --
$agentSrc  = Join-Path $PSScriptRoot ".github\agents\raava.agent.md"
$agentDest = Join-Path $HOME ".copilot\agents\raava.agent.md"

if (Test-Path $agentSrc) {
  $agentsDir = Join-Path $HOME ".copilot\agents"
  if (-not (Test-Path $agentsDir)) {
    New-Item -ItemType Directory -Force $agentsDir | Out-Null
  }
  Copy-Item $agentSrc $agentDest -Force
  Write-Host "[OK] Raava agent installed globally" -ForegroundColor Green
} else {
  Write-Warning "Agent file not found at $agentSrc -- skipping agent install."
}

# -- Ensure Python is available --
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "Python not found. Installing via winget..." -ForegroundColor Yellow
  winget install Python.Python.3.13 --silent --accept-package-agreements --accept-source-agreements
  $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
  if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python install failed. Please install Python manually from https://python.org and re-run this script."
    exit 1
  }
  Write-Host "[OK] Python installed" -ForegroundColor Green
} else {
  Write-Host "[OK] Python found: $((Get-Command python).Source)" -ForegroundColor Green
}

# -- Pre-install board dependencies so the board starts instantly when Raava needs it --
$uiDir = Join-Path $PSScriptRoot "ui"
Push-Location $uiDir

if (-not (Test-Path "venv")) {
  Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
  python -m venv venv
}

Write-Host "Installing board dependencies..." -ForegroundColor Cyan
& ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet
Write-Host "[OK] Board dependencies ready" -ForegroundColor Green

Pop-Location

# -- Done --
Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Open a NEW terminal (so AGENT_TEAM_PATH is picked up)" -ForegroundColor White
Write-Host "  2. cd into your project folder (new or existing)" -ForegroundColor White
Write-Host "  3. Run: copilot" -ForegroundColor Yellow
Write-Host "  4. Run: /agent  -->  select Raava" -ForegroundColor Yellow
Write-Host "  5." -ForegroundColor Yellow -NoNewline; Write-Host " RECOMMENDED" -ForegroundColor Red -NoNewline; Write-Host "  Run: /yolo to allow all permissions before prompting. Unlike" -ForegroundColor Yellow -NoNewline; Write-Host " autopilot" -ForegroundColor Green -NoNewline; Write-Host ", this will still prompt user with questions." -ForegroundColor Yellow 
Write-Host "  6. Describe what you want to build" -ForegroundColor Yellow -NoNewline; Write-Host " OR" -ForegroundColor Red -NoNewline; Write-Host " reference a " -ForegroundColor Yellow -NoNewline; Write-Host "plan.md" -ForegroundColor Blue -NoNewline; Write-Host " file in your project folder" -ForegroundColor Yellow
Write-Host ""
