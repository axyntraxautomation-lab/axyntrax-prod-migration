import requests
import json
import sys

# UTF-8 fix for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_production_webhook():
    url = "https://axyntrax-automation.net/api/cecilia/webhook"
    print(f"Probando Webhook de Produccion: {url}")
    
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"display_phone_number": "51991740590", "phone_number_id": "1148012698386108"},
                    "messages": [{
                        "from": "51991740590",
                        "id": "TEST_PROD_001",
                        "timestamp": "123456789",
                        "text": {"body": "Hola Cecilia, ¿estás activa?"},
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        print(f"STATUS: {resp.status_code}")
        print(f"RESPONSE: {resp.text}")
        
        if resp.status_code == 200:
            print("SUCCESS: El servidor de produccion recibio el mensaje simulado.")
        else:
            print("ERROR: El servidor de produccion devolvio un error.")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_production_webhook()
