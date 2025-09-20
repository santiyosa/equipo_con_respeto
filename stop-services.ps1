# Script para detener los servicios del Sistema de Gestión del Equipo de Fútbol

Write-Host "🛑 Deteniendo Sistema de Gestión del Equipo de Fútbol..." -ForegroundColor Red
Write-Host "=======================================================" -ForegroundColor Cyan

# Detener procesos de Python (Backend)
Write-Host "🔧 Deteniendo Backend..." -ForegroundColor Yellow
taskkill /F /IM python.exe /T 2>$null
Write-Host "   ✅ Backend detenido" -ForegroundColor Green

# Detener procesos de Node.js (Frontend)
Write-Host "⚛️  Deteniendo Frontend..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null
Write-Host "   ✅ Frontend detenido" -ForegroundColor Green

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