Write-Host "Iniciando bucle de monitoreo de Antigravity..."
while ($true) { 
    python bridge_antigravity_optimized.py
    Start-Sleep -Seconds 300 
}
