# Script para detener los servicios del Sistema de Gestión del Equipo de Fútbol

Write-Host "🛑 Deteniendo Sistema de Gestión del Equipo de Fútbol..." -ForegroundColor Red
Write-Host "=======================================================" -ForegroundColor Cyan

# Función para verificar si un proceso está corriendo
function Test-ProcessRunning {
    param([string]$ProcessName)
    $process = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    return $process -ne $null
}

# Detener procesos de Python (Backend)
if (Test-ProcessRunning -ProcessName "python") {
    Write-Host "🔧 Deteniendo Backend..." -ForegroundColor Yellow
    taskkill /F /IM python.exe 2>$null
    if ($?) {
        Write-Host "   ✅ Backend detenido" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No se encontraron procesos de Backend" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Backend no estaba corriendo" -ForegroundColor Gray
}

# Detener procesos de Node.js (Frontend)
if (Test-ProcessRunning -ProcessName "node") {
    Write-Host "⚛️  Deteniendo Frontend..." -ForegroundColor Yellow
    taskkill /F /IM node.exe 2>$null
    if ($?) {
        Write-Host "   ✅ Frontend detenido" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No se encontraron procesos de Frontend" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Frontend no estaba corriendo" -ForegroundColor Gray
}

# Verificar puertos
Write-Host ""
Write-Host "🔍 Verificando puertos..." -ForegroundColor Cyan

$port8005 = netstat -ano | findstr :8005
$port5173 = netstat -ano | findstr :5173

if ($port8005) {
    Write-Host "   ⚠️  Puerto 8005 aún en uso" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Puerto 8005 liberado" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "   ⚠️  Puerto 5173 aún en uso" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Puerto 5173 liberado" -ForegroundColor Green
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "✅ Todos los servicios han sido detenidos" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para volver a iniciar, ejecuta: .\start-services.ps1" -ForegroundColor Cyan

Read-Host "Presiona Enter para continuar"
