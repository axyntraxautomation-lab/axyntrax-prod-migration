# AXYNTRAX AUTOMATION - Production Deployment Script
Write-Host "`n=== INICIANDO DESPLIEGUE DE PRODUCCIÓN AXYNTRAX ===" -ForegroundColor Cyan

# 1. Verificación de Entorno
Write-Host "[1/4] Verificando entorno..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "ERR: Archivo .env no encontrado." -ForegroundColor Red
    return
}

# 2. Inicialización de Base de Datos Maestra
Write-Host "[2/4] Inicializando Base de Datos Maestra..." -ForegroundColor Yellow
$env:PYTHONPATH = ".;$env:PYTHONPATH"
python db_master/models.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERR: Fallo al inicializar la DB." -ForegroundColor Red
    return
}

# 3. Limpieza de Temporales
Write-Host "[3/4] Limpiando archivos temporales..." -ForegroundColor Yellow
if (!(Test-Path "temp_quotes")) { 
    New-Item -ItemType Directory -Path "temp_quotes" 
} else {
    Remove-Item -Path "temp_quotes\*" -Force -ErrorAction SilentlyContinue
}

# 4. Preparación de Frontend
Write-Host "[4/4] Preparando activos web..." -ForegroundColor Yellow
Write-Host "Frontend en 'web_deploy' listo para hostear." -ForegroundColor Green

Write-Host "`n=== SISTEMA POTENCIADO Y LISTO PARA OPERAR ===" -ForegroundColor Green
Write-Host "Ejecuta 'python AXIA_MAESTRO.py' para iniciar la Suite Diamante." -ForegroundColor Cyan
