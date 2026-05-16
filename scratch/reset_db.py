import sys
sys.path.insert(0, '.')
from db_master.connection import get_db

conn = get_db()
conn.row_factory = None
c = conn.cursor()

tables = [
    'licencias', 'ventas', 'clientes', 'usuarios',
    'citas', 'axia_campaigns', 'axia_autonomy_logs', 'bot_audit'
]

for t in tables:
    try:
        c.execute("DELETE FROM " + t)
        print("  OK   " + t + " vaciada")
    except Exception as e:
        print("  SKIP " + t + ": " + str(e))

try:
    c.execute("DELETE FROM sqlite_sequence")
    print("  OK   autoincrement reseteado")
except Exception as e:
    print("  SKIP sqlite_sequence: " + str(e))

conn.commit()
conn.close()
print()
print("DB RESETEADA A CERO - LIMPIA PARA PRODUCCION.")
