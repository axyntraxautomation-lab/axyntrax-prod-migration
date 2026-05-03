import os
import sqlite3
import datetime
from db_master.connection import get_db
from suite_diamante.logic.axia.templates_calendar import get_calendar_msg
from suite_diamante.logic.axia.brain import get_brain
from suite_diamante.logic.axia.security import get_security
from suite_diamante.logic.axia.hunter import get_hunter

class AXIACalendarMaster:
    """
    Orquestador de Agenda Inteligente AXIA.
    Sincroniza con la nube, detecta conflictos y envía recordatorios proactivos.
    """
    def __init__(self):
        self.brain = get_brain()
        self.security = get_security()
        self.hunter = get_hunter()

    def sync_google(self):
        """Sincroniza citas con Google Calendar (Simulado)."""
        print("[AXIA CALENDAR] Iniciando sincronización con Google...")
        return True

    def check_and_notify_reminders(self):
        """Busca citas próximas (1 hora) y dispara avisos de WhatsApp."""
        print("[AXIA CALENDAR] Verificando recordatorios próximos...")
        conn = get_db()
        try:
            c = conn.cursor()
            
            now_plus_1h = (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H")
            c.execute("""
                SELECT c.id, c.asunto, c.ubicacion, cl.contacto, cl.telefono 
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                WHERE c.fecha_cita LIKE ? AND c.resultado = 'Pendiente'
            """, (f"{now_plus_1h}%",))
            
            citas = c.fetchall()
            for id_cita, asunto, ubi, contacto, tel in citas:
                c.execute("SELECT id FROM axia_notifications WHERE entidad_id = ? AND tipo_aviso = 'APPOINTMENT_REMINDER'", (id_cita,))
                if c.fetchone(): continue
                
                msg = get_calendar_msg("APPOINTMENT_REMINDER", asunto=asunto, cliente=contacto, ubicacion=ubi or "No especificada")
                decision = self.brain.process_event("AGENDA", f"REMINDER_{asunto}", impact_score=3)
                
                if "ACTUAR" in decision:
                    # Envío Real de WhatsApp mediante el motor de la Suite
                    self.hunter.send_whatsapp_api(tel, msg)
                    c.execute("INSERT INTO axia_notifications (entidad_id, tipo_aviso) VALUES (?, 'APPOINTMENT_REMINDER')", (id_cita,))
                    self.security.sign_action(4, "CALENDAR_REMINDER", "SUCCESS", f"Recordatorio enviado para {asunto}")
            conn.commit()
        except Exception as e: 
            print(f"[AXIA CALENDAR ERR] {e}")
        finally:
            conn.close() # Asegurar liberación de recursos

def get_calendar():
    return AXIACalendarMaster()
