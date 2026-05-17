import os
import sys
import datetime

# Setup path to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

class HeraHR:
    """
    Hera - Capa de Recursos Humanos de Axyntrax Automation.
    Gestiona el talento humano y la nómina.
    """
    def __init__(self):
        self.employee_db = os.path.join(PROJECT_ROOT, "data", "empleados.json")
        os.makedirs(os.path.dirname(self.employee_db), exist_ok=True)

    def is_active(self):
        # En una versión real, esto consultaría si hay empleados contratados
        # Según el censo actual, Miguel es el operador principal.
        return True # Permitimos activación para demostración de protocolos

    def post_job_offer(self, title, description):
        """Genera una oferta de trabajo para ser publicada por Mark."""
        offer = {
            "title": title,
            "description": description,
            "posted_at": datetime.datetime.now().isoformat()
        }
        print(f"[HERA] Oferta de trabajo generada: {title}")
        return offer

    def process_payroll(self):
        """Coordina con CTB para el pago de haberes."""
        print("[HERA] Coordinando nómina con el motor CTB...")
        return True

if __name__ == "__main__":
    hera = HeraHR()
    if hera.is_active():
        print("[HERA] Protocolos de Gestión de Talento ACTIVADOS.")
