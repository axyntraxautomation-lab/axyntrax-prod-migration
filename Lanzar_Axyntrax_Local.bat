@echo off
title AXYNTRAX - LANZADOR LOCAL V2
color 0b

echo ======================================================
echo   AXYNTRAX AUTOMATION SUITE - MODO LOCAL
echo ======================================================
echo.
echo [1/3] Verificando dependencias...
pip install flask flask-cors requests python-dotenv --break-system-packages > nul

echo [2/3] Iniciando API AXIA (Puerto 5001)...
start /b python axia_api_unificada.py

echo [3/3] Iniciando Dashboard Diamante...
echo Accediendo a: http://localhost:5173
start http://localhost:5173

echo.
echo ======================================================
echo   SISTEMA ACTIVO. No cierres esta ventana.
echo   Submodulos Instalados: Inventario, Cecilia, Atlas.
echo ======================================================
echo.
pause
