"""
AXYNTRAX JARVIS ORCHESTRATOR v3.2.0 (CEO / Orquestador Maestro)
Inicia, monitorea y coordina todos los servicios activos del ecosistema:
- CECILIA (axia_webhook_v2.py) en Puerto 5000
- API AXIA (axia_api_unificada.py) en Puerto 5001
- ATLAS & MATRIX (Integrados en axia_api_unificada.py)
"""
import os
import sys
import subprocess
import time
import threading
import datetime

# Forzar codificación UTF-8 en Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except: pass

JARVIS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(JARVIS_DIR)
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

ORCHESTRATOR_LOG = os.path.join(LOG_DIR, "orchestrator.log")

def write_log(message: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] [JARVIS CEO] {message}\n"
    print(formatted.strip())
    with open(ORCHESTRATOR_LOG, "a", encoding="utf-8") as f:
        f.write(formatted)

class JarvisOrchestrator:
    def __init__(self):
        self.processes = {}
        self.running = False

    def start_service(self, name: str, command: list, log_file: str, cwd: str = PROJECT_ROOT):
        write_log(f"Iniciando servicio: {name}...")
        log_path = os.path.join(LOG_DIR, log_file)
        
        # Preparar entorno con PYTHONPATH
        env = os.environ.copy()
        current_pythonpath = env.get("PYTHONPATH", "")
        if PROJECT_ROOT not in current_pythonpath:
            env["PYTHONPATH"] = f"{PROJECT_ROOT}{os.pathsep}{current_pythonpath}"
            
        try:
            with open(log_path, "a", encoding="utf-8") as log_f:
                p = subprocess.Popen(
                    command,
                    cwd=cwd,
                    stdout=log_f,
                    stderr=subprocess.STDOUT,
                    shell=True,
                    env=env
                )
            self.processes[name] = p
            write_log(f"Servicio {name} iniciado exitosamente (PID: {p.pid}).")
        except Exception as e:
            write_log(f"ERROR al iniciar servicio {name}: {e}")

    def monitor_loop(self):
        write_log("Monitoreo de procesos iniciado.")
        while self.running:
            for name, p in list(self.processes.items()):
                poll = p.poll()
                if poll is not None:
                    write_log(f"¡ADVERTENCIA! El servicio {name} se ha detenido con código {poll}. Reiniciando...")
                    # Reiniciar el servicio
                    if name == "CECILIA":
                        self.start_service("CECILIA", [sys.executable, os.path.join("cecilia", "axia_webhook_v2.py")], "backend_webhook.log")
                    elif name == "API AXIA":
                        self.start_service("API AXIA", [sys.executable, os.path.join("cecilia", "axia_api_unificada.py")], "backend_api.log")
                    elif name == "ATLAS_REPAIR":
                        self.start_service("ATLAS_REPAIR", [sys.executable, os.path.join("atlas", "atlas_repair.py")], "atlas_healing.log")
                    elif name == "MARK":
                        self.start_service("MARK", ["node", "mark_agent.js"], "mark_agent.log")
            
            # Sincronización Google (Gmail/Calendar) cada 60 segundos
            # (Omitido para brevedad en el loop si no es crítico, pero mantenemos la estructura)
            time.sleep(10)

    def start(self):
        write_log("==========================================")
        write_log("   AXYNTRAX AUTOMATION SUITE - JARVIS CEO  ")
        write_log("==========================================")
        self.running = True

        # Inicializar base de datos
        write_log("Iniciando verificación de base de datos...")
        try:
            # Añadir PROJECT_ROOT al sys.path para encontrar db_master
            if PROJECT_ROOT not in sys.path:
                sys.path.append(PROJECT_ROOT)
            from db_master.models import init_db
            init_db()
            write_log("Base de datos lista.")
        except Exception as e:
            write_log(f"ERROR al inicializar base de datos: {e}")

        # Iniciar API REST Unificada (Puerto 5001)
        self.start_service("API AXIA", [sys.executable, os.path.join("cecilia", "axia_api_unificada.py")], "backend_api.log")

        # Iniciar Webhook Cecilia (Puerto 5000)
        self.start_service("CECILIA", [sys.executable, os.path.join("cecilia", "axia_webhook_v2.py")], "backend_webhook.log")

        # Iniciar Sistema de Autoreparación ATLAS
        self.start_service("ATLAS_REPAIR", [sys.executable, os.path.join("atlas", "atlas_repair.py")], "atlas_healing.log")

        # Iniciar Agente MARK (Marketing Autónomo)
        self.start_service("MARK", ["node", "mark_agent.js"], "mark_agent.log")

        # Iniciar monitoreo en segundo plano
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()

        # Ciclo principal del orquestador (Keep Alive)
        write_log("JARVIS CEO operando al 100% en modo centinela de alta disponibilidad.")
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        write_log("Deteniendo todos los servicios de forma segura...")
        self.running = False
        for name, p in self.processes.items():
            try:
                p.terminate()
                write_log(f"Servicio {name} terminado de forma segura.")
            except Exception as e:
                write_log(f"Error al detener {name}: {e}")
        write_log("JARVIS CEO fuera de línea de manera segura.")

if __name__ == "__main__":
    orchestrator = JarvisOrchestrator()
    orchestrator.start()
