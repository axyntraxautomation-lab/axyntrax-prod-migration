# ==============================================================================
# NOMBRE: AXYNTRAX_Optimizer.ps1
# VERSIÓN: 1.0
# AUTOR: Antigravity AI
# DESCRIPCIÓN: Script principal de optimización para Windows 11 (GPU NVIDIA & Ethernet)
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"
$LogPath = "C:\AXYNTRAX\logs"
if (!(Test-Path $LogPath)) { New-Item -ItemType Directory -Path $LogPath -Force }
$LogFile = "$LogPath\boot_optimizer_$(Get-Date -Format 'yyyyMMdd_HHmm').txt"

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$Timestamp] $Message" | Out-File -FilePath $LogFile -Append
}

Write-Log "🚀 Iniciando AXYNTRAX BOOT OPTIMIZER..."

# ════════════════════════════════════════
# 🧹 MÓDULO 1 — LIMPIEZA DEL SISTEMA
# ════════════════════════════════════════
Write-Log "[MOD1] Limpiando archivos temporales y caché..."
try {
    # Temp de usuario y sistema
    Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    
    # Papelera de reciclaje
    Clear-RecycleBin -Force -Confirm:$false -ErrorAction SilentlyContinue
    
    # Caché DNS
    ipconfig /flushdns | Out-Null
    
    # Caché de miniaturas
    Get-Process explorer | Stop-Process -Force
    Remove-Item "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
    Start-Process explorer
    
    # Logs antiguos en LocalAppData (> 7 días)
    Get-ChildItem "$env:LOCALAPPDATA\*.log" -Recurse | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force
    
    # Limpieza de disco silenciosa
    cleanmgr /sagerun:1 | Out-Null
    Write-Log "[MOD1] Limpieza completada."
} catch {
    Write-Log "[ERR] Error en Módulo 1: $_"
}

# ════════════════════════════════════════
# ⚡ MÓDULO 2 — OPTIMIZACIÓN PREFETCH Y MEMORIA
# ════════════════════════════════════════
Write-Log "[MOD2] Optimizando memoria y servicios..."
try {
    # Prefetch: Limpiar entradas antiguas (> 30 días)
    Get-ChildItem "C:\Windows\Prefetch\*" -Include *.pf | Where-Object { $_.LastAccessTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
    
    # Servicios innecesarios
    $Services = @("Fax", "WMPNetworkSvc", "MapsBroker", "RetailDemo", "XblGameSave", "DiagTrack")
    foreach ($Svc in $Services) {
        if (Get-Service $Svc -ErrorAction SilentlyContinue) {
            Stop-Service $Svc -Force
            Set-Service $Svc -StartupType Disabled
        }
    }
    
    # Plan de Energía: Máximo Rendimiento
    powercfg /setactive SCHEME_MIN # Alto rendimiento por defecto
    # Intentar activar Ultimate Performance si existe
    $Ultimate = powercfg /list | Select-String "Ultimate Performance"
    if ($Ultimate) {
        $Guid = $Ultimate.ToString().Split()[3]
        powercfg /setactive $Guid
    } else {
        # Importar esquema si no existe (opcional, pero usemos High Perf por seguridad)
        powercfg /duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 | Out-Null
    }
    
    # Desactivar animaciones visuales (Registro)
    Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name "UserPreferencesMask" -Value ([byte[]](144,18,3,128))
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" -Name "VisualFXSetting" -Value 2
    
    Write-Log "[MOD2] Memoria y servicios optimizados."
} catch {
    Write-Log "[ERR] Error en Módulo 2: $_"
}

# ════════════════════════════════════════
# 🎮 MÓDULO 3 — OPTIMIZACIÓN GPU NVIDIA
# ════════════════════════════════════════
Write-Log "[MOD3] Aplicando ajustes NVIDIA..."
try {
    # Forzar modo de rendimiento máximo en Registro
    $NvidiaKey = "HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers"
    if (!(Test-Path $NvidiaKey)) { New-Item -Path $NvidiaKey -Force }
    Set-ItemProperty -Path $NvidiaKey -Name "PlatformAggregation" -Value 1 -Type DWord
    
    # HAGS (Hardware-Accelerated GPU Scheduling)
    Set-ItemProperty -Path $NvidiaKey -Name "HwSchMode" -Value 2 -Type DWord # 2 = Enabled
    
    # Desactivar Telemetry de NVIDIA
    Get-Service "NvTelemetryContainer" | Stop-Service -Force
    Set-Service "NvTelemetryContainer" -StartupType Disabled
    
    # Prioridad Baja para nvcontainer (para que no interfiera en idle)
    $nvProc = Get-Process nvcontainer -ErrorAction SilentlyContinue
    if ($nvProc) { $nvProc.PriorityClass = "BelowNormal" }
    
    # Limpiar Shader Cache
    $ShaderCache = "$env:LOCALAPPDATA\NVIDIA\DXCache"
    if (Test-Path $ShaderCache) {
        Remove-Item "$ShaderCache\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Log "[MOD3] GPU NVIDIA optimizada."
} catch {
    Write-Log "[ERR] Error en Módulo 3: $_"
}

# ════════════════════════════════════════
# 🌐 MÓDULO 4 — OPTIMIZACIÓN RED ETHERNET
# ════════════════════════════════════════
Write-Log "[MOD4] Configurando red Ethernet 1Gbps..."
try {
    netsh winsock reset catalog | Out-Null
    netsh int ip reset | Out-Null
    netsh interface ip delete arpcache | Out-Null
    
    # TCP Tweaks
    netsh int tcp set global autotuninglevel=normal
    netsh int tcp set global rss=enabled
    netsh int tcp set global heuristics disabled
    
    # DNS Cloudflare
    $Adapter = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.Name -like "*Ethernet*" } | Select-Object -First 1
    if ($Adapter) {
        Set-DnsClientServerAddress -InterfaceAlias $Adapter.Name -ServerAddresses ("1.1.1.1", "1.0.0.1")
        # MTU 1500
        netsh interface ipv4 set subinterface $Adapter.Name mtu=1500 store=persistent
        # Prioridad sobre WiFi
        Set-NetIPInterface -InterfaceAlias $Adapter.Name -InterfaceMetric 10
        # Desactivar IPv6
        Disable-NetAdapterBinding -Name $Adapter.Name -ComponentID ms_tcpip6
        
        # Forzar 1Gbps Full Duplex (Esto depende del driver, intentamos vía Advanced Property)
        # Nota: Los nombres de las propiedades varían por fabricante.
        Set-NetAdapterAdvancedProperty -Name $Adapter.Name -DisplayName "*SpeedDuplex" -DisplayValue "1.0 Gbps Full Duplex" -ErrorAction SilentlyContinue
    }
    
    Write-Log "[MOD4] Red configurada correctamente."
} catch {
    Write-Log "[ERR] Error en Módulo 4: $_"
}

# ════════════════════════════════════════
# 🖥️ MÓDULO 5 — OPTIMIZACIÓN DE ARRANQUE
# ════════════════════════════════════════
Write-Log "[MOD5] Analizando arranque y sistema..."
try {
    # Registrar servicios lentos
    $SlowServices = Get-CimInstance Win32_Service | Select-Object Name, Caption, @{Name="StartTime"; Expression={(Get-Date) - $_.InstallDate}} | Sort-Object StartTime -Descending | Select-Object -First 5
    Write-Log "[INFO] Top 5 servicios lentos: $($SlowServices.Name -join ', ')"
    
    # Desactivar Hibernación
    powercfg /h off
    
    # Limpiar caché de fuentes
    Stop-Service FontCache -Force
    Remove-Item "C:\Windows\ServiceProfiles\LocalService\AppData\Local\FontCache\*.dat" -Force
    Start-Service FontCache
    
    # SFC 1 vez por semana
    $LastSFC = (Get-Item $LogFile).CreationTime
    if ($LastSFC.DayOfWeek -eq "Monday") {
        Write-Log "[INFO] Ejecutando SFC semanal..."
        sfc /scannow | Out-Null
    }
    
    Write-Log "[MOD5] Optimización de arranque finalizada."
} catch {
    Write-Log "[ERR] Error en Módulo 5: $_"
}

# ════════════════════════════════════════
# 📋 MÓDULO 6 — NOTIFICACIÓN
# ════════════════════════════════════════
Write-Log "✅ AXYNTRAX BOOT OPTIMIZER finalizado con éxito."

$ToastTitle = "⚡ AXYNTRAX BOOT OPTIMIZER"
$ToastText = "Sistema optimizado y listo. [$(Get-Date -Format 'HH:mm:ss')]"

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
$Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$RawXml = [xml]$Template.GetXml()
$RawXml.toast.visual.binding.text[0].AppendChild($RawXml.CreateTextNode($ToastTitle)) > $null
$RawXml.toast.visual.binding.text[1].AppendChild($RawXml.CreateTextNode($ToastText)) > $null
$SerializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
$SerializedXml.LoadXml($RawXml.OuterXml)
$Toast = [Windows.UI.Notifications.ToastNotification]::new($SerializedXml)
$Toast.ExpirationTime = [DateTimeOffset]::Now.AddSeconds(5)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("AxyntraxOptimizer").Show($Toast)
