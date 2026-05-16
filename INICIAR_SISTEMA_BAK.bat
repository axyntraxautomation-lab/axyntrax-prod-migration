@echo off
chcp 65001 > nul
title AXYNTRAX AUTOMATION SUITE — Sistema Completo

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║          AXYNTRAX AUTOMATION SUITE v2.0                  ║
echo  ║          CECILIA + AXIA + Dashboard + API                 ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite"

echo [1/4] Inicializando base de datos...
python -c "import sys; sys.path.insert(0,'.'); from db_master.models import init_db; init_db()"
if errorlevel 1 (
    echo ERROR: Fallo al inicializar DB
    pause
    exit /b 1
)
echo  OK: Base de datos lista.

echo.
echo [2/4] Iniciando API REST (puerto 5001)...
start "AXIA API" cmd /k "cd /d C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite && python axia_api.py"

timeout /t 2 /nobreak > nul

echo [3/4] Iniciando Webhook WhatsApp CECILIA (puerto 5000)...
start "CECILIA Webhook" cmd /k "cd /d C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite && python axia_webhook.py"

timeout /t 2 /nobreak > nul

echo [4/4] Iniciando Dashboard React (Vite)...
start "AXYNTRAX Dashboard" cmd /k "cd /d C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite\axia-core && npm run dev"

echo.
echo  ══════════════════════════════════════════════════════════
echo   SISTEMA ARRANCADO CORRECTAMENTE
echo.  
echo   Dashboard:  http://localhost:5173
echo   API:        http://localhost:5001/api/health
echo   Webhook:    http://localhost:5000/health
echo   Precios:    http://localhost:5173/pricing
echo  ══════════════════════════════════════════════════════════
echo.

start "" "http://localhost:5173"
pause
