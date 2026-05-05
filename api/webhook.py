import os
from flask import Flask, request, jsonify

# Credenciales de entorno
WSP_ACCESS_TOKEN = os.getenv("WSP_ACCESS_TOKEN")
WSP_PHONE_NUMBER_ID = os.getenv("WSP_PHONE_NUMBER_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = Flask(__name__)

# Token de verificación
VERIFY_TOKEN = os.getenv("WH_VERIFY_TOKEN", "axyntrax_diamante_2026")

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            return challenge, 200
        return 'Forbidden', 403
    
    # Lógica de POST para mensajes de WhatsApp iría aquí
    return jsonify({"status": "received"}), 200

if __name__ == '__main__':
    app.run()
