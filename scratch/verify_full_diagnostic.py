"""
AXYNTRAX — DIAGNÓSTICO COMPLETO v7.0
Verifica el estado real del sistema actual (no rutas obsoletas).
"""
import os
import sys
import sqlite3
import subprocess
import urllib.request
import json

BASE = r"C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite"
AXIA_CORE = os.path.join(BASE, "axia-core")

def check(label, condition, detail=""):
    status = "[OK]" if condition else "[!!]"
    line = f"  {status} {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    return condition

def section(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")

def url_ok(url, timeout=4):
    try:
        req = urllib.request.urlopen(url, timeout=timeout)
        return req.status == 200
    except:
        return False

def url_json(url, timeout=4):
    try:
        req = urllib.request.urlopen(url, timeout=timeout)
        return json.loads(req.read())
    except:
        return None

print("\n" + "="*50)
print("  DIAGNÓSTICO GLOBAL AXYNTRAX v7.0")
print("  Sistema real — " + __import__('datetime').datetime.now().strftime("%Y-%m-%d %H:%M"))
print("="*50)

# ── 1. Archivos Python críticos ──────────────────────
section("1. Backend Python")
py_files = [
    "axia_api.py", "axia_webhook.py", "axia_logic.py",
    "axia_followup.py", "cecilia_modules.py",
    "db_master/models.py", "db_master/connection.py",
    "suite_diamante/logic/axia/brain.py",
    "suite_diamante/logic/axia/hunter.py",
    "suite_diamante/logic/axia/calendar_master.py",
    "requirements.txt", ".env", "netlify.toml",
]
ok_count = sum(check(f, os.path.exists(os.path.join(BASE, f))) for f in py_files)
print(f"\n  Resultado: {ok_count}/{len(py_files)} archivos OK")

# ── 2. Base de datos ─────────────────────────────────
section("2. Base de Datos SQLite")
db_paths = [
    os.path.join(BASE, "data", "axyntrax.db"),
    r"C:\AXYNTRAX\CRM_Gerencial\data\axyntrax.db",
]
db_found = False
for db_path in db_paths:
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            conn.close()
            check(f"DB: {db_path}", True, f"{len(tables)} tablas: {[t[0] for t in tables[:4]]}")
            db_found = True
        except Exception as e:
            check(f"DB: {db_path}", False, str(e))
if not db_found:
    check("DB local", False, "No encontrada en ninguna ruta")

# ── 3. Frontend React ────────────────────────────────
section("3. Frontend React (axia-core)")
react_files = [
    "src/app/App.jsx", "src/app/ProtectedRoute.jsx",
    "src/modules/dashboard/DashboardPage.jsx",
    "src/modules/axia/AxiaCentralPage.jsx",
    "src/modules/admin/AdminPage.jsx",
    "src/modules/pricing/PricingPage.jsx",
    "src/modules/restaurant/pages/RestaurantDashboard.jsx",
    "package.json", "vite.config.js",
    "dist/index.html",
]
ok_r = sum(check(f, os.path.exists(os.path.join(AXIA_CORE, f))) for f in react_files)
print(f"\n  Resultado: {ok_r}/{len(react_files)} archivos OK")

# ── 4. Variables de entorno ──────────────────────────
section("4. Variables de Entorno (.env)")
env_vars = {}
env_path = os.path.join(BASE, ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env_vars[k.strip()] = v.strip()

critical_env = {
    "WSP_ACCESS_TOKEN":    "WhatsApp — CECILIA no responde sin esto",
    "WSP_PHONE_NUMBER_ID": "WhatsApp — ID del número de negocio",
    "GEMINI_API_KEY":      "IA — AXIA Chat responde con Gemini",
    "EMPRESA_RUC":         "Datos corporativos — para facturas",
}
for k, desc in critical_env.items():
    val = env_vars.get(k, "")
    check(k, bool(val), desc if not val else f"{'*'*8}{val[-4:] if len(val) > 4 else '****'}")

ok_env = {
    "ADMIN_PHONE_NUMBER": "Admin WhatsApp",
    "WH_VERIFY_TOKEN":    "Token webhook",
    "EMAIL_CORPORATIVO":  "Email corporativo",
    "EMPRESA_NOMBRE":     "Nombre empresa",
    "DOMINIO_WEB":        "Dominio web",
}
for k, desc in ok_env.items():
    val = env_vars.get(k, "")
    check(k, bool(val), val if val else f"Falta — {desc}")

# ── 5. Servicios en vivo ─────────────────────────────
section("5. Servicios en vivo (localhost)")
api = url_json("http://localhost:5001/api/health")
check("API REST (5001)", api is not None, 
      f"v{api.get('version','?')} | WSP:{api.get('whatsapp',False)}" if api else "OFFLINE — python axia_api.py")

cecilia = url_json("http://localhost:5000/health")
check("CECILIA Webhook (5000)", cecilia is not None,
      f"Firebase:{cecilia.get('firebase',False)} | WSP:{cecilia.get('whatsapp',False)}" if cecilia else "OFFLINE — python axia_webhook.py")

check("React Dev (5173)", url_ok("http://localhost:5173"), 
      "OK" if url_ok("http://localhost:5173") else "OFFLINE — npm run dev en axia-core")

# ── 6. Producción ────────────────────────────────────
section("6. Producción (axyntrax-automation.com)")
check("axyntrax-automation.com",     url_ok("https://axyntrax-automation.com"),     "HTTP 200")
check("www.axyntrax-automation.com", url_ok("https://www.axyntrax-automation.com"), "HTTP 200")

# ── Resumen final ────────────────────────────────────
print(f"\n{'='*50}")
print("  RESUMEN")
print(f"{'='*50}")

missing_keys = [k for k in critical_env if not env_vars.get(k)]
if missing_keys:
    print(f"\n  [!] ACCION REQUERIDA - Agregar al .env:")
    for k in missing_keys:
        print(f"     -> {k}={critical_env[k]}")
    if "GEMINI_API_KEY" in missing_keys:
        print("     -> Obtener Gemini GRATIS: https://aistudio.google.com")
    if "WSP_ACCESS_TOKEN" in missing_keys:
        print("     -> WhatsApp tokens: https://developers.facebook.com/apps")
else:
    print("\n  [OK] Todas las credenciales configuradas")

if not api:
    print("\n  [!!] API OFFLINE -> ejecuta: python axia_api.py")
if not cecilia:
    print("  [!!] CECILIA OFFLINE -> ejecuta: python axia_webhook.py")

print(f"\n{'='*50}\n")
