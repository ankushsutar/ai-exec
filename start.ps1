Write-Host "Starting AI Executive Intelligence Platform..." -ForegroundColor Cyan

# Start Backend
Write-Host "-> Starting Backend on port 3000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory ".\backend" -PassThru -NoNewWindow

# Start Frontend
Write-Host "-> Starting Frontend on port 4200..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory ".\frontend" -PassThru -NoNewWindow

Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "Press [CTRL+C] to stop both services." -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Yellow

try {
    # Keep the script running
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Stopping services..." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
}
