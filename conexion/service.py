import os
import sys
import time
import asyncio
import logging
import requests

# Configurar logging
log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "conexion.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logging.info("[CONEXION] Iniciando Ingeniero de Interconexión Autónomo...")

ENDPOINTS = {
    "cecilia_webhook": "http://localhost:5000/api/stats",
    "api_unificada": "http://localhost:5001/api/health"
}

async def check_endpoint(name: str, url: str):
    try:
        start = time.time()
        resp = requests.get(url, timeout=5)
        latency = (time.time() - start) * 1000
        if resp.status_code == 200:
            logging.info(f"[HEALTH CHECK] {name} está ONLINE (Latencia: {latency:.1f}ms)")
        else:
            logging.warning(f"[HEALTH CHECK] {name} devolvió código {resp.status_code}")
    except Exception as e:
        logging.error(f"[HEALTH CHECK] {name} está OFFLINE - Error: {e}")

async def main_loop():
    while True:
        logging.info("[CONEXION] Ejecutando latido de comprobación periódica...")
        tasks = [check_endpoint(name, url) for name, url in ENDPOINTS.items()]
        await asyncio.gather(*tasks)
        await asyncio.sleep(15)

if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        logging.info("[CONEXION] Deteniendo Ingeniero de Interconexión...")
