import sys
import os
sys.path.insert(0, '.')

import sqlite3
import hashlib
from db_master.connection import get_db

def check_integrity():
    print("[ATLAS CHECKER] Iniciando verificación periódica de integridad...")
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Consultar la cadena completa de bot_audit
        cursor.execute("""
            SELECT id, bot_id, action_type, result, details, hash_signature
            FROM bot_audit
            ORDER BY id ASC
        """)
        rows = cursor.fetchall()
        
        if not rows:
            print("[ATLAS CHECKER] Base de datos vacía o sin registros de auditoría. OK.")
            conn.close()
            sys.exit(0)
            
        current_prev_hash = "GENESIS_AXIA_DIAMANTE"
        
        for row in rows:
            r_id, b_id, act, res, det, h_sig = row
            
            # Re-calcular hash esperado exactamente como lo hace DiamondSecurity
            expected_payload = f"{b_id}{act}{res}{det}{current_prev_hash}"
            expected_hash = hashlib.sha256(expected_payload.encode()).hexdigest()
            
            if h_sig != expected_hash:
                print(f"[FAIL_CHAIN] Anomalía de integridad detectada en el Log ID: {r_id}")
                print(f"  Detalle actual: '{det}'")
                print(f"  Hash guardado:  {h_sig}")
                print(f"  Hash esperado:  {expected_hash}")
                
                # Disparar alertas (ej. Email, Slack, PagerDuty o registro interno crítico)
                # Aquí puedes integrar tu cliente de webhook de alertas corporativo
                
                conn.close()
                sys.exit(2) # Código de error para trigger en cron/jobs
                
            current_prev_hash = h_sig
            
        print("[ATLAS CHECKER] OK - Cadena de auditoría 100% válida e intacta.")
        conn.close()
        sys.exit(0)
        
    except Exception as e:
        print(f"[ATLAS CHECKER] Error durante la comprobación: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_integrity()
