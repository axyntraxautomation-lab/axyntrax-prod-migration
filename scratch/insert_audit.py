import sys
import os
sys.path.insert(0, os.getcwd())

from db_master.connection import get_db

def insert():
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO bot_audit (bot_id, action_type, result, details, rubro) VALUES (?, ?, ?, ?, ?)",
        (999, "REORGANIZACION", "OK", "Se ha reorganizado la infraestructura y documentado en /docs.", "General")
    )
    conn.commit()
    conn.close()
    print("Notificado exitosamente a la base de datos de auditoria.")

if __name__ == "__main__":
    insert()
