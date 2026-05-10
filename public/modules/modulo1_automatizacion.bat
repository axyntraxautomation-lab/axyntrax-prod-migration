@echo off
title AXYNTRAX - Modulo 1: Automatizacion
color 0B
echo ==============================================================
echo        AXYNTRAX AUTOMATION SUITE - INSTALADOR OFICIAL
echo ==============================================================
echo.
echo [Cecilia]: "Hola! Soy Cecilia. Te guiare en la instalacion del"
echo            "Modulo de Automatizacion RPA de Axyntrax."
echo.

set /p MASTER_KEY="Ingrese su Clave Maestra de Cliente: "
echo.
echo Validando Clave con MATRIX Server...

REM Simula validacion con el nuevo endpoint del Dashboard
set API_URL=http://localhost:3000
curl -s -X POST -H "Content-Type: application/json" -d "{\"key\":\"%MASTER_KEY%\"}" %API_URL%/api/keys/validate > validate_res.json

findstr /i "true" validate_res.json > nul
if %errorlevel% neq 0 (
    echo.
    echo [Cecilia]: "Ocurrio un problema. La clave no es valida o no"
    echo            "pudimos conectar con el servidor. Verifica tu conexion."
    del validate_res.json 2>nul
    pause
    exit /b
)

echo.
echo [Cecilia]: "Clave aceptada. Iniciando descarga del core..."
mkdir "%USERPROFILE%\axyntrax_core" 2>nul

REM Descarga el modulo desde el dashboard
curl -s -o "%USERPROFILE%\axyntrax_core\automatizacion_worker.py" "%API_URL%/api/modules/download?id=mod_1&key=%MASTER_KEY%"

echo.
echo [Cecilia]: "Instalando paquetes Python necesarios..."
pip install requests python-dotenv schedule -q

echo.
echo [Cecilia]: "Todo listo! Iniciando Modulo 1 en segundo plano..."
start pythonw "%USERPROFILE%\axyntrax_core\automatizacion_worker.py"

echo.
echo ✅ INSTALACION COMPLETADA CON EXITO.
echo Ya puedes cerrar esta ventana.
del validate_res.json 2>nul
pause
