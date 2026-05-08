import os
import sys
import customtkinter as ctk
from suite_diamante.logic.axia.security import get_security
from suite_diamante.logic.axia.orchestrator import get_orchestrator
from db_master.models import init_db
from dotenv import load_dotenv

# Cargar variables de entorno al inicio
load_dotenv()

# ID de Hardware Autorizado (Cargado de .env o valor por defecto)
AUTHORIZED_DIAMOND_ID = os.getenv("AUTHORIZED_DIAMOND_ID", "BFEBFBFF000B06A2")

def validate_hardware():
    """
    Bloqueo de Hardware Diamante AXIA.
    Valida la identidad fisica mediante ProcessorId.
    """
    security = get_security()
    is_valid, current_id = security.validate_machine()
    
    if not is_valid:
        print(f"\n[SISTEMA BLOQUEADO] Identidad no reconocida: {current_id}")
        sys.exit(1)
    else:
        print(f"[SEGURIDAD AXIA] Hardware Validado: {current_id}")
    return True

def main():
    print("=== AxyntraX Automation | Suite Diamante v1.0 ===")
    
    # Validar Hardware
    if not validate_hardware():
        print("[ERROR] Acceso Denegado: Hardware no autorizado.")
        sys.exit(1)
        
    # Inicializar Base de Datos Maestra
    init_db()
    
    # Iniciar Orquestador Maestro de AXIA (Autonomia Total)
    orch = get_orchestrator()
    orch.run_morning_cycle()
    orch.start_background_daemon()
    
    # Iniciar Mando por WhatsApp (Listener Asincrono)
    from suite_diamante.logic.wsp_listener import run_listener_async
    run_listener_async()
    
    # Configuracion de apariencia
    ctk.set_appearance_mode("Dark")
    ctk.set_default_color_theme("blue")
    
    # Iniciar Interfaz Diamante
    from suite_diamante.ui.dashboard_diamante import DiamanteDashboard
    app = DiamanteDashboard()
    app.mainloop()
    
    print("[INFO] Suite Diamante finalizada.")

if __name__ == "__main__":
    main()
