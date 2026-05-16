@echo off
title GENERADOR DE INSTALADOR - CECILIA MASTER CARWASH
color 0e

echo ======================================================
echo   GENERANDO INSTALADOR .EXE PARA CARWASH (LOCAL)
echo ======================================================
echo.
echo [1/4] Configurando Rubro: CARWASH...
python configurar_carwash.py

echo [2/4] Compilando Web Core (Next.js + Electron)...
cd web
npm run build

echo [3/4] Generando Ejecutable Local (.EXE)...
echo Usando electron-builder para generar Cecilia_Carwash_Setup.exe...
npm run electron:build:carwash

echo [4/4] Finalizando interconexion local...
echo Configurando base de datos SQLite persistente...
copy ..\axyntrax.db dist\win-unpacked\resources\axyntrax.db

echo.
echo ======================================================
echo   ¡ÉXITO! El instalador se encuentra en:
echo   web\dist\Cecilia_Carwash_Setup.exe
echo ======================================================
echo.
pause
