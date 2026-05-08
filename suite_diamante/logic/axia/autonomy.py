import datetime
from db_master.connection import get_db

class AXIAAutonomy:
    """
    Gestor de Autonomía AXIA.
    Decide el nivel de intervención basado en el riesgo de la operación.
    """
    def __init__(self):
        self.risk_threshold = 7 # Escala 1-10

    def evaluate_risk(self, action_type, impact):
        """Evalúa si AXIA puede actuar sola o requiere aprobación de Miguel."""
        score = impact
        if "DINERO" in action_type: score += 5
        if "BORRAR" in action_type: score += 10
        
        return "APROBACION_REQUERIDA" if score > self.risk_threshold else "AUTONOMO"

def get_autonomy():
    return AXIAAutonomy()
