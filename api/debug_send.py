import os, requests, json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        token = os.getenv('WSP_ACCESS_TOKEN')
        phone_id = os.getenv('WSP_PHONE_NUMBER_ID')
        test_number = "51991740590"  # Tu número

        result = {
            "token_presente": bool(token),
            "phone_id_presente": bool(phone_id),
            "token_primeros_10": token[:10] if token else "NO HAY",
            "phone_id_leido": phone_id
        }

        # Intentar enviar un ping real a Meta
        if phone_id and token:
            url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": test_number,
                "type": "text",
                "text": {"body": "🔔 Diagnóstico Cecilia: Conexión saliente en curso..."}
            }
            try:
                res = requests.post(url, json=payload, headers=headers, timeout=15)
                result["meta_api_status"] = res.status_code
                result["meta_api_raw_response"] = res.json() if res.status_code != 404 else res.text
            except Exception as e:
                result["envio_error"] = str(e)
        else:
            result["meta_api_status"] = "SALTADO_POR_FALTA_DE_CREDENCIALES"

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result, indent=2).encode())
