import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(docs_url=None, redoc_url=None) # Desactivado en producción

# 1. Servir archivos estáticos (CSS, JS, Imágenes)
# Asegúrate de que esta carpeta exista
if not os.path.exists("frontend/static"):
    os.makedirs("frontend/static", exist_ok=True)

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# 2. Middleware de redirección WWW (Solo en Producción)
@app.middleware("http")
async def redirect_to_www(request: Request, call_next):
    host = request.headers.get("host", "")
    # Redirigir de axyntrax-automation.net a www.axyntrax-automation.net
    if os.getenv("ENVIRONMENT") == "production" and host == "axyntrax-automation.net":
        return RedirectResponse(
            url=f"https://www.axyntrax-automation.net{request.url.path}", 
            status_code=301
        )
    return await call_next(request)

# 3. Rutas de Frontend (Sirviendo archivos HTML)
@app.get("/")
async def serve_landing():
    path = "frontend/landing/index.html"
    if os.path.exists(path):
        return FileResponse(path)
    return {"message": "Landing page no encontrada. Sube tus archivos a frontend/landing/"}

@app.get("/jarvis")
async def serve_jarvis():
    path = "frontend/jarvis/index.html"
    if os.path.exists(path):
        return FileResponse(path)
    return {"message": "Dashboard J.A.R.V.I.S no encontrado. Sube tus archivos a frontend/jarvis/"}

# 4. Ejemplo de API básica
@app.get("/api/health")
async def health_check():
    return {"status": "online", "system": "AXYNTRAX Antigravity"}
