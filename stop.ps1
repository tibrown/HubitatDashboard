# stop.ps1 — Stop HubitatDashboard backend and frontend

$root = $PSScriptRoot
$stopped = @()

Write-Host ""
Write-Host "  Stopping Hubitat Dashboard..." -ForegroundColor Cyan

# Try saved PIDs first
$pidFile = "$root\.dashboard-pids.json"
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile | ConvertFrom-Json
    foreach ($name in @('backend', 'frontend')) {
        $id = $pids.$name
        if ($id -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
            $stopped += "$name (PID $id)"
        }
    }
    Remove-Item $pidFile -Force
}

# Also kill any Node processes still holding ports 3001 / 5173
foreach ($port in @(3001, 5173)) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $procId = $conn.OwningProcess
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            $stopped += "port $port (PID $procId)"
        }
    }
}

if ($stopped.Count -gt 0) {
    foreach ($s in ($stopped | Select-Object -Unique)) {
        Write-Host "  Stopped: $s" -ForegroundColor Green
    }
} else {
    Write-Host "  Nothing was running." -ForegroundColor DarkGray
}

Write-Host ""
