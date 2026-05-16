import threading
import time
import datetime
from suite_diamante.logic.axia.marketing import get_axia_marketing
from suite_diamante.logic.axia.crm import get_crm
from suite_diamante.logic.axia.growth import get_growth
from suite_diamante.logic.axia.calendar_master import get_calendar
from suite_diamante.logic.axia.security import get_security

class AXIAOrchestrator:
    """
    Orquestador Maestro de AXIA.
    Gestiona la ejecución autónoma de todos los sub-agentes en segundo plano.
    """
    def __init__(self):
        self.marketing = get_axia_marketing()
        self.crm = get_crm()
        self.growth = get_growth()
        self.calendar = get_calendar()
        self.security = get_security()
        self.running = False

    def run_morning_cycle(self):
        """Ciclo de tareas de inicio del sistema."""
        print("[AXIA ORCHESTRATOR] Iniciando Ciclo Maestro...")
        
        # 1. Sincronización de Agenda
        self.calendar.sync_google()
        
        # 2. Barrido de Marketing (Campañas del día)
        self.marketing.generate_automated_campaigns()
        
        # 3. Barrido de Fidelización (Cumpleaños/Aniversarios)
        self.crm.run_daily_relationship_sweep()
        
        # 4. Barrido de Crecimiento (Follow-ups 48h)
        self.growth.run_48h_followup()
        
        # 5. Auditoría Interna Sentinel
        self.security.sign_action(0, "ORCHESTRATOR", "SUCCESS", "Ciclo maestro de inicio completado.")
        
        print("[AXIA ORCHESTRATOR] Sistema 100% operativo y sincronizado.")

    def start_background_daemon(self):
        """Lanza el demonio de tareas recurrentes."""
        if self.running: return
        self.running = True
        thread = threading.Thread(target=self._daemon_loop, daemon=True)
        thread.start()

    def _daemon_loop(self):
        """Loop infinito de monitoreo (cada 1 hora)."""
        while self.running:
            try:
                # Tareas recurrentes ligeras
                self.calendar.check_and_notify_reminders()
            except Exception as e:
                print(f"[AXIA DAEMON ERROR] Fallo en ciclo recurrente: {e}")
            
            # Dormir 1 hora
            time.sleep(3600)

def get_orchestrator():
    return AXIAOrchestrator()
