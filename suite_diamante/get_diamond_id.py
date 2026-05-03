import sys
import os

# Añadir el path del proyecto para importar los módulos nuevos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from suite_diamante.logic.security import HardwareLock

def main():
    print("=== AXYNTRAX: GENERADOR DE ID DIAMANTE ===")
    print("Obteniendo identidad de hardware...")
    
    id_maestro = HardwareLock.get_hardware_id()
    
    print("\n" + "="*40)
    print(f"DIAMOND_ID: {id_maestro}")
    print("="*40)
    print("\nGuarda este código. Es el que autorizaremos para el acceso exclusivo.")

if __name__ == "__main__":
    main()
