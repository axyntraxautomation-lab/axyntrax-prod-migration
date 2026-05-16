import sqlite3
import os

db_path = "axyntrax.db"

def configurar():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Cambiar Rubro a CARWASH
    cursor.execute("UPDATE clientes SET rubro = 'CARWASH' WHERE empresa = 'MIGUEL_LOCAL_ADMIN'")
    cursor.execute("""
        UPDATE licencias 
        SET rubro = 'CARWASH', notas = 'SUBMODULOS: LAVADO-IA, CAJA-AUTO, CLIENTES-CECILIA' 
        WHERE cliente_id = (SELECT id FROM clientes WHERE empresa = 'MIGUEL_LOCAL_ADMIN')
    """)
    
    # 2. Renombrar Asistente y Dashboard en la configuración
    cursor.execute("CREATE TABLE IF NOT EXISTS axia_config (key TEXT PRIMARY KEY, value TEXT)")
    configs = [
        ("assistant_name", "Cecilia"),
        ("dashboard_title", "Dashboard Cecilia Master"),
        ("rubro_principal", "CARWASH"),
        ("offline_mode", "TRUE")
    ]
    cursor.executemany("INSERT OR REPLACE INTO axia_config (key, value) VALUES (?, ?)", configs)

    conn.commit()
    conn.close()
    print("✅ Base de Datos configurada para CARWASH y Asistente CECILIA.")

if __name__ == "__main__":
    configurar()
