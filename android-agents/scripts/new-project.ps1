<#
.SYNOPSIS
  Bootstrap a new dev team agent system for a new project.

.DESCRIPTION
  Copies this Agent-Team template to a new directory, clears all task backlogs,
  and sets the project name in key files. Run once per project.

.PARAMETER ProjectName
  Short name for the project. Used in folder names and board header.
  Example: "my-app", "acme-api", "checkout-redesign"

.PARAMETER Destination
  Where to create the new project folder. Defaults to the parent of this repo.
  The script will create: <Destination>\<ProjectName>-agents\

.PARAMETER Launch
  If set, starts the Kanban board immediately after setup.

.EXAMPLE
  .\scripts\new-project.ps1 -ProjectName "my-app"

.EXAMPLE
  .\scripts\new-project.ps1 -ProjectName "acme-api" -Destination "C:\projects" -Launch
#>

param(
  [Parameter(Mandatory)]
  [string]$ProjectName,

  [string]$Destination = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),

  [switch]$Launch
)

$ErrorActionPreference = "Stop"

$templateDir = Split-Path $PSScriptRoot -Parent
$targetDir   = Join-Path $Destination "$ProjectName-agents"

# ── Guard ────────────────────────────────────────────────────────────────────

if (Test-Path $targetDir) {
  Write-Error "Directory already exists: $targetDir`nChoose a different project name or destination."
}

# ── Copy template ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Creating project: $ProjectName"
Write-Host "Destination:      $targetDir"
Write-Host ""

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
      Copy-Item -Path $_.FullName -Destination (Join-Path $Target $_.Name) -Force
    }
  }
}

Copy-Template -Source $templateDir -Target $targetDir
Write-Host "  [OK] Files copied"

# ── Clear all task backlogs ───────────────────────────────────────────────────

$emptyBacklog = '{"backlog": [], "archive": []}' + [System.Environment]::NewLine

Get-ChildItem -Path "$targetDir\team" -Recurse -Filter "data.json" | ForEach-Object {
  Set-Content -Path $_.FullName -Value $emptyBacklog -Encoding UTF8
}
Write-Host "  [OK] Task backlogs cleared"

# ── Clear memory files ────────────────────────────────────────────────────────

Get-ChildItem -Path "$targetDir\team" -Recurse -Filter "memory.md" | ForEach-Object {
  $agentName = Split-Path (Split-Path $_.FullName -Parent) -Leaf
  $content = "# Memory - $agentName`n`n_Decisions, constraints, and context worth keeping between sessions._`n"
  Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}
Write-Host "  [OK] Memory files reset"

# ── Update board title in index.html ─────────────────────────────────────────

$htmlPath = "$targetDir\ui\index.html"
$html = Get-Content $htmlPath -Raw -Encoding UTF8
$html = $html -replace '<title>Dev Team Board</title>', "<title>$ProjectName - Dev Team Board</title>"
$html = $html -replace '<h1>Dev Team Board</h1>', "<h1>$ProjectName</h1>"
Set-Content -Path $htmlPath -Value $html -Encoding UTF8
Write-Host "  [OK] Board title set to '$ProjectName'"

# ── Write project.json ────────────────────────────────────────────────────────

$projectConfig = @{
  name        = $ProjectName
  projectPath = Join-Path $Destination $ProjectName
  agentsPath  = $targetDir
  created     = (Get-Date -Format "yyyy-MM-dd")
} | ConvertTo-Json -Depth 3

Set-Content -Path "$targetDir\project.json" -Value $projectConfig -Encoding UTF8
Write-Host "  [OK] project.json written"

# ── Remove this scripts folder from the copy (optional: keep it) ─────────────
# Kept intentionally so the new project can also bootstrap sub-projects.

# ── Remove the venv if it was copied (shouldn't be, but just in case) ─────────

$venvPath = "$targetDir\ui\venv"
if (Test-Path $venvPath) {
  Remove-Item -Path $venvPath -Recurse -Force
  Write-Host "  [OK] Removed copied venv (will be recreated on first run)"
}

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Project ready at: $targetDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open a NEW terminal and cd into your project folder:"
Write-Host "     cd `"$(Join-Path $Destination $ProjectName)`""
Write-Host "  2. Run: copilot"
Write-Host "  3. Run: /agent  -->  select Raava"
Write-Host "  4. Describe what you want to build"
Write-Host ""

if ($Launch) {
  Write-Host "Launching board..."
  Set-Location "$targetDir\ui"

  if (-not (Test-Path "venv")) {
    python -m venv venv
  }

  & ".\venv\Scripts\Activate.ps1"
  pip install -r requirements.txt --quiet
  Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "server.py"
  Start-Sleep -Seconds 2
  & "$templateDir\scripts\open-board.ps1"
  Write-Host "Board running at http://localhost:8765"
}else {
  Write-Host "To start the board for this project:"
  Write-Host "  cd `"$targetDir`""
  Write-Host "  & `"$templateDir\scripts\start-dashboard.ps1`" -AgentsPath `"$targetDir`""
  Write-Host ""
}
