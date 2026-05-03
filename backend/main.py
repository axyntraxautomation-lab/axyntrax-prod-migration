import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

# ── Apagar Swagger/Redoc en producción ──────────────────────────────────────
IS_PROD = os.getenv("ENVIRONMENT") == "production"
app = FastAPI(
    title="AXYNTRAX Antigravity",
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
)

# ── 1. Montar archivos estáticos ─────────────────────────────────────────────
STATIC_DIR = "frontend/static"
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── 2. Middleware: redirección WWW (solo en producción) ──────────────────────
@app.middleware("http")
async def redirect_to_www(request: Request, call_next):
    if os.getenv("ENVIRONMENT") == "production":
        host = request.headers.get("host", "")
        if host in ("axyntrax-automation.net", "axyntrax-automation.net:443"):
            url = f"https://www.axyntrax-automation.net{request.url.path}"
            return RedirectResponse(url=url, status_code=301)
    return await call_next(request)

# ── 3. Rutas de frontend ─────────────────────────────────────────────────────

# Landing pública
@app.get("/", response_class=HTMLResponse)
async def serve_landing():
    path = "frontend/landing/index.html"
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Landing page no encontrada")

# Dashboard J.A.R.V.I.S (protección JWT debe hacerse desde el frontend o
# en el endpoint /api/auth — el HTML se sirve siempre, el JS verifica el token)
@app.get("/jarvis", response_class=HTMLResponse)
async def serve_jarvis():
    path = "frontend/jarvis/index.html"
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Dashboard JARVIS no encontrado")

# ── 4. API endpoints ─────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "system": "AXYNTRAX Antigravity",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }

# Aquí agregar más rutas: /api/auth, /api/leads, /api/clientes, etc.
