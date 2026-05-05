@echo off
setlocal EnableDelayedExpansion

:: ==============================================================================
:: NOMBRE: AXYNTRAX_Installer.bat
:: VERSIÓN: 1.0
:: AUTOR: Antigravity AI
:: DESCRIPCIÓN: Instalador oficial de AXYNTRAX BOOT OPTIMIZER
:: ==============================================================================

:: Comprobar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Se requieren privilegios de Administrador.
    echo Reintentando elevacion...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ════════════════════════════════════════════════════════════
echo    INSTALANDO AXYNTRAX BOOT OPTIMIZER...
echo ════════════════════════════════════════════════════════════

:: Crear directorios
if not exist "C:\AXYNTRAX\logs" mkdir "C:\AXYNTRAX\logs"

:: Copiar archivos al sistema
echo [+] Copiando archivos a C:\AXYNTRAX...
copy /y "AXYNTRAX_Optimizer.ps1" "C:\AXYNTRAX\"
copy /y "AXYNTRAX_Launcher.bat" "C:\AXYNTRAX\"

:: Crear Acceso Directo en Carpeta de Inicio (Startup)
set SCRIPT_PATH="C:\AXYNTRAX\AXYNTRAX_Launcher.bat"
set STARTUP_FOLDER="%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
set SHORTCUT_NAME="AXYNTRAX_Boot_Optimizer.lnk"

echo [+] Creando acceso directo en la carpeta de inicio...
powershell -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP_FOLDER%\%SHORTCUT_NAME%');$s.TargetPath='%SCRIPT_PATH%';$s.WindowStyle=7;$s.Save()"

:: Crear Tarea Programada (Alternativa robusta)
echo [+] Registrando tarea en el Programador de Tareas...
schtasks /create /tn "AXYNTRAX Boot Optimizer" /tr "C:\AXYNTRAX\AXYNTRAX_Launcher.bat" /sc onlogon /rl highest /f

echo.
echo ════════════════════════════════════════════════════════════
echo    INSTALACION COMPLETADA CON EXITO.
echo    El sistema se optimizara en cada inicio.
echo ════════════════════════════════════════════════════════════
pause
exit
