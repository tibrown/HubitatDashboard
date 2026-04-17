<#
.SYNOPSIS
  Set up an agent team alongside an existing project folder.

.DESCRIPTION
  Use this instead of new-project.ps1 when the codebase already exists.
  Creates a <ProjectName>-agents folder next to the existing project,
  copies the full dev team template, and stores the project path so
  agents know where the code lives.

.PARAMETER ProjectPath
  Full path to the existing project folder.
  Example: "C:\projects\gitrepo\PhotoEdit"
  Example: "C:\projects\gitrepo\AFFF PID Extraction"

.PARAMETER Launch
  If set, starts the Kanban board immediately after setup.

.EXAMPLE
  .\scripts\link-project.ps1 -ProjectPath "C:\projects\gitrepo\PhotoEdit"

.EXAMPLE
  .\scripts\link-project.ps1 -ProjectPath "C:\projects\gitrepo\AFFF PID Extraction" -Launch
#>

param(
  [Parameter(Mandatory)]
  [string]$ProjectPath,

  [switch]$Launch
)

$ErrorActionPreference = "Stop"

# ── Validate existing project ─────────────────────────────────────────────────

if (-not (Test-Path $ProjectPath)) {
  Write-Error "Project folder does not exist: $ProjectPath"
}

$ProjectName = Split-Path $ProjectPath -Leaf
$Destination = Split-Path $ProjectPath -Parent
$templateDir = Split-Path $PSScriptRoot -Parent
$targetDir   = Join-Path $Destination "$ProjectName-agents"

Write-Host ""
Write-Host "Linking agent team to: $ProjectPath"
Write-Host "Agent team folder:     $targetDir"
Write-Host ""

# ── Check if agents folder already exists ────────────────────────────────────

$isUpdate = Test-Path $targetDir

if ($isUpdate) {
  Write-Host "  [INFO] Agents folder already exists — updating template files only."
  Write-Host "         Task backlogs and memory files will NOT be cleared."
  Write-Host ""
}

# ── Copy template ─────────────────────────────────────────────────────────────

$excludeDirs = @("__pycache__", "venv", ".git", ".github")

function Copy-Template {
  param([string]$Source, [string]$Target)
  New-Item -ItemType Directory -Path $Target -Force | Out-Null
  Get-ChildItem -Path $Source | ForEach-Object {
    if ($_.PSIsContainer) {
      if ($excludeDirs -notcontains $_.Name) {
        Copy-Template -Source $_.FullName -Target (Join-Path $Target $_.Name)
      }
    } else {
      # On updates, skip data.json and memory.md to preserve existing work
      if ($isUpdate -and ($_.Name -eq "data.json" -or $_.Name -eq "memory.md")) {
        return
      }
      Copy-Item -Path $_.FullName -Destination (Join-Path $Target $_.Name) -Force
    }
  }
}

Copy-Template -Source $templateDir -Target $targetDir
Write-Host "  [OK] Template files copied"

# ── On fresh installs: clear backlogs and memory ──────────────────────────────

if (-not $isUpdate) {
  $emptyBacklog = '{"backlog": [], "archive": []}' + [System.Environment]::NewLine
  Get-ChildItem -Path "$targetDir\team" -Recurse -Filter "data.json" | ForEach-Object {
    Set-Content -Path $_.FullName -Value $emptyBacklog -Encoding UTF8
  }
  Write-Host "  [OK] Task backlogs cleared"

  Get-ChildItem -Path "$targetDir\team" -Recurse -Filter "memory.md" | ForEach-Object {
    $agentName = Split-Path (Split-Path $_.FullName -Parent) -Leaf
    $content = "# Memory - $agentName`n`n_Decisions, constraints, and context worth keeping between sessions._`n"
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
  }
  Write-Host "  [OK] Memory files reset"
}

# ── Write project.json ────────────────────────────────────────────────────────

$projectConfig = @{
  name        = $ProjectName
  projectPath = $ProjectPath
  agentsPath  = $targetDir
  created     = (Get-Date -Format "yyyy-MM-dd")
} | ConvertTo-Json -Depth 3

Set-Content -Path "$targetDir\project.json" -Value $projectConfig -Encoding UTF8
Write-Host "  [OK] project.json written (agents know where the code lives)"

# ── Update board title ────────────────────────────────────────────────────────

$htmlPath = "$targetDir\ui\index.html"
if (Test-Path $htmlPath) {
  $html = Get-Content $htmlPath -Raw -Encoding UTF8
  $html = $html -replace '<title>[^<]*</title>', "<title>$ProjectName - Dev Team Board</title>"
  $html = $html -replace '<h1>[^<]*</h1>', "<h1>$ProjectName</h1>"
  Set-Content -Path $htmlPath -Value $html -Encoding UTF8
  Write-Host "  [OK] Board title set to '$ProjectName'"
}

# ── Remove copied venv ────────────────────────────────────────────────────────

$venvPath = "$targetDir\ui\venv"
if (Test-Path $venvPath) {
  Remove-Item -Path $venvPath -Recurse -Force
}

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Agent team ready at: $targetDir"
Write-Host "Project code is at:  $ProjectPath"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open a NEW terminal and cd into your project folder:"
Write-Host "     cd `"$ProjectPath`""
Write-Host "  2. Run: copilot"
Write-Host "  3. Run: /agent  -->  select Raava"
Write-Host "  4. Describe what you want to build or change"
Write-Host ""

if ($Launch) {
  Write-Host "Launching board..."
  $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

  Set-Location "$targetDir\ui"

  if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Installing via winget..."
    winget install Python.Python.3.13 --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
  }

  if (-not (Test-Path "venv")) {
    python -m venv venv
  }

  & ".\venv\Scripts\Activate.ps1"
  pip install -r requirements.txt --quiet
  Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "server.py"
  Start-Sleep -Seconds 2
  & "$templateDir\scripts\open-board.ps1"
  Write-Host "Board running at http://localhost:8765"
} else {
  Write-Host "To start the board for this project:"
  Write-Host "  & `"$templateDir\scripts\start-dashboard.ps1`" -AgentsPath `"$targetDir`""
  Write-Host ""
}
