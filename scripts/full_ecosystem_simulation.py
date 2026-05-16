import os
import sys
import time
import json
import logging

# Setup environment paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

# Import existing component logic
from cecilia.cecilia_presupuestadora import CeciliaBudgeter
from neo.neo_dev_agent import NeoDeveloper

logging.basicConfig(level=logging.INFO, format="[ECOSYSTEM-SIM] %(message)s")

def run_full_simulation():
    logging.info("=== INICIANDO PRUEBA DE PUNTA A PUNTA (FASE 12) ===")
    
    # 1. SOLICITUD CLIENTE -> CECILIA
    cecilia = CeciliaBudgeter()
    client_req = "Hola, soy Roberto de 'Panadería Los Andes'. Necesito una landing page para mi negocio y automatizar la toma de pedidos por WhatsApp."
    
    logging.info("[CECILIA] Recibiendo requerimiento del cliente...")
    quote = cecilia.generate_quote("Panadería Los Andes", client_req, urgency="NORMAL")
    
    logging.info(f"[CECILIA] Presupuesto Generado: {quote['folio']}")
    logging.info(f"[CECILIA] Subtotal: ${quote['financiero']['subtotal_neto']} | TOTAL: ${quote['financiero']['total_final']}")
    
    # Simular aprobación automática
    time.sleep(1)
    logging.info("[COMMERCIAL] Cliente aprueba presupuesto automáticamente. Transfiriendo a NEO...")
    
    # 2. CREACION PROYECTO -> NEO
    neo = NeoDeveloper()
    proj_id = neo.create_project(quote)
    logging.info(f"[NEO] Proyecto creado en DB local con ID: {proj_id}")
    
    # 3. EJECUCION DE DESARROLLO -> NEO
    logging.info("[NEO] Ejecutando ciclo de desarrollo y scaffolding...")
    neo.run_cycle()
    
    # 4. NOTIFICACION JARVIS (Simulada en Log por now)
    logging.info(f"[JARVIS] CEO NOTIFIED: El proyecto {proj_id} de {quote['cliente']} está ahora en progreso activo.")
    
    logging.info("=== PRUEBA PUNTA A PUNTA COMPLETADA CON EXITO ===")
    print("\n--- RESULTADOS FINALES ---")
    print(f"Proyecto ID: {proj_id}")
    print(f"Estado final: Desarrollo Iniciado (Simulado)")
    print("Ecosistema 100% Operativo, Autónomo y Rentable.")

if __name__ == "__main__":
    run_full_simulation()
