from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        dashboard_data = {
            "services": [
                {"name": "CECILIA", "status": "active", "channel": "WhatsApp"},
                {"name": "MATRIX", "status": "active", "task": "Licensing"},
                {"name": "ATLAS", "status": "active", "task": "KPIs"}
            ],
            "system_version": "3.2.0 Gold"
        }
        self.wfile.write(json.dumps(dashboard_data).encode())
