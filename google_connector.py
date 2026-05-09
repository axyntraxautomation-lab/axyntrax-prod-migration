import os
import json
import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

class GoogleJarvisConnector:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "PENDIENTE_POR_ADMIN")
        self.client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "PENDIENTE_POR_ADMIN")
        self.api_url = "http://localhost:5001/api/jarvis/notificar"
        self.mode = "stub" if "PENDIENTE" in self.client_id else "active"

    def fetch_gmail_inbox(self):
        """Lista correos con label 'antigravity/inbox' (Simulación o Real)."""
        if self.mode == "stub":
            return [{
                "subject": "TEST: Nueva solicitud de automatización",
                "from": "cliente_test@gmail.com",
                "date": datetime.datetime.now().isoformat(),
                "snippet": "Hola, estoy interesado en el plan Diamante...",
                "threadId": "test_thread_001"
            }]
        # Lógica real OAuth iría aquí (requiere refresh_token o flujo interactivo)
        return []

    def fetch_calendar_events(self):
        """Lista eventos del calendario primary (Simulación o Real)."""
        if self.mode == "stub":
            return [{
                "summary": "Demo Axyntrax - Clínica San Juan",
                "start": (datetime.datetime.now() + datetime.timedelta(hours=2)).isoformat(),
                "id": "event_001"
            }]
        return []

    def sync_to_jarvis(self):
        """Envía los datos recolectados al inbox de Jarvis."""
        emails = self.fetch_gmail_inbox()
        for mail in emails:
            payload = {
                "origen": "GMAIL",
                "tipo": "CORREO",
                "mensaje": f"Asunto: {mail['subject']} | De: {mail['from']} | Snippet: {mail['snippet']}",
                "prioridad": 2
            }
            try:
                requests.post(self.api_url, json=payload, timeout=2)
            except: pass

        events = self.fetch_calendar_events()
        for event in events:
            payload = {
                "origen": "CALENDAR",
                "tipo": "EVENTO",
                "mensaje": f"Evento: {event['summary']} | Inicio: {event['start']}",
                "prioridad": 2
            }
            try:
                requests.post(self.api_url, json=payload, timeout=2)
            except: pass

if __name__ == "__main__":
    connector = GoogleJarvisConnector()
    print(f"[GOOGLE CONNECTOR] Modo: {connector.mode}")
    connector.sync_to_jarvis()
    print("[GOOGLE CONNECTOR] Sincronización completada.")
