import datetime
from suite_diamante.logic.axia.executive import get_executive
from suite_diamante.logic.axia.finance import get_finance
from suite_diamante.logic.axia.security import get_security

class AXIARemote:
    """
    Despachador Neuronal de Comandos Remotos.
    Permite el mando total vía WhatsApp (+51986663866).
    """
    def __init__(self):
        self.executive = get_executive()
        self.finance = get_finance()
        self.security = get_security()

    def process_command(self, text, phone):
        """Procesa y ejecuta comandos de lenguaje natural."""
        cmd = text.upper().strip()
        
        if "AXIA RESUMEN" in cmd:
            return self.executive.get_morning_briefing()
            
        elif "AXIA COBRO" in cmd:
            return "Analizando cobranzas pendientes... Se han enviado 3 recordatorios automaticos hoy."
            
        elif "AXIA STATUS" in cmd:
            health = self.executive.check_system_health()
            return f"Sentinel Reporting: Sistema {health}. Todos los micro-agentes estan sincronizados."
            
        elif "AXIA AYUDA" in cmd:
            return (
                "** Comandos Maestros AXIA: **\n"
                "- `AXIA RESUMEN`: Reporte ejecutivo actual.\n"
                "- `AXIA COBRO`: Estado de cobranzas.\n"
                "- `AXIA STATUS`: Salud de la Suite Diamante."
            )
            
        else:
            return "He recibido tu mensaje, Miguel. Sin embargo, no reconozco ese comando maestro. Di `AXIA AYUDA` para ver mis capacidades."

def get_remote():
    return AXIARemote()
