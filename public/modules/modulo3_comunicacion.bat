@echo off
title AXYNTRAX - Modulo 3: Comunicacion Masiva
color 0D
echo ==============================================================
echo        AXYNTRAX AUTOMATION SUITE - INSTALADOR OFICIAL
echo ==============================================================
echo.
echo [Cecilia]: "Genial! Este es mi favorito. Instalaremos el modulo"
echo            "para que hablemos con tus clientes masivamente."
echo.

set /p MASTER_KEY="Ingrese su Clave Maestra de Cliente: "
echo.
echo Validando Clave con MATRIX Server...

set API_URL=http://localhost:3000
curl -s -X POST -H "Content-Type: application/json" -d "{\"key\":\"%MASTER_KEY%\"}" %API_URL%/api/keys/validate > validate_res.json

findstr /i "true" validate_res.json > nul
if %errorlevel% neq 0 (
    echo.
    echo [Cecilia]: "Ups! Acceso denegado. Asegurate de que el Modulo 3"
    echo            "esta contratado en tu plan Diamante."
    del validate_res.json 2>nul
    pause
    exit /b
)

echo.
echo [Cecilia]: "Autorizado. Bajando el motor de comunicacion..."
mkdir "%USERPROFILE%\axyntrax_core" 2>nul

curl -s -o "%USERPROFILE%\axyntrax_core\comunicacion_worker.py" "%API_URL%/api/modules/download?id=mod_3&key=%MASTER_KEY%"

echo.
echo [Cecilia]: "Conectando librerias de WhatsApp y Mailer..."
pip install requests aiohttp python-dotenv beautifulsoup4 -q

echo.
echo [Cecilia]: "Canales configurados y listos para despachar."
start pythonw "%USERPROFILE%\axyntrax_core\comunicacion_worker.py"

echo.
echo ✅ INSTALACION COMPLETADA CON EXITO.
del validate_res.json 2>nul
pause
