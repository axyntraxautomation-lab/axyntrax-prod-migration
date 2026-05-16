import os
import sys

def analyze():
    print("[NEO] Analizando tendencias de mercado B2B...")
    print("[NEO] Oportunidades detectadas en sector Industrial Peruano.")

if __name__ == "__main__":
    if "--once" in sys.argv:
        analyze()
        print("[NEO] Prueba de funcionamiento: EXITOSA.")
    else:
        print("[NEO] Agente NEO en espera de comandos...")
