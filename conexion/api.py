import os
import time
import asyncio
import httpx
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Axyntrax Conexion API",
    description="API del Ingeniero de Interconexión Autónomo de Axyntrax.",
    version="1.0.0"
)

class DiagResponse(BaseModel):
    status: str
    uptime_seconds: float
    services: dict
    latencies_ms: dict

start_time = time.time()

# ── AXIA Sentinel: ping real a servicios ─────────────────────────────────────
AUTH = {"X-Auth-Token": "_GP-vgqxgdXJSFjSMwG6khKW-g9awH16clHMtXvsE8c"}
_last_health: dict = {}  # cache — poblado por GET /health, leído por GET /metrics

async def ping_servicio(url: str, method: str = "GET", headers: dict = None, timeout: float = 3.0) -> dict:
    t0 = time.perf_counter()
    try:
        async with httpx.AsyncClient() as client:
            if method == "HEAD":
                r = await client.head(url, timeout=timeout)
            else:
                r = await client.get(url, headers=headers or {}, timeout=timeout)
        latencia = round((time.perf_counter() - t0) * 1000, 1)
        ok = r.status_code < 500
        return {"status": "ok" if ok else "degradado", "latencia_ms": latencia, "http": r.status_code}
    except Exception as e:
        latencia = round((time.perf_counter() - t0) * 1000, 1)
        return {"status": "offline", "latencia_ms": latencia, "error": str(e)[:60]}

@app.get("/health")
async def health():
    cecilia, jarvis, atlas, wsp, fb = await asyncio.gather(
        ping_servicio("http://localhost:5000/api/stats"),
        ping_servicio("http://localhost:5001/api/health"),
        ping_servicio("http://localhost:5001/api/atlas/kpis"),
        ping_servicio("https://graph.facebook.com/v19.0/", method="HEAD"),
        ping_servicio("https://graph.facebook.com/", method="HEAD"),
    )
    services = {
        "cecilia":  cecilia,
        "jarvis":   jarvis,
        "atlas":    atlas,
        "whatsapp": wsp,
        "facebook": fb,
    }
    global_status = "ok" if all(s["status"] == "ok" for s in services.values()) else "degradado"
    # ── Poblar cache para /metrics ────────────────────────────────────────────
    global _last_health
    _last_health = {
        "services": services,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    return {
        "status": global_status,
        "services": services,
        "timestamp": _last_health["checked_at"]
    }

@app.get("/conexion/diag", response_model=DiagResponse)
async def diag():
    cecilia, jarvis, atlas, wsp, fb = await asyncio.gather(
        ping_servicio("http://localhost:5000/api/stats"),
        ping_servicio("http://localhost:5001/api/health"),
        ping_servicio("http://localhost:5001/api/atlas/kpis"),
        ping_servicio("https://graph.facebook.com/v19.0/", method="HEAD"),
        ping_servicio("https://graph.facebook.com/", method="HEAD"),
    )
    services = {
        "cecilia":  cecilia["status"],
        "jarvis":   jarvis["status"],
        "atlas":    atlas["status"],
        "whatsapp": wsp["status"],
        "facebook": fb["status"],
    }
    latencies_ms = {
        "cecilia_ms":  cecilia.get("latencia_ms", 0.0),
        "jarvis_ms":   jarvis.get("latencia_ms", 0.0),
        "atlas_ms":    atlas.get("latencia_ms", 0.0),
        "whatsapp_ms": wsp.get("latencia_ms", 0.0),
        "facebook_ms": fb.get("latencia_ms", 0.0),
    }
    all_ok = all(v == "ok" for v in services.values())
    return DiagResponse(
        status="operational" if all_ok else "degradado",
        uptime_seconds=round(time.time() - start_time, 2),
        services=services,
        latencies_ms=latencies_ms
    )

@app.get("/metrics")
def metrics():
    services = _last_health.get("services", {})
    if not services:
        return {
            "aviso": "sin_datos — llama primero a GET /health",
            "total_servicios": 0,
            "servicios_ok": 0,
            "servicios_degradado": 0,
            "servicios_offline": 0,
            "error_rate": 0.0,
            "latencia_promedio_ms": 0.0,
            "failures_count": 0,
            "last_check": None
        }
    total      = len(services)
    ok_count   = sum(1 for s in services.values() if s["status"] == "ok")
    deg_count  = sum(1 for s in services.values() if s["status"] == "degradado")
    off_count  = sum(1 for s in services.values() if s["status"] == "offline")
    latencias  = [s["latencia_ms"] for s in services.values() if "latencia_ms" in s]
    lat_prom   = round(sum(latencias) / len(latencias), 1) if latencias else 0.0
    error_rate = round((total - ok_count) / total * 100, 1) if total else 0.0
    return {
        "total_servicios":    total,
        "servicios_ok":       ok_count,
        "servicios_degradado": deg_count,
        "servicios_offline":  off_count,
        "error_rate":         error_rate,
        "latencia_promedio_ms": lat_prom,
        "failures_count":     off_count + deg_count,
        "last_check":         _last_health.get("checked_at")
    }
