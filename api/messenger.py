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
            if data.get('object') == 'page':
                for entry in data.get('entry', []):
                    for messaging_event in entry.get('messaging', []):
                        if messaging_event.get('message'):
                            sender_id = messaging_event['sender']['id']
                            message_text = messaging_event['message'].get('text')
                            if message_text:
                                reply = get_cecilia_response(message_text)
                                self.send_messenger_message(sender_id, reply)
        except Exception as e:
            print(f"[MSG WEBHOOK ERR] {e}")
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())

    def send_messenger_message(self, recipient_id, text):
        access_token = os.getenv("WSP_ACCESS_TOKEN") # Messenger suele usar un Page Access Token diferente, pero usamos el mismo por simplicidad si se configura así.
        if not access_token:
            print(f"[STUB] Messenger to {recipient_id}: {text}")
            return
            
        url = f"https://graph.facebook.com/v19.0/me/messages?access_token={access_token}"
        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": text}
        }
        requests.post(url, json=payload, timeout=10)
