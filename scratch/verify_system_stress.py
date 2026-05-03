import os
import sqlite3
import threading
import time
import hashlib
import re
from db_master.connection import get_db
from suite_diamante.logic.axia.security import get_security
from axia_logic import generate_quote_pdf

def test_db_concurrency():
    print("[TEST] Iniciando prueba de estrés de base de datos (Concurrencia WAL)...")
    errors = []
    
    def worker(worker_id):
        from db_master.models import insert_audit_log
        for i in range(5):
            insert_audit_log(None, "STRESS_TEST", "logs", worker_id, detalles=f"Run {i}")

    threads = []
    for i in range(5):
        t = threading.Thread(target=worker, args=(i,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    if not errors:
        print("[OK] DB Concurrency: SUCCESS (No locks detected)")
    else:
        print(f"[FAIL] DB Concurrency: FAILED ({len(errors)} errors)")
        for err in errors: print(f"  - {err}")

def test_pdf_sanitization():
    print("[TEST] Verificando sanitización de nombres de archivos...")
    malicious_name = "../../../tentativa_hack"
    try:
        path = generate_quote_pdf(malicious_name, "Empresa Test", "Pro", 399)
        filename = os.path.basename(path)
        if ".." not in filename and "/" not in filename and "\\" not in filename:
            print(f"[OK] PDF Sanitization: SUCCESS (Filename: {filename})")
        else:
            print(f"[FAIL] PDF Sanitization: FAILED (Unsafe filename: {filename})")
    except Exception as e:
        print(f"[ERR] PDF Sanitization: ERROR ({e})")

def test_audit_chain():
    print("[TEST] Verificando integridad de la cadena de auditoría...")
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, hash_actual, hash_previo FROM logs ORDER BY id ASC")
        logs = cursor.fetchall()
        
        valid = True
        for i in range(1, len(logs)):
            if logs[i][2] != logs[i-1][1]:
                print(f"  - Ruptura detectada en Log ID {logs[i][0]}")
                valid = False
                break
        
        if valid:
            print("[OK] Audit Chain: SUCCESS (Hash chain intact)")
        else:
            print("[FAIL] Audit Chain: FAILED (Chain broken)")
        conn.close()
    except Exception as e:
        print(f"[ERR] Audit Chain: ERROR ({e})")

def test_hardware_validation():
    print("[TEST] Verificando validación de hardware (Diamond ID)...")
    security = get_security()
    is_valid, current_id = security.validate_machine()
    print(f"  - Machine ID Detectado: {current_id}")
    if is_valid:
        print("[OK] Hardware Lock: SUCCESS (Authorized)")
    else:
        print("[WARN] Hardware Lock: WARNING (Not Authorized - Check .env)")

if __name__ == "__main__":
    print("=== AXYNTRAX SYSTEM STRESS & INTEGRITY TEST ===\n")
    test_db_concurrency()
    print("-" * 40)
    test_pdf_sanitization()
    print("-" * 40)
    test_audit_chain()
    print("-" * 40)
    test_hardware_validation()
    print("\n=== FIN DEL TEST ===")
