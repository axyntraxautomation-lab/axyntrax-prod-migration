import sqlite3
import requests
import json

print("=== 1. TABLAS Y CONTEO DE REGISTROS ===")
conn = sqlite3.connect('data/axyntrax.db')
c = conn.cursor()
tablas = c.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
for t in tablas:
    count = c.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0]
    print(f"{t[0]}: {count} registros")

print("\n=== 2. LICENCIAS RECIENTES EN LICENCIAS ===")
try:
    rows = c.execute("SELECT clave, tipo, dias, fecha_fin FROM licencias ORDER BY id DESC LIMIT 5;").fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print("Error consultando licencias:", e)

conn.close()

print("\n=== 3. INBOX DE JARVIS ===")
try:
    res = requests.get("http://localhost:5001/api/jarvis/inbox", timeout=5)
    if res.status_code == 200:
        data = res.json()
        print(f"Total notificaciones en inbox: {data.get('count', 0)}")
        print("Últimas 5 notificaciones:")
        for item in data.get("inbox", [])[-5:]:
            print(f"[{item.get('timestamp')}] {item.get('origen')} -> {item.get('tipo')}: {item.get('mensaje')}")
    else:
        print("Error HTTP Jarvis:", res.status_code)
except Exception as e:
    print("Error consultando Jarvis:", e)
