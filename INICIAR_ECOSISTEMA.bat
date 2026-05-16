@echo off
set SCRIPT_DIR=%~dp0
set LOG_DIR=%SCRIPT_DIR%logs
set PYTHONPATH=%SCRIPT_DIR%
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
echo Inciando Ecosistema Axyntrax...
start "JARVIS ORCHESTRATOR" cmd /k "set PYTHONPATH=%SCRIPT_DIR% && python %SCRIPT_DIR%jarvis\jarvis_orchestrator.py > %LOG_DIR%\orchestrator.log 2>&1"
start "AXIA API" cmd /k "set PYTHONPATH=%SCRIPT_DIR% && python %SCRIPT_DIR%cecilia\axia_api_unificada.py > %LOG_DIR%\backend_api.log 2>&1"
start "CECILIA WEBHOOK" cmd /k "set PYTHONPATH=%SCRIPT_DIR% && python %SCRIPT_DIR%cecilia\axia_webhook_v2.py > %LOG_DIR%\backend_webhook.log 2>&1"
echo Ecosistema iniciado. Verifique logs en carpeta logs/.
