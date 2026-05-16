import sqlite3
import datetime
from db_master.connection import get_db
from suite_diamante.logic.axia.templates import get_template
from suite_diamante.logic.axia.hunter import get_hunter

class AXIACRM:
    """
    Motor CRM de AXIA.
    Gestiona la memoria afectiva, lealtad y celebraciones automáticas.
    """
    def __init__(self):
        self.hunter = get_hunter()

    def run_daily_relationship_sweep(self):
        """Barrido diario de lealtad y celebraciones."""
        print("[AXIA CRM] Iniciando barrido de relaciones del día...")
        self.check_birthdays()
        self.check_anniversaries()

    def check_birthdays(self):
        """Felicita a los clientes en su cumpleaños."""
        today = datetime.datetime.now().strftime("%d-%m")
        try:
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, contacto, telefono FROM clientes WHERE fecha_nacimiento LIKE ?", (f"%{today}",))
            cumples = c.fetchall()
            for cid, nom, tel in cumples:
                msg = get_template("CUMPLEANOS", nom)
                print(f" -> AXIA felicitando a {nom} por su cumpleaños.")
                # self.hunter.send_headless_whatsapp(tel, msg)
                c.execute("INSERT INTO axia_notifications (entidad_id, tipo_aviso) VALUES (?, 'CUMPLEANOS')", (cid,))
            conn.commit()
            conn.close()
        except Exception as e: print(f"[CRM CUMPLE ERR] {e}")

    def check_anniversaries(self):
        """Celebra aniversarios de relación comercial."""
        today = datetime.datetime.now().strftime("%d-%m")
        try:
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, contacto, telefono FROM clientes WHERE fecha_aniversario LIKE ?", (f"%{today}",))
            annivs = c.fetchall()
            for cid, nom, tel in annivs:
                msg = get_template("ANIVERSARIO", nom)
                print(f" -> AXIA celebrando aniversario con {nom}.")
                # self.hunter.send_headless_whatsapp(tel, msg)
                c.execute("INSERT INTO axia_notifications (entidad_id, tipo_aviso) VALUES (?, 'ANIVERSARIO')", (cid,))
            conn.commit()
            conn.close()
        except Exception as e: print(f"[CRM ANNIV ERR] {e}")

def get_crm():
    return AXIACRM()
