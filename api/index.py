import os
import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- CONFIGURACIÓN CRÍTICA ---
# Estas variables deben estar en el panel de Vercel
VERIFY_TOKEN = os.getenv("WH_VERIFY_TOKEN", "axyntrax_diamante_2026")
ACCESS_TOKEN = os.getenv("WSP_ACCESS_TOKEN")
PHONE_ID = os.getenv("WSP_PHONE_NUMBER_ID", "1156622220859055")

@app.route("/", methods=["GET", "POST"])
@app.route("/api/cecilia/webhook", methods=["GET", "POST"])
def webhook():
    # 1. Verificación de Meta (GET)
    if request.method == "GET":
        mode = request.args.get("hub.mode")
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")
        if mode == "subscribe" and token == VERIFY_TOKEN:
            return challenge, 200
        return "Token de verificación inválido", 403

    # 2. Recepción de Mensajes (POST)
    if request.method == "POST":
        data = request.get_json()
        try:
            # Extraer el número y el mensaje
            if "entry" in data and data["entry"]:
                changes = data["entry"][0].get("changes", [{}])[0]
                value = changes.get("value", {})
                if "messages" in value:
                    message = value["messages"][0]
                    from_number = message["from"]
                    
                    # ENVIAR RESPUESTA DE EMERGENCIA
                    url = f"https://graph.facebook.com/v18.0/{PHONE_ID}/messages"
                    headers = {
                        "Authorization": f"Bearer {ACCESS_TOKEN}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "messaging_product": "whatsapp",
                        "to": from_number,
                        "type": "text",
                        "text": {"body": "🤖 [SISTEMA AXYNTRAX] ¡CONEXIÓN RECUPERADA!\n\nMiguel, si lees esto, Cecilia ya está escuchando. Estamos reconectando el cerebro DeepSeek ahora mismo."}
                    }
                    requests.post(url, headers=headers, json=payload)
                    
            return jsonify({"status": "ok"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
