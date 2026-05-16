import requests
import time
import logging
import os
import subprocess
import sys

# Setup path to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

# Configuration
API_URL = "http://localhost:5001"
WEBHOOK_URL = "http://localhost:5000"
HEALTH_CHECK_INTERVAL = 30  # seconds

# Logging
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "atlas_self_healing.log"),
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] ATLAS: %(message)s'
)

def notify_jarvis(msg, level="WARN"):
    try:
        payload = {
            "origen": "ATLAS_SELF_HEALING",
            "tipo": "INCIDENCIA",
            "mensaje": msg,
            "prioridad": 2 if level == "WARN" else 1
        }
        requests.post(f"{API_URL}/api/jarvis/notificar", json=payload, timeout=5)
    except Exception:
        pass # If Jarvis API is down, we can't notify

def check_service(name, url):
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return True
        logging.warning(f"Health check failed for {name}: HTTP {resp.status_code}")
        return False
    except requests.RequestException as e:
        logging.error(f"Service {name} is unreachable: {e}")
        return False

def restart_system():
    """Restarts services by triggering the starter script or handling process directly."""
    logging.info("Initiating System Self-Repair Routine...")
    notify_jarvis("Sistema inestable detectado. Iniciando autoreparación automática.", level="CRITICO")
    
    # Option 1: Use AXIA_MAESTRO or INICIAR_SISTEMA bat
    starter = os.path.join(PROJECT_ROOT, "INICIAR_SISTEMA.bat")
    if os.path.exists(starter):
        subprocess.Popen([starter], shell=True, cwd=PROJECT_ROOT)
        logging.info("Executed recovery launcher INICIAR_SISTEMA.bat")
    else:
        logging.error("Recovery launcher not found!")

def run_healing_loop():
    logging.info("Atlas Self-Healing System ACTIVE.")
    print("[ATLAS] Sistema de Auto-Reparación Iniciado y Escuchando.")
    
    while True:
        api_ok = check_service("AXIA API", f"{API_URL}/api/health")
        webhook_ok = check_service("CECILIA WEBHOOK", f"{WEBHOOK_URL}/health")
        # Chequeo Portal Web (Vercel/Local fallback)
        portal_ok = check_service("WEB PORTAL", "https://axyntrax-automation.net")
        
        if not api_ok or not webhook_ok or not portal_ok:
            msg = f"Falla detectada -> API: {api_ok}, Webhook: {webhook_ok}, Portal: {portal_ok}"
            logging.critical(msg)
            notify_jarvis(msg, "CRITICO")
            # Solo reinicio local si las APIs locales fallan
            if not api_ok or not webhook_ok:
                restart_system()
            
            # Wait extra time for system recovery attempts
            time.sleep(120) 
        
        time.sleep(HEALTH_CHECK_INTERVAL)

if __name__ == "__main__":
    run_healing_loop()
