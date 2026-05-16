import sqlite3
from db_master.connection import get_db

def migrate():
    conn = get_db()
    cursor = conn.cursor()
    
    print("[MIGRATION] Verificando columnas de Phase 6...")
    
    # 1. Verificar fecha_nacimiento en clientes
    try:
        cursor.execute("SELECT fecha_nacimiento FROM clientes LIMIT 1")
    except sqlite3.OperationalError:
        print(" -> Añadiendo fecha_nacimiento a la tabla clientes")
        cursor.execute("ALTER TABLE clientes ADD COLUMN fecha_nacimiento TEXT")

    # 2. Verificar fecha_aniversario en clientes
    try:
        cursor.execute("SELECT fecha_aniversario FROM clientes LIMIT 1")
    except sqlite3.OperationalError:
        print(" -> Añadiendo fecha_aniversario a la tabla clientes")
        cursor.execute("ALTER TABLE clientes ADD COLUMN fecha_aniversario TEXT")

    # 3. Verificar campos en citas
    campos_citas = {
        "ubicacion": "TEXT",
        "sync_provider": "TEXT DEFAULT 'Local'",
        "external_id": "TEXT"
    }
    for col, tip in campos_citas.items():
        try:
            cursor.execute(f"SELECT {col} FROM citas LIMIT 1")
        except sqlite3.OperationalError:
            print(f" -> Añadiendo {col} a la tabla citas")
            cursor.execute(f"ALTER TABLE citas ADD COLUMN {col} {tip}")

    conn.commit()
    conn.close()
    print("[MIGRATION] Base de datos actualizada con éxito.")

if __name__ == "__main__":
    migrate()
