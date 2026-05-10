from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from urllib.parse import parse_qs, urlparse
from .cecilia_ia import get_cecilia_response

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        mode = query.get('hub.mode', [None])[0]
        token = query.get('hub.verify_token', [None])[0]
        challenge = query.get('hub.challenge', [None])[0]
        
        verify_token = os.getenv("WH_VERIFY_TOKEN", "axyntrax_diamante_2026")
        
        if mode == 'subscribe' and token == verify_token:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(challenge.encode())
        else:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b'Forbidden')

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        try:
            if data.get('object') == 'whatsapp_business_account':
                for entry in data.get('entry', []):
                    for change in entry.get('changes', []):
                        value = change.get('value', {})
                        if 'messages' in value:
                            message = value['messages'][0]
                            from_number = message['from']
                            if message.get('type') == 'text':
                                body = message['text']['body']
                                # Obtener respuesta de Cecilia
                                reply = get_cecilia_response(body)
                                # Enviar respuesta vía Meta API
                                self.send_whatsapp_message(from_number, reply)
        except Exception as e:
            print(f"[WSP WEBHOOK ERR] {e}")
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())

    def send_whatsapp_message(self, to, text):
        access_token = os.getenv("WSP_ACCESS_TOKEN")
        phone_id = os.getenv("WSP_PHONE_NUMBER_ID")
        if not access_token or not phone_id:
            print(f"[STUB] WhatsApp to {to}: {text}")
            return
            
        url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text}
        }
        requests.post(url, headers=headers, json=payload, timeout=10)
