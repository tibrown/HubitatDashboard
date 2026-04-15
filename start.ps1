# start.ps1 — Start HubitatDashboard backend and frontend

$root = $PSScriptRoot

Write-Host ""
Write-Host "  Starting Hubitat Dashboard..." -ForegroundColor Cyan

# Check if already running
$inUse = @()
foreach ($port in @(3001, 5173)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        $inUse += $port
    }
}
if ($inUse.Count -gt 0) {
    Write-Host "  WARNING: Port(s) $($inUse -join ', ') already in use. Run stop.ps1 first." -ForegroundColor Yellow
    exit 1
}

# Start backend in a new window
$backend = Start-Process powershell `
    -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$root'; npm run dev --workspace=backend" `
    -PassThru

# Brief pause so backend window opens cleanly
Start-Sleep -Milliseconds 500

# Start frontend in a new window
$frontend = Start-Process powershell `
    -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$root'; npm run dev --workspace=frontend" `
    -PassThru

# Save PIDs for stop.ps1
@{ backend = $backend.Id; frontend = $frontend.Id } `
    | ConvertTo-Json `
    | Set-Content "$root\.dashboard-pids.json"

Write-Host ""
Write-Host "  Backend  -> http://localhost:3001  (PID $($backend.Id))" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173  (PID $($frontend.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "  Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Run stop.ps1 to shut down both services." -ForegroundColor DarkGray
Write-Host ""
