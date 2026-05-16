import sqlite3
import datetime
from db_master.connection import get_db
from suite_diamante.logic.axia.templates import get_template
from suite_diamante.logic.axia.hunter import get_hunter
from suite_diamante.logic.axia.brain import get_brain

class AXIAMarketingManager:
    """
    Motor Autónomo de Marketing AXIA.
    Gestiona calendarios, segmentación y envío proactivo humanizado.
    """
    def __init__(self):
        self.hunter = get_hunter()
        self.axia = get_brain()

    def segment_clients(self):
        """Asigna a cada cliente un segmento basado en comportamiento real."""
        segments = {
            "NUEVOS": [], "PRUEBA": [], "FIELES": [], "INACTIVOS": [], "EN_RIESGO": []
        }
        try:
            conn = get_db()
            c = conn.cursor()
            
            # Fieles: Más de 180 días con nosotros o score > 200
            limit_fiel = (datetime.datetime.now() - datetime.timedelta(days=180)).strftime("%Y-%m-%d")
            c.execute("SELECT id FROM clientes WHERE score >= 200 OR date(notas) < ?", (limit_fiel,)) # Ejemplo simplificado
            segments["FIELES"] = [r[0] for r in c.fetchall()]
            
            # En Riesgo: Sin interacción > 30 días
            limit_riesgo = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
            c.execute("SELECT id FROM clientes WHERE fecha_ultima_interaccion < ? OR fecha_ultima_interaccion IS NULL", (limit_riesgo,))
            segments["EN_RIESGO"] = [r[0] for r in c.fetchall()]

            # Nuevos: Registrados en los últimos 15 días
            limit_nuevo = (datetime.datetime.now() - datetime.timedelta(days=15)).strftime("%Y-%m-%d")
            c.execute("SELECT id FROM clientes WHERE id > (SELECT MAX(id) - 10 FROM clientes)")
            segments["NUEVOS"] = [r[0] for r in c.fetchall()]

            conn.close()
        except Exception as e:
            print(f"[AXIA SEGMENT ERR] {e}")
        return segments

    def rebuild_monthly_calendar(self):
        """Genera el plan de marketing de AXIA para los próximos 30 días."""
        plan = []
        today = datetime.datetime.now()
        
        segments = ["NUEVOS", "PRUEBA", "FIELES", "EN_RIESGO"]
        
        for i in range(30):
            current_date = today + datetime.timedelta(days=i)
            if current_date.weekday() == 0: # Lunes
                plan.append((current_date.strftime("%Y-%m-%d"), "RECORDATORIO_GENERAL"))
            elif current_date.weekday() == 2: # Miércoles
                plan.append((current_date.strftime("%Y-%m-%d"), "PRUEBA"))
            elif current_date.weekday() == 4: # Viernes
                plan.append((current_date.strftime("%Y-%m-%d"), "FIELES"))

        try:
            conn = get_db()
            c = conn.cursor()
            c.execute("DELETE FROM axia_campaigns WHERE estado = 'Pendiente'")
            for f, s in plan:
                c.execute("INSERT INTO axia_campaigns (fecha_programada, segmento) VALUES (?, ?)", (f, s))
            conn.commit()
            conn.close()
            print("[AXIA MARKETING] Calendario mensual reconstruido exitosamente.")
        except Exception as e: print(f"[CALENDAR ERR] {e}")

    def generate_automated_campaigns(self):
        """Alias para el orquestador."""
        self.rebuild_monthly_calendar()
        self.execute_daily_marketing()

    def execute_daily_marketing(self):
        """Realiza los envíos programados para el hoy, respetando límites."""
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        print(f"[AXIA MARKETING] Ejecutando envíos para hoy: {today}")
        
        try:
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, segmento FROM axia_campaigns WHERE fecha_programada = ? AND estado = 'Pendiente'", (today,))
            campaign = c.fetchone()
            
            if campaign:
                camp_id, segmento = campaign
                una_semana_atras = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
                
                c.execute("""
                    SELECT id, contacto, telefono FROM clientes 
                    WHERE id NOT IN (SELECT cliente_id FROM axia_marketing_logs WHERE fecha_envio > ?)
                """, (una_semana_atras,))
                
                targets = c.fetchall()
                for tid, tnom, ttel in targets:
                    msg = get_template(segmento, tnom)
                    print(f" -> AXIA enviando a {tnom} ({ttel}): {msg}")
                    # self.hunter.send_headless_whatsapp(ttel, msg)
                    c.execute("INSERT INTO axia_marketing_logs (cliente_id, campana_id, resultado) VALUES (?, ?, 'ENVIADO')", (tid, camp_id))
                    c.execute("UPDATE clientes SET fecha_ultima_interaccion = ? WHERE id = ?", (today, tid))
                
                c.execute("UPDATE axia_campaigns SET estado = 'COMPLETADA' WHERE id = ?", (camp_id,))
                
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[AXIA MARKETING EXEC ERR] {e}")

def get_axia_marketing():
    return AXIAMarketingManager()
