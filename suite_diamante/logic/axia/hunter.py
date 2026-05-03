import os
import sqlite3
import requests
import datetime
from db_master.connection import DB_PATH
from suite_diamante.logic.axia.security import get_security

class HunterBot:
    """
    Bot 2: Growth / CRM / Chatbot (The Hunter).
    Encargado de la captación de leads, scoring y detección de oportunidades.
    """
    def __init__(self):
        self.db_path = DB_PATH
        self.security = get_security()

    def process_new_interaction(self, session_id, data):
        """Procesa una nueva interacción del chatbot para identificar leads."""
        user_id = data.get("sender")
        message = data.get("text", "").upper()
        needs_human = any(word in message for word in ["PAGUE", "CAPTURA", "DEPOSITO", "YAPE", "TRANSFERENCIA", "RECIBO"])
        
        points = 0
        if "PRECIO" in message: points += 20
        if "CITA" in message: points += 15
        if needs_human: points += 100

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, score FROM leads_v6 WHERE source = ?", (user_id,))
            lead = cursor.fetchone()
            
            if lead:
                cursor.execute("UPDATE leads_v6 SET score = ? WHERE id = ?", (lead[1] + points, lead[0]))
                action = "UPDATE_LEAD_SCORE"
            else:
                cursor.execute("INSERT INTO leads_v6 (source, score, rubro) VALUES (?, ?, ?)", (user_id, points, "General"))
                action = "NEW_LEAD_CAPTURED"
            
            action_details = f"Sesión: {session_id} | Puntos: {points}"
            sig = self.security.sign_action(2, action, 'SUCCESS', action_details)
            cursor.execute("INSERT INTO bot_audit (bot_id, action_type, result, details, hash_signature) VALUES (2, ?, 'SUCCESS', ?, ?)", (action, action_details, sig))
            conn.commit()
            conn.close()
        except: pass

    def send_headless_whatsapp(self, phone, message):
        """Stub para envío WA sin API (Log de Consola)."""
        print(f"\n[AXIA-WA-HEADLESS] Enviando a {phone}: {message}\n")
        return True

    def send_whatsapp_api(self, phone, message):
        """Envío Real vía WhatsApp Cloud API usando credenciales del .env."""
        access_token = os.getenv("WSP_ACCESS_TOKEN")
        phone_id = os.getenv("WSP_PHONE_NUMBER_ID")
        
        if not access_token or not phone_id:
            print("[HUNTER ERR] Faltan credenciales de WhatsApp en el .env")
            return self.send_headless_whatsapp(phone, message)

        url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": message}
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                print(f"[HUNTER-WA] Mensaje enviado a {phone}")
                return True
            else:
                print(f"[HUNTER-WA ERR] Fallo al enviar: {response.text}")
                return False
        except Exception as e:
            print(f"[HUNTER-WA EXCP] {e}")
            return False

    def run_48h_followup(self):
        """Barrido de seguimientos."""
        print("[AXIA HUNTER] Ejecutando barrido de seguimiento 48h...")

def get_hunter():
    return HunterBot()
