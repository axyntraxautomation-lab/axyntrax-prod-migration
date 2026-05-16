@echo off
rem INICIAR_SISTEMA.bat - version limpia y compatible con ANSI
rem Ejecuta backend y frontend en ventanas separadas y guarda logs

rem Guardar directorio del script y cambiar a el
set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%"

rem Crear carpeta de registros si no existe
set LOG_DIR=%SCRIPT_DIR%logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ==========================================
echo       AXYNTRAX AUTOMATION SUITE v2.0
echo       CECILIA + AXIA + Dashboard + API
echo ==========================================
echo.

echo [1/3] Inicializando base de datos...
python -c "import sys; sys.path.insert(0,'.'); from db_master.models import init_db; init_db()"
if errorlevel 1 (
    echo ERROR: Fallo al inicializar DB
    pause
    exit /b 1
)
echo OK: Base de datos lista.
echo.

rem ==== Detectar backend ====
set BACKEND_API_CMD=
set BACKEND_WEBHOOK_CMD=

if exist "%SCRIPT_DIR%axia_api.py" set BACKEND_API_CMD=python "%SCRIPT_DIR%axia_api.py"
if exist "%SCRIPT_DIR%axia_webhook.py" set BACKEND_WEBHOOK_CMD=python "%SCRIPT_DIR%axia_webhook.py"

if "%BACKEND_API_CMD%"=="" (
  if exist "%SCRIPT_DIR%main.py" set BACKEND_API_CMD=python "%SCRIPT_DIR%main.py"
  if exist "%SCRIPT_DIR%backend\main.py" set BACKEND_API_CMD=python "%SCRIPT_DIR%backend\main.py"
  if exist "%SCRIPT_DIR%app.py" set BACKEND_API_CMD=python "%SCRIPT_DIR%app.py"
)

if "%BACKEND_API_CMD%"=="" (
  set /p BACKEND_API_CMD="No se detecto el backend automaticamente. Escribe el comando para arrancar el backend: "
)

rem ==== Detectar frontend ====
set FRONTEND_DIR=
set FRONTEND_CMD=

if exist "%SCRIPT_DIR%axia-core\package.json" (
  set FRONTEND_DIR=axia-core
  set FRONTEND_CMD=npm run dev
) else if exist "%SCRIPT_DIR%frontend\package.json" (
  set FRONTEND_DIR=frontend
  set FRONTEND_CMD=npm start
) else if exist "%SCRIPT_DIR%package.json" (
  set FRONTEND_DIR=.
  set FRONTEND_CMD=npm start
)

if "%FRONTEND_CMD%"=="" (
  echo No se detecta el package.json del frontend automaticamente.
  set /p FRONTEND_CMD="Si tienes frontend, escribe el comando para arrancarlo o deja en blanco para omitir: "
)

rem ==== Arrancar backend API en ventana nueva ====
echo Iniciando backend API con: %BACKEND_API_CMD%
start "AXIA API" cmd /k "cd /d "%SCRIPT_DIR%" && echo Backend API: ejecutando %BACKEND_API_CMD% && %BACKEND_API_CMD% >> "%LOG_DIR%\backend_api.log" 2>>&1"

rem ==== Arrancar backend Webhook si existe ====
if not "%BACKEND_WEBHOOK_CMD%"=="" (
  echo Iniciando Webhook con: %BACKEND_WEBHOOK_CMD%
  start "CECILIA WEBHOOK" cmd /k "cd /d "%SCRIPT_DIR%" && echo Webhook: ejecutando %BACKEND_WEBHOOK_CMD% && %BACKEND_WEBHOOK_CMD% >> "%LOG_DIR%\backend_webhook.log" 2>>&1"
)

rem ==== Arrancar frontend si aplica ====
if not "%FRONTEND_CMD%"=="" (
  echo Iniciando frontend con: %FRONTEND_CMD% - directorio: %FRONTEND_DIR%...
  if not "%FRONTEND_DIR%"=="" (
    start "AXYNTRAX Dashboard" cmd /k "cd /d "%SCRIPT_DIR%%FRONTEND_DIR%" && echo Frontend: ejecutando %FRONTEND_CMD% && %FRONTEND_CMD% >> "%LOG_DIR%\frontend.log" 2>>&1"
  ) else (
    start "AXYNTRAX Dashboard" cmd /k "cd /d "%SCRIPT_DIR%" && echo Frontend: ejecutando %FRONTEND_CMD% && %FRONTEND_CMD% >> "%LOG_DIR%\frontend.log" 2>>&1"
  )
) else (
  echo Frontend omitido - no se detecto ni especifico comando.
)

rem Pequeña pausa para dar tiempo a bootear servicios (usando ping que soporta redireccion de entrada)
echo.
echo Esperando 6 segundos para que los servicios inicialicen...
ping 127.0.0.1 -n 7 > nul

rem ==== Verificar puertos (PowerShell) ====
echo.
echo Comprobando puertos 5001, 5000 y 5173/3000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5001,5000,5173,3000 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,State,OwningProcess | Format-Table -AutoSize"

echo.
echo Registros:
echo Registro del backend API: %LOG_DIR%\backend_api.log
if not "%BACKEND_WEBHOOK_CMD%"=="" echo Registro del Webhook:     %LOG_DIR%\backend_webhook.log
if exist "%LOG_DIR%\frontend.log" echo Registro del frontend:    %LOG_DIR%\frontend.log

echo.
echo Para detener: cierra las ventanas abiertas o usa Task Manager / taskkill.
echo Si quieres ver los ultimos registros en consola, puedes ejecutar:
echo type "%LOG_DIR%\backend_api.log" | more
if exist "%LOG_DIR%\frontend.log" echo type "%LOG_DIR%\frontend.log" | more

popd
pause
