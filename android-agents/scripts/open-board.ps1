# open-board.ps1 -- Opens the Kanban board in standalone app mode (no browser chrome).
# Tries Chrome first, then Edge, then falls back to default browser.
param([string]$Url = "http://localhost:8765")

$candidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browser) {
    Start-Process $browser "--app=$Url --window-size=1400,900"
} else {
    Start-Process $Url
}
