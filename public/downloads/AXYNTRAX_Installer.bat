@echo off
setlocal EnableDelayedExpansion

:: ==============================================================================
:: NOMBRE: AXYNTRAX_Installer.bat
:: VERSIÓN: 5.0 (Edición Corporativa)
:: AUTOR: Antigravity AI - Axyntrax Automation
:: DESCRIPCIÓN: Instalador Corporativo Blindado con Validación de Keygen V5.0
:: ==============================================================================

:: Comprobar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Se requieren privilegios de Administrador.
    echo Reintentando elevacion...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

title AXYNTRAX V5.0 - Instalador Corporativo Blindado
cls
echo ════════════════════════════════════════════════════════════
echo    BIENVENIDO AL INSTALADOR OFICIAL DE AXYNTRAX V5.0
echo             [ Edicion Corporativa Blindada ]
echo ════════════════════════════════════════════════════════════
echo.

:: Solicitar Keygen al cliente
set /p "KEYGEN=Ingrese su clave de licencia (Keygen): "
if "%KEYGEN%"=="" (
    echo [ERROR] La clave de licencia no puede estar vacia.
    pause
    exit /b
)

echo.
echo [+] Validando Keygen con la central JARVIS...
echo.

:: Llamar a PowerShell para validar contra el API de producción
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$body = @{ key = '%KEYGEN%'; machineId = $env:COMPUTERNAME } | ConvertTo-Json -Compress; ^
    try { ^
        $res = Invoke-RestMethod -Uri 'https://www.axyntrax-automation.net/api/keygen/validate' -Method Post -ContentType 'application/json' -Body $body; ^
        if ($res.valid) { ^
            Write-Host '---------------------------------------------------------' -ForegroundColor Cyan; ^
            Write-Host $res.mensaje -ForegroundColor Green; ^
            Write-Host '---------------------------------------------------------' -ForegroundColor Cyan; ^
            Write-Host ('Cliente: ' + $res.empresa) -ForegroundColor White; ^
            Write-Host ('Rubro: ' + $res.rubro.ToUpper() + ' | Plan: ' + $res.plan.ToUpper()) -ForegroundColor White; ^
            Write-Host ('Sub-modulos Activados: ' + ($res.submodulos -join ', ')) -ForegroundColor Cyan; ^
            Write-Host ('Vigencia hasta: ' + $res.expiry) -ForegroundColor Yellow; ^
            Write-Host '---------------------------------------------------------' -ForegroundColor Cyan; ^
            exit 0; ^
        } else { ^
            Write-Host ('[ERROR] ' + $res.error) -ForegroundColor Red; ^
            exit 1; ^
        } ^
    } catch { ^
        Write-Host '[ERROR] Error de conexion con los servidores de Axyntrax.' -ForegroundColor Red; ^
        Write-Host $_.Exception.Message -ForegroundColor DarkRed; ^
        exit 2; ^
    }"

set "EXIT_CODE=%errorlevel%"

if %EXIT_CODE% neq 0 (
    echo.
    echo ❌ Validacion fallida. La instalacion ha sido cancelada por ATLAS.
    pause
    exit /b
)

echo.
echo [+] Keygen Verificado de manera exitosa. Continuando con la instalacion...
echo [+] Creando directorios del sistema...
if not exist "C:\AXYNTRAX\logs" mkdir "C:\AXYNTRAX\logs"

:: Crear archivo de configuración local con el rubro y sub-módulos activados
(
echo KEY=%KEYGEN%
echo ACTIVADO=TRUE
) > "C:\AXYNTRAX\config.ini"

:: Copiar archivos al sistema (Simulado si no existen en la misma ruta de instalación)
echo [+] Copiando ejecutables y optimizadores...
if exist "AXYNTRAX_Optimizer.ps1" (
    copy /y "AXYNTRAX_Optimizer.ps1" "C:\AXYNTRAX\" >nul
) else (
    echo [Info] Descargando optimizador desde el servidor...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.axyntrax-automation.net/downloads/AXYNTRAX_Optimizer.ps1' -OutFile 'C:\AXYNTRAX\AXYNTRAX_Optimizer.ps1'"
)

if exist "AXYNTRAX_Launcher.bat" (
    copy /y "AXYNTRAX_Launcher.bat" "C:\AXYNTRAX\" >nul
) else (
    (
    echo @echo off
    echo powershell -NoProfile -ExecutionPolicy Bypass -File "C:\AXYNTRAX\AXYNTRAX_Optimizer.ps1"
    ) > "C:\AXYNTRAX\AXYNTRAX_Launcher.bat"
)

:: Crear Acceso Directo en Carpeta de Inicio (Startup)
set SCRIPT_PATH="C:\AXYNTRAX\AXYNTRAX_Launcher.bat"
set STARTUP_FOLDER="%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
set SHORTCUT_NAME="AXYNTRAX_Boot_Optimizer.lnk"

echo [+] Configurando inicio automatico con Windows...
powershell -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP_FOLDER%\%SHORTCUT_NAME%');$s.TargetPath='%SCRIPT_PATH%';$s.WindowStyle=7;$s.Save()"

:: Registrar Tarea Programada de alta prioridad
schtasks /delete /tn "AXYNTRAX Boot Optimizer" /f >nul 2>&1
schtasks /create /tn "AXYNTRAX Boot Optimizer" /tr "C:\AXYNTRAX\AXYNTRAX_Launcher.bat" /sc onlogon /rl highest /f >nul 2>&1

echo.
echo ════════════════════════════════════════════════════════════
echo    INSTALACION COMPLETADA CON EXITO.
echo    El ecosistema Axyntrax esta en linea para su negocio.
echo ════════════════════════════════════════════════════════════
pause
exit
