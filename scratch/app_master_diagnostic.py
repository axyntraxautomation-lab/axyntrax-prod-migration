import sqlite3
import os
import sys
import hashlib
import json
import requests
from datetime import datetime

# Path Setup
sys.path.append(os.getcwd())

from app.core import config
from app.core.database import insert_audit_log, sign_audit
from app.core.supervisor import SentinelBot
from app.modules.hunter import HunterBot
from app.modules.excel_generator import ResidentialExcelGenerator
from app.modules.cert_generator import CertificateGenerator

class MasterDiagnostic:
    def __init__(self):
        self.report = []
        self.success_count = 0
        self.failure_count = 0

    def log_result(self, category, name, status, details=""):
        res = f"[{'OK' if status else 'FAIL'}] {category} - {name}: {details}"
        self.report.append(res)
        if status: self.success_count += 1
        else: self.failure_count += 1
        print(res)

    def run_db_diagnostic(self):
        print("\n--- [1] DB & SEGURIDAD INMUTABLE ---")
        try:
            conn = sqlite3.connect(config.DB_PATH)
            cursor = conn.cursor()
            
            # Check Tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [t[0] for t in cursor.fetchall()]
            required = ['logs', 'bot_audit', 'res_unidades', 'incidentes', 'licencias']
            for table in required:
                self.log_result("DB", f"Tabla {table}", table in tables)
            
            # Check Integrity Seal (Fase 7)
            insert_audit_log(1, "MASTER_DIAGNOSTIC", "system", 0, "Security", "Verificacion de integridad inmutable")
            cursor.execute("SELECT hash_signature FROM logs ORDER BY id DESC LIMIT 1")
            has_hash = cursor.fetchone()[0] is not None
            self.log_result("SEGURIDAD", "Firma Hashing SHA-256", has_hash)
            
            conn.close()
        except Exception as e:
            self.log_result("DB", "Falla Catastrófica", False, str(e))

    def run_ia_diagnostic(self):
        print("\n--- [2] IA (CECILIA v3.0 & HUNTER) ---")
        try:
            hunter = HunterBot()
            # Lead Scoring
            hunter.process_new_interaction("TEST_SESSION", {"sender": "DIAGNOSTIC_LEAD", "text": "QUIERO AGENDAR CITA"})
            self.log_result("IA", "Hunter Lead Scoring", True)
            
            # Calendar Dedup (Fase 7)
            hunter.sync_google_calendar(1001, "Test Dedup", "2026-12-01")
            hunter.sync_google_calendar(1001, "Test Dedup", "2026-12-01")
            conn = sqlite3.connect(config.DB_PATH)
            c = conn.cursor()
            c.execute("SELECT count(*) FROM citas WHERE cliente_id = 1001")
            is_dedup = c.fetchone()[0] == 1
            self.log_result("IA", "Deduplicacion Agenda", is_dedup)
            conn.close()
            
            # Owner Alert (Fase 9)
            # Primero asegurar que existe la unidad 303
            conn = sqlite3.connect(config.DB_PATH)
            c = conn.cursor()
            c.execute("INSERT OR IGNORE INTO res_unidades (id, numero_unidad, propietario_tel) VALUES (303, '303', '51986663866')")
            conn.commit()
            conn.close()
            alert_ok = hunter.notify_owner_misconduct(303, "Ruido Detectado")
            self.log_result("IA", "Alerta Propietario (Mala Conducta)", alert_ok)
            
        except Exception as e:
            self.log_result("IA", "Falla en componente", False, str(e))

    def run_modules_diagnostic(self):
        print("\n--- [3] MÓDULOS SECTORIALES & REPORTES ---")
        try:
            # Residencial Excel
            res_gen = ResidentialExcelGenerator()
            path_x = res_gen.generate_unit_report(303)
            self.log_result("RESIDENCIAL", "XLSX por Unidad", os.path.exists(path_x) if path_x else False)
            
            # Legal PDF
            cert_gen = CertificateGenerator()
            path_p = cert_gen.emit_software_license("Institucion Diagnostico", "HW-V11", "KEY-DIAG-OK", "General")
            self.log_result("LEGAL", "Certificado PDF Platinum", os.path.exists(path_p) if path_p else False)

        except Exception as e:
            self.log_result("MODULOS", "Error en Generacion", False, str(e))

    def run_network_diagnostic(self):
        print("\n--- [4] CONECTIVIDAD WEB HUB ---")
        try:
            r = requests.get("http://localhost:3459", timeout=5)
            self.log_result("WEB", "Disponibilidad Local Server", r.status_code == 200)
            
            # Cecilia JS presence
            r2 = requests.get("http://localhost:3459/chatbot-cecilia.js", timeout=5)
            self.log_result("WEB", "Carga Cecilia v3.0 JS", r2.status_code == 200)
            
        except Exception as e:
            self.log_result("WEB", "Servidor No Alcanzable", False, str(e))

    def finalize(self):
        print("\n" + "="*40)
        print("RESUMEN DEL DIAGNÓSTICO MAESTRO")
        print(f"EXITOSOS: {self.success_count}")
        print(f"FALLIDOS: {self.failure_count}")
        print("="*40)
        
        report_path = os.path.join(os.getcwd(), "FINAL_MASTER_DIAGNOSTIC.txt")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("AXYNTRAX v11.0 PLATINUM - FINAL AUDIT REPORT\n")
            f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("\n".join(self.report))
            f.write(f"\n\nRESUMEN: {self.success_count} OK / {self.failure_count} FAIL")
        
        print(f"Reporte técnico guardado en: {report_path}")

if __name__ == "__main__":
    diag = MasterDiagnostic()
    diag.run_db_diagnostic()
    diag.run_ia_diagnostic()
    diag.run_modules_diagnostic()
    diag.run_network_diagnostic()
    diag.finalize()
