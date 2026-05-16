import os
import sys

# Añadir el directorio raíz al path para importar la app
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(root_dir)

from app.core.axia_certs import get_axia_certs
import logging

def test_certificate_generation():
    print("--- INICIANDO TEST DE AXIACERTS ---")
    
    # Simular datos
    client_name = "CLIENTE DE PRUEBA AXIA"
    rubro = "AUTOMATIZACIÓN INDUSTRIAL"
    key_id = "AX-TEST-001"
    expiry_date = "2027-12-31"
    
    certs = get_axia_certs()
    
    print("\n[1] Generando certificado con assets existentes (o simulados)...")
    path = certs.generate_membership_cert(client_name, rubro, key_id, expiry_date)
    
    if path and os.path.exists(path):
        print(f"ÉXITO: Certificado creado en: {path}")
    else:
        print("FALLA: No se pudo generar el certificado.")

    print("\n--- TEST FINALIZADO ---")

if __name__ == "__main__":
    test_certificate_generation()
