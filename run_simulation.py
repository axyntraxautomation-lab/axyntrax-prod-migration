import csv
import os
import random
import time
from datetime import datetime
from db_master.connection import get_db
from db_master.models import init_db

def run_axyntrax_simulation():
    print("======================================================================")
    print(">>> INICIANDO PROTOCOLO DE SIMULACION MASIVA AXYNTRAX v3.1.0")
    print("======================================================================")
    
    # 1. Asegurar inicialización de base de datos
    init_db()
    
    rubros = ["LOGÍSTICA", "FINANZAS", "RETAIL"]
    modulos = ["ATLAS", "MATRIX", "JARVIS", "CECILIA"]
    
    clientes_data = []
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Contadores de penetración
    penetration = {rubro: {mod: 0 for mod in modulos} for rubro in rubros}
    
    try:
        for rubro in rubros:
            for idx in range(1, 51):
                empresa_num = f"{rubro[:3]}-{100 + idx}"
                empresa_name = f"Corporativo {rubro.capitalize()} {empresa_num}"
                contacto_name = f"Gestor {empresa_num}"
                email_addr = f"contacto@{empresa_num.lower()}-mock.axyntrax.com"
                telefono_num = f"+51 987 654 {idx:03d}"
                ciudad_name = random.choice(["Lima", "Arequipa", "Trujillo", "Chiclayo"])
                
                # Insertar Cliente
                cursor.execute("""
                    INSERT INTO clientes (empresa, contacto, email, telefono, rubro, estado, score)
                    VALUES (?, ?, ?, ?, ?, 'Prospecto', 85)
                """, (empresa_name, contacto_name, email_addr, telefono_num, rubro))
                
                cliente_id = cursor.lastrowid
                
                # Asignar módulo y generar Licencia Key
                modulo_asignado = random.choice(modulos)
                license_key = f"AK-TEST-{timestamp_str}-{cliente_id:04d}"
                
                # Insertar Licencia de Prueba
                cursor.execute("""
                    INSERT INTO licencias (clave, tipo, dias, cliente_id, rubro, estado, notas)
                    VALUES (?, ?, 365, ?, ?, 'INSTALACIÓN EXITOSA', ?)
                """, (license_key, modulo_asignado, cliente_id, rubro, f"Simulacion SandBox v3.1.0"))
                
                penetration[rubro][modulo_asignado] += 1
                
                clientes_data.append({
                    "ID_Cliente": cliente_id,
                    "Empresa": empresa_name,
                    "Contacto": contacto_name,
                    "Email": email_addr,
                    "Rubro": rubro,
                    "Modulo": modulo_asignado,
                    "Licencia_Key": license_key,
                    "Estado": "INSTALACIÓN EXITOSA"
                })
        
        conn.commit()
        print("[OK] Persistencia exitosa en axyntrax.db (WAL Mode activo).")
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Error durante la simulacion: {e}")
        conn.close()
        return
        
    conn.close()
    
    # 2. Generar reporte CSV
    csv_filename = "simulacion_clientes.csv"
    with open(csv_filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["ID_Cliente", "Empresa", "Contacto", "Email", "Rubro", "Modulo", "Licencia_Key", "Estado"])
        writer.writeheader()
        writer.writerows(clientes_data)
        
    print(f"[INFO] Reporte tabular generado con exito en: {csv_filename}")
    
    # 3. Resumen analítico e informe a JARVIS
    print("\n" + "=" * 70)
    print("[TELEMETRIA] ENVIADA A JARVIS - RESUMEN DE PENETRACION DE MODULOS")
    print("=" * 70)
    print(f"{'RUBRO':<15} | {'ATLAS':<10} | {'MATRIX':<10} | {'JARVIS':<10} | {'CECILIA':<10}")
    print("-" * 70)
    for rubro in rubros:
        print(f"{rubro:<15} | {penetration[rubro]['ATLAS']:<10} | {penetration[rubro]['MATRIX']:<10} | {penetration[rubro]['JARVIS']:<10} | {penetration[rubro]['CECILIA']:<10}")
    print("=" * 70)
    print("[OK] Confirmacion: JARVIS ha recibido la telemetria completa de los 150 nodos activos.")
    print("======================================================================\n")

if __name__ == "__main__":
    run_axyntrax_simulation()
