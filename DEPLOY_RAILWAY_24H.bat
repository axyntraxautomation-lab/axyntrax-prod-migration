@echo off
chcp 65001 > nul
cls
echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║   AXYNTRAX — DEPLOY BACKEND 24/7 A RAILWAY       ║
echo  ║   Ejecutar UNA SOLA VEZ para activar la nube      ║
echo  ╚═══════════════════════════════════════════════════╝
echo.
echo [1/4] Iniciando sesion en Railway...
echo       Se abrira tu browser. Inicia sesion con Google.
echo       (usa axyntraxautomation@gmail.com)
echo.
railway login
echo.
echo [2/4] Conectando con el proyecto axyntrax...
railway link --project axyntrax 2>nul
echo.
echo [3/4] Subiendo codigo AXIA API a la nube...
railway up
echo.
echo [4/4] Obteniendo URL publica del servidor...
railway domain
echo.
echo ===================================================
echo  AXIA API ya esta corriendo 24/7 en Railway!
echo  Copia la URL de arriba y agrégala al .env:
echo  RAILWAY_API_URL=https://tu-url.up.railway.app
echo ===================================================
echo.
pause
