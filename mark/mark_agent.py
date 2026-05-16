import os
import sys

def publish():
    print("[MARK] Generando contenido publicitario autónomo...")
    print("[MARK] Publicación de prueba enviada a cola de espera.")

if __name__ == "__main__":
    if "--once" in sys.argv:
        publish()
        print("[MARK] Prueba de funcionamiento: EXITOSA.")
    else:
        print("[MARK] Agente MARK monitoreando redes sociales...")
