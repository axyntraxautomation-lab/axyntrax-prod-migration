import time
import random
import uuid
import sys

def log_header(title):
    print("\n" + "="*70)
    print(f" {title.center(68)}")
    print("="*70)

def log_action(module, action, status="INFO"):
    timestamp = time.strftime('%H:%M:%S')
    color_status = f"[{status}]"
    print(f"[{timestamp}] {color_status:<8} [{module:<12}] {action}")
    sys.stdout.flush()

def run_simulation():
    # --- ETAPA 1: COMERCIAL ---
    log_header("ETAPA 1: SOLICITUD COMERCIAL")
    client_name = "Corporación Alfa S.A."
    log_action("SALES", f"Nuevo Lead detectado: {client_name}")
    time.sleep(0.8)
    log_action("SALES", "Interés: Suite Completa Diamante (13 módulos + IA)")
    log_action("SALES", "Estado: Venta Cerrada - Pendiente de Alta")

    # --- ETAPA 2: JARVIS ORCHESTRATOR ---
    log_header("ETAPA 2: REGISTRO EN JARVIS")
    tenant_id = str(uuid.uuid4())[:8].upper()
    log_action("JARVIS", f"Creando espacio para Tenant: {tenant_id}")
    time.sleep(1)
    log_action("JARVIS", f"Configurando parámetros de {client_name}...")
    log_action("JARVIS", "Registro completado en DB Axyntrax.")

    # --- ETAPA 3: MATRIX KEYGEN ---
    log_header("ETAPA 3: EMISIÓN DE LICENCIA (MATRIX)")
    license_key = f"AX-FUL-{time.strftime('%Y%m%d')}-{random.randint(1000,9999)}-DIAMANTE"
    log_action("MATRIX", f"Generando Clave Alfa para {client_name}...")
    time.sleep(1.2)
    log_action("MATRIX", f"CLAVE GENERADA: {license_key}")
    log_action("MATRIX", "Licencia enviada al correo del administrador.")

    # --- ETAPA 4: ACTIVACIÓN Y PROVISIONING ---
    log_header("ETAPA 4: ACTIVACIÓN DE MÓDULOS")
    modules = ["Cecilia Web", "Cecilia WSP", "Cecilia FB", "Cecilia IG", "Cecilia LI", "MARK Agent", "TECH Agent"]
    
    for mod in modules:
        log_action(mod, "Recibiendo token de activación...")
        time.sleep(0.4)
        log_action(mod, "Provisioning Neural Core V4 Flash...")
        time.sleep(0.4)
        log_action(mod, "Estado: ONLINE [OK]")
    
    # --- ETAPA 5: OPERACIÓN Y AUDITORÍA ---
    log_header("ETAPA 5: OPERACIÓN REAL Y AUDITORÍA")
    for i in range(1, 4):
        print(f"\n--- Ráfaga de Tráfico {i} ---")
        for mod in modules:
            reqs = random.randint(20, 60)
            latency = random.randint(850, 1600)
            if mod == "TECH Agent" and i == 2:
                log_action(mod, "BLOQUEO: Rate Limit alcanzado (45/min). Aislamiento preventivo activo.", "WARN")
            elif mod == "Cecilia LI" and i == 3:
                log_action(mod, "LATENCIA: Detectado retardo en LinkedIn. Modo Draft habilitado.", "WARN")
            else:
                log_action(mod, f"Atendiendo {reqs} clientes | Latencia: {latency}ms")
        time.sleep(1)

    # --- REPORTE FINAL ---
    log_header("REPORTE OPERATIVO FINAL")
    print(f"CLIENTE:          {client_name}")
    print(f"TENANT ID:        {tenant_id}")
    print(f"LICENCIA:         {license_key}")
    print(f"MÓDULOS ACTIVOS:  {len(modules)}/7")
    print(f"ESTADO GLOBAL:    97.2% OPERATIVO")
    print(f"INCIDENCIAS:      2 (Controladas por Circuit Breaker)")
    print("RECOMENDACIÓN:    Proceder con escalado de cuota en DeepSeek.")
    print("="*70)

if __name__ == "__main__":
    run_simulation()
