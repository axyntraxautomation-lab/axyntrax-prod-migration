@echo off
setlocal EnableDelayedExpansion

:: ==============================================================================
:: NOMBRE: AXYNTRAX_Uninstaller.bat
:: VERSIÓN: 1.0
:: AUTOR: Antigravity AI
:: DESCRIPCIÓN: Desinstala completamente AXYNTRAX BOOT OPTIMIZER
:: ==============================================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ════════════════════════════════════════════════════════════
echo    DESINSTALANDO AXYNTRAX BOOT OPTIMIZER...
echo ════════════════════════════════════════════════════════════

:: Eliminar Tarea Programada
schtasks /delete /tn "AXYNTRAX Boot Optimizer" /f >nul 2>&1

:: Eliminar Acceso Directo de Inicio
del /f /q "%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\AXYNTRAX_Boot_Optimizer.lnk" >nul 2>&1

:: Eliminar Carpeta (con confirmacion para logs)
echo [?] ¿Desea eliminar tambien los registros de log en C:\AXYNTRAX? (S/N)
set /p opt=
if /i "%opt%"=="S" (
    rmdir /s /q "C:\AXYNTRAX" >nul 2>&1
    echo [+] Carpeta C:\AXYNTRAX eliminada.
) else (
    del /f /q "C:\AXYNTRAX\*.ps1" >nul 2>&1
    del /f /q "C:\AXYNTRAX\*.bat" >nul 2>&1
    echo [+] Scripts eliminados, logs preservados.
)

echo ════════════════════════════════════════════════════════════
echo    DESINSTALACION COMPLETADA.
echo ════════════════════════════════════════════════════════════
pause
exit
