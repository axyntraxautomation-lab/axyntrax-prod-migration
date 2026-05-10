@echo off
title AXYNTRAX - Modulo 2: Generacion de Reportes
color 0A
echo ==============================================================
echo        AXYNTRAX AUTOMATION SUITE - INSTALADOR OFICIAL
echo ==============================================================
echo.
echo [Cecilia]: "Hola! Vamos a configurar tu generador automatico"
echo            "de reportes financieros y operacionales (ATLAS)."
echo.

set /p MASTER_KEY="Ingrese su Clave Maestra de Cliente: "
echo.
echo Validando Clave con MATRIX Server...

set API_URL=http://localhost:3000
curl -s -X POST -H "Content-Type: application/json" -d "{\"key\":\"%MASTER_KEY%\"}" %API_URL%/api/keys/validate > validate_res.json

findstr /i "true" validate_res.json > nul
if %errorlevel% neq 0 (
    echo.
    echo [Cecilia]: "No he podido verificar la licencia. Por favor"
    echo            "revisa tu clave JARVIS e intenta de nuevo."
    del validate_res.json 2>nul
    pause
    exit /b
)

echo.
echo [Cecilia]: "Licencia validada correctamente. Descargando modulo..."
mkdir "%USERPROFILE%\axyntrax_core" 2>nul

curl -s -o "%USERPROFILE%\axyntrax_core\reportes_worker.py" "%API_URL%/api/modules/download?id=mod_2&key=%MASTER_KEY%"

echo.
echo [Cecilia]: "Preparando entorno para generacion de PDFs y Excel..."
pip install requests pandas openpyxl reportlab -q

echo.
echo [Cecilia]: "El modulo de Reportes quedara activo para envios semanales."
start pythonw "%USERPROFILE%\axyntrax_core\reportes_worker.py"

echo.
echo ✅ INSTALACION COMPLETADA CON EXITO.
del validate_res.json 2>nul
pause
