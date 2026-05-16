@echo off
title AXYNTRAX AUTOMATION - Empaquetador de Módulos v4.0
color 0b

:menu
cls
echo ================================================================
echo    AXYNTRAX AUTOMATION - SISTEMA DE EMPAQUETADO .EXE
echo    CEO: Miguel Montero | Arequipa, Peru
echo ================================================================
echo.
echo  SELECCIONE EL MODULO A GENERAR:
echo.
echo  1. WASH  - Carwash Master
echo  2. MED   - Clinica Medica
echo  3. DENT  - Odontologia
echo  4. VET   - Veterinaria
echo  5. LEX   - Estudio Juridico
echo  6. LOGI  - Logistica
echo  7. REST  - Restaurante
echo  8. GYM   - Gimnasio / Spa
echo  9. TODOS - Generar los 8 modulos
echo  0. SALIR
echo.
set /p opt="Opcion [0-9]: "

if %opt%==1 set MOD=WASH & goto build
if %opt%==2 set MOD=MED & goto build
if %opt%==3 set MOD=DENT & goto build
if %opt%==4 set MOD=VET & goto build
if %opt%==5 set MOD=LEX & goto build
if %opt%==6 set MOD=LOGI & goto build
if %opt%==7 set MOD=REST & goto build
if %opt%==8 set MOD=GYM & goto build
if %opt%==9 goto build_all
if %opt%==0 exit
goto menu

:build
echo.
echo [JARVIS] Generando paquete Axyntrax_%MOD%_Setup.exe...
pyinstaller --noconfirm --onefile --windowed ^
    --name "Axyntrax_%MOD%_Setup" ^
    --icon "assets/logo_axyntrax.ico" ^
    --add-data "assets/logo_axyntrax.png;assets" ^
    --add-data "web/public/dashboards/dashboard_%MOD%.html;dashboards" ^
    --add-data "app/core/licencia.py;core" ^
    --add-data "app/core/branding.py;core" ^
    --add-data "app/core/atlas_remote.py;core" ^
    --add-data "instructivos/Instructivo_Axyntrax_%MOD%_v1.pdf;instructivos" ^
    --hidden-import firebase_admin ^
    --hidden-import tkinterweb ^
    "app/modulos/main_%MOD%.py"

echo.
echo [ATLAS] Empaquetado finalizado con exito en /dist/
pause
goto menu

:build_all
echo [JARVIS] Iniciando generacion masiva de 8 modulos...
for %%M in (WASH MED DENT VET LEX LOGI REST GYM) do (
    echo [ATLAS] Procesando modulo %%M...
    pyinstaller --noconfirm --onefile --windowed --name "Axyntrax_%%M_Setup" --icon "assets/logo_axyntrax.ico" "app/modulos/main_%%M.py"
)
echo [JARVIS] TODOS LOS MODULOS HAN SIDO GENERADOS.
pause
goto menu
