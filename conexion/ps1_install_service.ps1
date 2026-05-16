# C:\Users\YARVIS\.gemini\antigravity\scratch\AXYNTRAX_AUTOMATION_Suite\conexion\ps1_install_service.ps1
# Script de instalación para registrar el servicio Conexion en Windows

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceFile = Join-Path $scriptPath "service.py"
$apiFile = Join-Path $scriptPath "api.py"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "⚙️ Registrando Servicio Conexion (Interconexión Autónoma)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Crear tarea programada para persistencia de fondo de service.py
$action = New-ScheduledTaskAction -Execute "python" -Argument "$serviceFile"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "Axyntrax_Conexion_Monitor" -Action $action -Trigger $trigger -Settings $settings -Force -ErrorAction SilentlyContinue

# Iniciar procesos en segundo plano para la sesión actual
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "$serviceFile"
Start-Process -NoNewWindow -FilePath "uvicorn" -ArgumentList "conexion.api:app --host 0.0.0.0 --port 5800"

Write-Host "🟢 Servicio e API de Conexion instalados y corriendo en http://localhost:5800" -ForegroundColor Green
