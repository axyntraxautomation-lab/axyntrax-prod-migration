import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Credenciales de entorno
WSP_ACCESS_TOKEN = os.getenv("WSP_ACCESS_TOKEN")
WSP_PHONE_NUMBER_ID = os.getenv("WSP_PHONE_NUMBER_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

VERIFY_TOKEN = os.getenv("WH_VERIFY_TOKEN", "axyntrax_diamante_2026")

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        
        mode = params.get("hub.mode", [None])[0]
        token = params.get("hub.verify_token", [None])[0]
        challenge = params.get("hub.challenge", [None])[0]
        
        if mode == "subscribe" and token == VERIFY_TOKEN:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(challenge.encode())
        else:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Forbidden")
    
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body)
            # Procesar mensaje de WhatsApp
            entry = data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])
            
            if messages:
                msg = messages[0]
                phone = msg.get("from", "")
                text = msg.get("text", {}).get("body", "")
                
                # Responder a Meta (200 inmediato)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"EVENT_RECEIVED")
                return
        except:
            pass
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")
