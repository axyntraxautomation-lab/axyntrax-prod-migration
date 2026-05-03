@echo off
title INSTALADOR AXIA COMMAND SUITE DIAMANTE
color 0B
chcp 65001 > nul
echo ============================================================
echo   AXYNTRAX COMMAND SUITE | DIAMANTE v1.0
echo   INSTALACIÓN Y CONFIGURACIÓN MAESTRA
echo ============================================================
echo.

echo [1/3] Verificando dependencias de Python...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Fallo en la instalación de dependencias.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Inicializando Base de Datos Maestra e Integridad...
set PYTHONPATH=.
python -c "import sys; sys.path.append('.'); from db_master.models import init_db; init_db(); from suite_diamante.logic.axia.security import get_security; print(f'Diamond ID Validado: {get_security().get_hardware_id()}')"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Fallo en la inicialización de la seguridad.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Lanzando AXIA Maestro...
echo.
python AXIA_MAESTRO.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: El sistema se cerró inesperadamente.
    pause
)

echo.
echo Proceso finalizado.
pause
