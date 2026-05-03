@echo off
chcp 65001 > nul
title AXYNTRAX Command Center

:: Verificar si ya están corriendo
netstat -an 2>nul | findstr ":5001 " > nul
if %errorlevel% == 0 (
    echo [OK] Backend ya corriendo en puerto 5001
    goto :open_electron
)

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║    AXYNTRAX AUTOMATION SUITE v2.0        ║
echo  ║    Iniciando sistema...                  ║
echo  ╚══════════════════════════════════════════╝
echo.

set SUITE_DIR=C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite
set CORE_DIR=%SUITE_DIR%\axia-core

:: Inicializar DB
echo [1/3] Inicializando base de datos...
python -c "import sys; sys.path.insert(0,'%SUITE_DIR%'); from db_master.models import init_db; init_db()" >nul 2>&1

:: Iniciar API REST en background
echo [2/3] Iniciando AXIA API (puerto 5001)...
start /B "" cmd /c "cd /d %SUITE_DIR% && python axia_api.py" > "%SUITE_DIR%\logs\api.log" 2>&1

:: Esperar un momento a que levante
timeout /t 3 /nobreak > nul

:open_electron
echo [3/3] Abriendo AXIA Command Center...

:: Si existe la carpeta dist, abrir Electron con el build
if exist "%CORE_DIR%\dist\index.html" (
    cd /d "%CORE_DIR%"
    npx electron . --dist 2>nul
    if errorlevel 1 goto :open_dev
) else (
    goto :open_dev
)
goto :end

:open_dev
:: Fallback: abrir en el navegador
start "" "http://localhost:5173"
echo [INFO] Dashboard abierto en navegador (localhost:5173)

:end
