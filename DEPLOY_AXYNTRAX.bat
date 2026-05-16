@echo off
echo.
echo ===================================================
echo   INICIANDO DESPLIEGUE DE PRODUCCION AXYNTRAX
echo ===================================================
echo.

:: 1. Verificacion de Entorno
echo [1/4] Verificando entorno...
if not exist .env (
    echo ERR: Archivo .env no encontrado.
    exit /b 1
)

:: 2. Inicializacion de Base de Datos
echo [2/4] Inicializando Base de Datos Maestra...
set PYTHONPATH=.;%PYTHONPATH%
python db_master/models.py
if %ERRORLEVEL% neq 0 (
    echo ERR: Fallo al inicializar la DB.
    exit /b 1
)

:: 3. Limpieza de Temporales
echo [3/4] Limpiando archivos temporales...
if not exist temp_quotes mkdir temp_quotes
del /q temp_quotes\* >nul 2>&1

:: 4. Preparacion de Frontend
echo [4/4] Preparando activos web...
echo Frontend en 'web_deploy' listo para hostear.

echo.
echo ===================================================
echo   SISTEMA POTENCIADO Y LISTO PARA OPERAR
echo ===================================================
echo Ejecuta 'python AXIA_MAESTRO.py' para iniciar la Suite.
echo.
