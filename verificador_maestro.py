import os
import requests
import json
import sys
from dotenv import load_dotenv

# Forzar salida en UTF-8 para Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def run_diagnostic():
    load_dotenv(override=True)
    print("==================================================")
    print("   DIAGNOSTICO MAESTRO - CECILIA OMNICANAL       ")
    print("==================================================")
    
    # 1. Verificar DeepSeek
    print("\n[1/3] Probando Cerebro IA (DeepSeek)...")
    ds_key = os.getenv("DEEPSEEK_API_KEY")
    ds_url = "https://api.deepseek.com/v1/chat/completions"
    ds_payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": "Responde solo con la palabra 'OK' si me escuchas."}],
        "max_tokens": 5
    }
    try:
        ds_resp = requests.post(ds_url, headers={"Authorization": f"Bearer {ds_key}"}, json=ds_payload, timeout=10)
        if ds_resp.status_code == 200:
            reply = ds_resp.json()["choices"][0]["message"]["content"].strip()
            print(f"SUCCESS: DeepSeek responde: {reply}")
        else:
            print(f"ERROR: DeepSeek ({ds_resp.status_code}): {ds_resp.text}")
    except Exception as e:
        print(f"EXCEPTION DeepSeek: {e}")

    # 2. Verificar Meta Access
    print("\n[2/3] Probando Conectividad Meta (Graph API)...")
    meta_token = os.getenv("WSP_ACCESS_TOKEN")
    phone_id = os.getenv("WSP_PHONE_NUMBER_ID")
    meta_url = f"https://graph.facebook.com/v19.0/me?access_token={meta_token}"
    try:
        meta_resp = requests.get(meta_url, timeout=10)
        if meta_resp.status_code == 200:
            print(f"SUCCESS: Meta Token Valido: {meta_resp.json().get('name')}")
            print(f"SUCCESS: Phone ID en uso: {phone_id}")
        else:
            print(f"ERROR: Meta ({meta_resp.status_code}): {meta_resp.text}")
    except Exception as e:
        print(f"EXCEPTION Meta: {e}")

    # 3. Envio de Prueba
    print("\n[3/3] Simulacion de Envio...")
    to_number = os.getenv("TEST_PHONE_NUMBER", "51991740590") 
    
    send_url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
    send_payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": "Robot CECILIA OMNICANAL: Diagnostico completado al 100%. Sistemas operativos."}
    }
    try:
        send_resp = requests.post(send_url, headers={"Authorization": f"Bearer {meta_token}"}, json=send_payload, timeout=10)
        if send_resp.status_code == 200:
            print(f"SUCCESS: Mensaje enviado a {to_number} exitosamente.")
        else:
            print(f"ERROR al enviar ({send_resp.status_code}): {send_resp.text}")
    except Exception as e:
        print(f"EXCEPTION Envio: {e}")

if __name__ == "__main__":
    run_diagnostic()
