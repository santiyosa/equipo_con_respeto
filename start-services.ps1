# Script para iniciar los servicios del Sistema de Gestión del Equipo de Fútbol
# Frontend: http://localhost:5173
# Backend: http://localhost:8005

Write-Host "Iniciando Sistema de Gestión del Equipo de Fútbol..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

# Función para verificar si un puerto está en uso
function Test-Port {
    param([int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Verificar si los puertos están disponibles
Write-Host "Verificando puertos..." -ForegroundColor Yellow

if (Test-Port -Port 8005) {
    Write-Host "El puerto 8005 (Backend) ya está en uso" -ForegroundColor Red
    Write-Host "Deteniendo procesos existentes..." -ForegroundColor Yellow
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

if (Test-Port -Port 5173) {
    Write-Host "El puerto 5173 (Frontend) ya está en uso" -ForegroundColor Red
    Write-Host "Deteniendo procesos existentes..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Navegar al directorio del proyecto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "Directorio del proyecto: $projectPath" -ForegroundColor Cyan

# Iniciar Backend
Write-Host "Iniciando Backend (Puerto 8005)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\backend'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8005; Read-Host 'Presiona Enter para cerrar'" -WindowStyle Normal

# Esperar un momento para que el backend se inicie
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "Iniciando Frontend (Puerto 5173)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\frontend'; npm run dev; Read-Host 'Presiona Enter para cerrar'" -WindowStyle Normal

# Esperar un momento para que el frontend se inicie
Start-Sleep -Seconds 3

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Servicios iniciados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de acceso:" -ForegroundColor White
Write-Host "   • Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • Backend:   http://localhost:8005" -ForegroundColor Cyan
Write-Host "   • API Docs:  http://localhost:8005/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener los servicios:" -ForegroundColor Yellow
Write-Host "   • Cierra las ventanas de PowerShell que se abrieron" -ForegroundColor White
Write-Host "   • O ejecuta: .\stop-services.ps1" -ForegroundColor White
Write-Host ""
Write-Host "La aplicación está lista para usar!" -ForegroundColor Green

# Abrir el navegador automáticamente
Start-Sleep -Seconds 5
Write-Host "Abriendo navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"
