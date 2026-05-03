import uuid
import socket
import hashlib
import sys

class HardwareLock:
    def __init__(self, authorized_hash=None):
        """
        authorized_hash: El hash SHA-256 del ID de hardware autorizado.
        Si es None, el sistema está en modo 'Configuración/Bloqueado'.
        """
        self.authorized_hash = authorized_hash

    @staticmethod
    def get_hardware_id():
        """Obtiene una combinación única de MAC y Hostname."""
        mac = str(uuid.getnode())
        hostname = socket.gethostname()
        raw_id = f"{mac}:{hostname}"
        return hashlib.sha256(raw_id.encode()).hexdigest()

    def validate(self):
        """Valida si el hardware actual coincide con el autorizado."""
        current_id = self.get_hardware_id()
        
        # Si no hay hash autorizado, está bloqueado por defecto (Seguridad Máxima)
        if self.authorized_hash is None:
            return False, current_id
            
        if current_id == self.authorized_hash:
            return True, current_id
        else:
            return False, current_id

def secure_exit(message):
    """Cierre de emergencia del sistema."""
    print(f"\n[SISTEMA BLOQUEADO] {message}")
    print("Acceso denegado: Hardware no autorizado para la Suite Diamante.")
    sys.exit(1)
