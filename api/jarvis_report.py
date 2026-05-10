from http.server import BaseHTTPRequestHandler
import json
import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        report = {
            "status": "online",
            "report_name": "AXYNTRAX Daily Status",
            "generated_at": datetime.datetime.now().isoformat(),
            "kpis": {
                "active_leads": 150,
                "conversions": 12,
                "ai_uptime": "99.9%"
            }
        }
        self.wfile.write(json.dumps(report).encode())
