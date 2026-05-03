import os
import hashlib
import sqlite3
import wmi
from db_master.connection import get_db

class DiamondSecurity:
    """
    Motor de Seguridad de Grado Maestro AXIA.
    Implementa bloqueo por hardware (Diamond ID) y auditoría inmutable.
    """
    def __init__(self):
        self.c = wmi.WMI()

    def get_hardware_id(self):
        """Obtiene el ID único del procesador (Diamond ID)."""
        try:
            for processor in self.c.Win32_Processor():
                return processor.ProcessorId.strip()
        except:
            return "UNKNOWN_HARDWARE_ID"

    def validate_machine(self):
        """Valida que el hardware coincida con la licencia maestra (soporta raw id y hash)."""
        current_id = self.get_hardware_id()
        authorized_id = os.getenv("AUTHORIZED_DIAMOND_ID", "BFEBFBFF000B06A2")
        
        # Si el ID autorizado en el .env es un hash SHA-256 (64 caracteres)
        if len(authorized_id) == 64:
            current_hash = hashlib.sha256(current_id.encode()).hexdigest()
            return (current_hash == authorized_id), current_id
            
        return (current_id == authorized_id), current_id

    def sign_action(self, bot_id, action_type, result, details):
        """Genera una firma digital SHA-256 encadenada para auditoría."""
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # Obtener el último hash de la tabla bot_audit
            cursor.execute("SELECT hash_signature FROM bot_audit ORDER BY id DESC LIMIT 1")
            res = cursor.fetchone()
            last_hash = res[0] if res else "GENESIS_AXIA_DIAMANTE"
            
            # Crear Payload de firma
            payload = f"{bot_id}{action_type}{result}{details}{last_hash}"
            signature = hashlib.sha256(payload.encode()).hexdigest()
            
            conn.close()
            return signature
        except Exception as e:
            print(f"[SECURITY ERR] sign_action: {e}")
            return "ERR_SIGNATURE"

def get_security():
    return DiamondSecurity()
