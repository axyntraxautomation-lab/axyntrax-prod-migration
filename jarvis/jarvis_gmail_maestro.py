import os
import datetime
import json
import logging
from dotenv import load_dotenv

# Adjust lookup for Root .env
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(ENV_PATH)

logging.basicConfig(level=logging.INFO, format='[JARVIS-GMAIL] %(levelname)s: %(message)s')

class GmailMaestro:
    """
    Gestor Autónomo de Gmail para el CEO Jarvis.
    Se encarga de clasificar, procesar y responder correos automáticamente.
    """
    def __init__(self):
        self.token = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "PENDIENTE")
        
    def fetch_unread_messages(self):
        """Simula obtención de correos entrantes no leídos."""
        # En producción usaría self.service.users().messages().list(...)
        return [
            {
                "id": "m1",
                "from": "gerencia@clinicasalud.pe",
                "subject": "Cotización Urgente Plan Diamante",
                "snippet": "Necesitamos implementar el sistema mañana. Favor enviar cotización final."
            },
            {
                "id": "m2",
                "from": "spammer@noreply.com",
                "subject": "Gana un premio",
                "snippet": "Haz clic aquí para reclamar tu iPhone."
            }
        ]

    def classify_message(self, message):
        """Clasifica la urgencia y el tema del correo."""
        subject = message["subject"].lower()
        snippet = message["snippet"].lower()
        
        if "urgente" in subject or "ahora" in snippet or "diamante" in snippet:
            return {"urgencia": "ALTA", "tema": "VENTAS"}
        elif "premio" in subject or "ganaste" in snippet:
            return {"urgencia": "BAJA", "tema": "SPAM"}
        else:
            return {"urgencia": "MEDIA", "tema": "GENERAL"}

    def generate_response_draft(self, message, classification):
        """Genera borrador de respuesta automática."""
        if classification["tema"] == "SPAM":
            return None # Ignorar spam
            
        elif classification["tema"] == "VENTAS":
            # Aquí interactuaría con la base de datos gmail_templates en un caso real
            response = (
                f"Estimado cliente de {message['from']},\n\n"
                "He recibido su solicitud prioritaria con éxito. "
                "Nuestro plan Diamante ofrece automatización total de inmediato. "
                "Adjunto el brochure preliminar. Un asesor agendará una llamada con usted en los próximos 15 minutos.\n\n"
                "Atentamente,\nJarvis | CEO Automations (AXYNTRAX)"
            )
            return response
        
        return "Recibido. Analizaremos su mensaje y responderemos pronto."

    def run_cycle(self):
        logging.info("Iniciando ciclo de lectura de Gmail Maestro.")
        emails = self.fetch_unread_messages()
        
        results = []
        for mail in emails:
            cls = self.classify_message(mail)
            resp = self.generate_response_draft(mail, cls)
            
            status = {
                "id": mail["id"],
                "from": mail["from"],
                "class": cls,
                "responded": True if resp else False,
                "action": "ENVIADO" if resp else "DESCARTADO"
            }
            results.append(status)
            logging.info(f"Procesado {mail['id']}: {status['action']} (Urgency: {cls['urgencia']})")
            
        return results

if __name__ == "__main__":
    maestro = GmailMaestro()
    maestro.run_cycle()
