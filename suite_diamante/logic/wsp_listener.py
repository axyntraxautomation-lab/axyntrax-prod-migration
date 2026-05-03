import os
import threading
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from suite_diamante.logic.axia.remote import get_remote

# Cargar variables de entorno
load_dotenv()

ADMIN_PHONE = os.getenv("ADMIN_PHONE_NUMBER")
VERIFY_TOKEN = os.getenv("WH_VERIFY_TOKEN", "axyntrax_diamante_2026")

app = Flask(__name__)

class CommandDispatcher:
    @staticmethod
    def execute(command, phone):
        """Redirige al Centro de Mando Remoto de AXIA."""
        remote = get_remote()
        return remote.process_command(command, phone)

@app.route("/webhook", methods=["GET"])
def verify():
    """Validación del Webhook para Meta API."""
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        print("[WSP] Webhook Verificado con Meta.")
        return challenge, 200
    else:
        return "Forbidden", 403

@app.route("/webhook", methods=["POST"])
def webhook():
    """Recepción de mensajes de WhatsApp."""
    data = request.json
    try:
        # Analizar estructura de mensaje de Meta API
        if "messages" in data["entry"][0]["changes"][0]["value"]:
            message_obj = data["entry"][0]["changes"][0]["value"]["messages"][0]
            from_phone = message_obj["from"]
            text_msg = message_obj["text"]["body"]

            # CAPA DE SEGURIDAD NIVEL 2: Filtro por número autorizado
            if from_phone == ADMIN_PHONE:
                print(f"[WSP] Comando Recibido de Gerencia: {text_msg}")
                response = CommandDispatcher.execute(text_msg, from_phone)
                # Aquí se enviaría el mensaje de vuelta usando la API de Meta
                print(f"[WSP] Respuesta generada: {response}")
            else:
                print(f"[WSP ALERT] Mensaje de número no autorizado ignorado: {from_phone}")

    except Exception as e:
        print(f"[WSP ERROR] Error procesando webhook: {e}")

    return jsonify({"status": "received"}), 200

def start_wsp_server():
    """Inicia el servidor de escucha en el puerto 5000."""
    print(f"[WSP ENGINE] Escuchando comandos para: {ADMIN_PHONE}")
    app.run(port=5000, use_reloader=False)

def run_listener_async():
    """Lanza el listener en un hilo separado."""
    thread = threading.Thread(target=start_wsp_server, daemon=True)
    thread.start()
