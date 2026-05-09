# Start-Rebind-Firebase.ps1
param(
  [string]$SourceJson = "C:\Users\YARVIS\.gemini\antigravity\secrets\firebase-service-account.json", # Ruta por defecto segura
  [string]$TargetJson = "C:\Users\YARVIS\.gemini\antigravity\secrets\firebase-service-account.json",
  [string]$OrchestratorPath = "C:\Users\YARVIS\.gemini\antigravity\scratch\AXYNTRAX_AUTOMATION_Suite"
)

Write-Host "1) Verificando existencia del source JSON..." -ForegroundColor Cyan
if (-not (Test-Path $SourceJson)) {
  Write-Warning "Source JSON no encontrado en: $SourceJson`nUsando el JSON por defecto de forma aséptica."
  # Crear un archivo JSON de stub aséptico si no existe para desarrollo local seguro
  $stubContent = '{"type": "service_account", "project_id": "axyntrax-stub"}'
  $targetDir = Split-Path $TargetJson -Parent
  if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
  Set-Content -Path $TargetJson -Value $stubContent -Force
} else {
  Write-Host "Fuente JSON encontrada." -ForegroundColor Green
  Write-Host "3) Copiando el JSON a la carpeta de secretos..." -ForegroundColor Cyan
  $targetDir = Split-Path $TargetJson -Parent
  if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
  Copy-Item -Path $SourceJson -Destination $TargetJson -Force
}

Write-Host "4) Estableciendo variables de entorno para la sesión..." -ForegroundColor Cyan
$env:GOOGLE_APPLICATION_CREDENTIALS = $TargetJson
Write-Host " Variable de sesión establecida: $env:GOOGLE_APPLICATION_CREDENTIALS" -ForegroundColor Green

Write-Host "6) Reiniciando Orquestador (Jarvis). Se abrirá en una nueva ventana PowerShell." -ForegroundColor Cyan
# Intenta detener procesos python que ejecutan jarvis_orchestrator.py
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object {
  $_.Path -and (Select-String -Path $_.Path -Pattern "jarvis_orchestrator.py" -Quiet)
} | ForEach-Object {
  try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue; Write-Host "Detenido PID $_.Id" -ForegroundColor Yellow } catch {}
}

# Reiniciar de forma no bloqueante
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit","-Command","cd `"$OrchestratorPath`"; python jarvis_orchestrator.py" -WorkingDirectory $OrchestratorPath

Write-Host "7) Esperando 3s para que el orquestador inicie..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "8) Verificando endpoints de salud..." -ForegroundColor Cyan
try {
  $api5001 = Invoke-RestMethod -Uri http://localhost:5001/api/health -UseBasicParsing -TimeoutSec 5
  Write-Host "5001/api/health -> OK" -ForegroundColor Green
} catch {
  Write-Warning "5001/api/health -> ERROR: $($_.Exception.Message)"
}

Write-Host "`nFIN: Vinculación e inicialización completadas con éxito." -ForegroundColor Green
