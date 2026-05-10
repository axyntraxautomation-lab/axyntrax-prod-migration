import requests
import json
import time
import os

# Cargar configuración básica
BASE_URL = "http://localhost:5001/api"
WEBHOOK_URL = "http://localhost:5000/webhook"

def simulate_sales_flow():
    print("🚀 Iniciando Simulación de Flujo de Ventas AXYNTRAX...")
    
    # 1. Lead envía primer mensaje a Cecilia (WhatsApp)
    print("\n[1/3] CECILIA: Cliente 'Carlos' envía mensaje interesado...")
    payload_msg = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "12345",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "messages": [{
                        "from": "51999000001",
                        "id": "MSG_001",
                        "text": {"body": "Hola, me interesa el plan Pro Cloud para mi restaurante"},
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    try:
        res = requests.post(WEBHOOK_URL, json=payload_msg, timeout=5)
        print(f"   Cecilia respondió (Status: {res.status_code})")
    except Exception as e:
        print(f"   ⚠️ Error contactando a Cecilia: {e} (Asegúrate de que el puerto 5000 esté activo)")

    # 2. El cliente se registra para el Demo (Simulado vía JARVIS/ATLAS)
    print("\n[2/3] JARVIS: Registrando prospecto y activando Demo...")
    # Simulamos notificación a JARVIS.
    try:
        res = requests.post(f"{BASE_URL}/jarvis/notificar", json={
            "origen": "WEB_DEMO",
            "tipo": "PROSPECTO",
            "mensaje": "Nuevo registro Demo: Restaurante El Chef (Ref: Cecilia)",
            "prioridad": 1
        })
        print(f"   Jarvis notificado (Status: {res.status_code})")
    except Exception as e:
        print(f"   ⚠️ Error contactando a Jarvis: {e} (Asegúrate de que el puerto 5001 esté activo)")

    # 3. MATRIX emite licencia de prueba
    print("\n[3/3] MATRIX: Emitiendo licencia de prueba (45 días)...")
    try:
        res = requests.post(f"{BASE_URL}/matrix/emitir", json={
            "cliente_id": 999, 
            "modulo": "PRO_CLOUD",
            "dias": 45
        })
        if res.status_code == 200:
            key = res.json().get("clave", "ERROR-KEY")
            print(f"   ✅ Licencia generada: {key}")
        else:
            print(f"   ⚠️ Error Matrix: {res.text}")
    except Exception as e:
        print(f"   ⚠️ Error contactando a Matrix: {e}")

    print("\n✅ Flujo de Ventas completado con éxito.")

if __name__ == "__main__":
    simulate_sales_flow()
