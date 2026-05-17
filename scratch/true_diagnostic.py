import os
import sys
import json
import requests
import datetime

PROJECT_ROOT = r"C:\Users\YARVIS\.gemini\antigravity\scratch\AXYNTRAX_AUTOMATION_Suite"
HOME_ROOT = os.path.join(PROJECT_ROOT, "axyntrax-home")

def check_file_content(path, search_str):
    if not os.path.exists(path):
        return False, "Archivo no encontrado"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        if search_str in content:
            return True, "Encontrado"
    return False, "No encontrado"

print(f"--- DIAGNÓSTICO DE VERDAD AXYNTRAX ({datetime.datetime.now()}) ---")

# 1. Verificar Precios y CTAs en Frontend
print("\n[FRONTEND]")
files_to_check = [
    (os.path.join(HOME_ROOT, "app", "page.tsx"), "SOLICITAR ACTIVACIÓN"),
    (os.path.join(HOME_ROOT, "lib", "modules-data.ts"), "price: 235"),
    (os.path.join(HOME_ROOT, "components", "FAQSection.tsx"), "S/ 235"),
    (os.path.join(HOME_ROOT, "lib", "cecilia-logic.ts"), "Estoy revisando tu consulta ahora mismo"),
]

for path, search in files_to_check:
    ok, msg = check_file_content(path, search)
    status = "[OK]" if ok else "[FAIL]"
    print(f"{status} {os.path.basename(path)}: {search} -> {msg}")

# 2. Verificar Backend
print("\n[BACKEND]")
backend_files = [
    (os.path.join(PROJECT_ROOT, "axia_logic.py"), "Plan Base S/ 235"),
    (os.path.join(PROJECT_ROOT, "cecilia", "axia_webhook_v2.py"), "S/ 235"),
    (os.path.join(PROJECT_ROOT, "cecilia", "axia_api_unificada.py"), "deepseek-chat"),
]

for path, search in backend_files:
    ok, msg = check_file_content(path, search)
    status = "[OK]" if ok else "[FAIL]"
    print(f"{status} {os.path.basename(path)}: {search} -> {msg}")

# 3. Verificar Servicios (Simulado si no están corriendo)
print("\n[SERVICIOS]")
try:
    r = requests.get("http://localhost:5001/api/health", timeout=2)
    print(f"[OK] API 5001: {r.status_code}")
except:
    print("[OFFLINE] API 5001")

try:
    r = requests.get("http://localhost:5000/api/stats", timeout=2)
    print(f"[OK] Webhook 5000: {r.status_code}")
except:
    print("[OFFLINE] Webhook 5000")

print("\n--- FIN DEL DIAGNÓSTICO ---")
