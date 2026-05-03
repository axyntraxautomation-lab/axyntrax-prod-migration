import sqlite3
import datetime
from db_master.connection import get_db
from suite_diamante.logic.axia.hunter import get_hunter
from suite_diamante.logic.axia.security import get_security

class AXIAGrowth:
    """
    Motor de Crecimiento AXIA (The HunterBot).
    Captura prospectos y ejecuta persecución comercial automática.
    """
    def __init__(self):
        self.hunter = get_hunter()
        self.security = get_security()

    def run_48h_followup(self):
        """Barrido de seguimientos B2B con throttling (anti-spam)."""
        print("[AXIA GROWTH] Iniciando barrido de seguimiento 48h...")
        import time
        conn = get_db()
        try:
            c = conn.cursor()
            
            # Buscar leads sin seguimiento reciente
            limit_date = (datetime.datetime.now() - datetime.timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
            c.execute("SELECT id, source, rubro FROM leads_v6 WHERE creado_en < ? AND estado = 'Nuevo'", (limit_date,))
            leads = c.fetchall()
            
            for lid, src, rubro in leads:
                # Guiones persuasivos AXIA
                msg = f"Hola, notamos tu interés en nuestra Suite de {rubro}. ¿Deseas agendar una demo guiada hoy?"
                print(f" -> Growth: Siguiendo lead {src}...")
                
                # Envío Real vía API con retardo de seguridad
                success = self.hunter.send_whatsapp_api(src, msg)
                
                if success:
                    # Registrar acción firmada
                    sig = self.security.sign_action(2, "GROWTH_FOLLOWUP", "SUCCESS", f"Lead {lid}")
                    c.execute("INSERT INTO whatsapp_followups (lead_id, tipo_seguimiento, estado_envio) VALUES (?, '48H_B2B', 'ENVIADO')", (lid,))
                    conn.commit()
                
                time.sleep(2) # Pausa anti-spam
                
        except Exception as e: 
            print(f"[GROWTH ERR] {e}")
        finally:
            conn.close() # Liberar conexión

def get_growth():
    return AXIAGrowth()
