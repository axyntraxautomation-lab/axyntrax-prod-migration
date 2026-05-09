# Start-Axyntrax-All.ps1 (pegar y ejecutar en PowerShell)
$base = "C:\Users\YARVIS\.gemini\antigravity\scratch\AXYNTRAX_AUTOMATION_Suite"
$conexionPath = Join-Path $base "conexion"
$orquestadorPath = $base
$psInstaller = Join-Path $conexionPath "ps1_install_service.ps1"

Write-Host "`n==== INTENTO: Ejecutar instalador ps1 (arranque como servicio) ====" -ForegroundColor Cyan
try {
  PowerShell -ExecutionPolicy Bypass -File $psInstaller
  Start-Sleep -Seconds 3
  Write-Host "Instalador ejecutado (si no devolvió error)." -ForegroundColor Green
} catch {
  Write-Warning "El instalador devolvió error o no pudo ejecutarse: $_"
}

Write-Host "`n==== COMPROBANDO PUERTOS (5000,5001,5800) ====" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 5000,5001,5800 -ErrorAction SilentlyContinue | Format-Table -AutoSize

# Si 5800 no está escuchando, arranca uvicorn en primer plano para ver errores
$port5800 = (Get-NetTCPConnection -LocalPort 5800 -ErrorAction SilentlyContinue | Where-Object {$_.State -eq 'Listen'})
if (-not $port5800) {
  Write-Host "`n5800 no LISTEN -> arrancando Uvicorn en primer plano para ver errores..." -ForegroundColor Yellow
  Push-Location $conexionPath
  # Intenta con python -m uvicorn (mostrará errores en esta consola)
  Write-Host "Comando: python -m uvicorn api:app --host 0.0.0.0 --port 5800 --reload" -ForegroundColor Gray
  Write-Host "Si aparece error, copia aquí el rastreo completo." -ForegroundColor Gray
  python -m uvicorn api:app --host 0.0.0.0 --port 5800 --reload
  Pop-Location
  exit 1
} else {
  Write-Host "5800 LISTEN OK" -ForegroundColor Green
}

# Arrancar jarvis_orchestrator en nueva ventana si no corre
$orqPid = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.Path -and (Select-String -Path $_.Path -Pattern "jarvis_orchestrator.py" -Quiet) } 
if (-not $orqPid) {
  Write-Host "`nJarvis no parece estar corriendo -> abriendo una nueva ventana para arrancar jarvis_orchestrator.py" -ForegroundColor Cyan
  Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-NoExit","-Command","cd '$orquestadorPath'; python jarvis_orchestrator.py"
} else {
  Write-Host "Jarvis (python) detectado, confirme los registros." -ForegroundColor Green
}

# Esperar 2s y comprobar puntos finales
Start-Sleep -Seconds 2
Write-Host "`n==== PROBANDO PUNTOS FINALES ====" -ForegroundColor Cyan
Write-Host "http://localhost:5000/dashboard"
Write-Host "http://localhost:5001/api/health"
Write-Host "http://localhost:5800/health"
try { Invoke-RestMethod -Uri http://localhost:5001/api/health -UseBasicParsing | ConvertTo-Json -Depth 4 ; } catch { Write-Warning "5001/api/health -> $($_.Exception.Message)" }
try { Invoke-RestMethod -Uri http://localhost:5800/health -UseBasicParsing | ConvertTo-Json -Depth 4 ; } catch { Write-Warning "5800/health -> $($_.Exception.Message)" }

Write-Host "`n==== REGISTROS DE COLA (orquestador + conexión) ====" -ForegroundColor Cyan
$log1 = Join-Path $base "logs\orchestrator.log"
$log2 = Join-Path $conexionPath "logs\conexion.log"
if (Test-Path $log1) { Write-Host "`n--- orquestador.log (últimas 10 líneas) ---" ; Get-Content $log1 -Tail 10 } else { Write-Warning "No existe $log1" }

Write-Host "`nSi uvicorn arrancó en primer plano verás el traceback arriba. Copia cualquier error y pégalo aquí para que lo corrija." -ForegroundColor Yellow
