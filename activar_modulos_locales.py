import sqlite3
import datetime

db_path = "axyntrax.db"

def activar():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Crear Cliente Local si no existe
    cursor.execute("SELECT id FROM clientes WHERE empresa = 'MIGUEL_LOCAL_ADMIN'")
    client = cursor.fetchone()
    
    if not client:
        cursor.execute("""
            INSERT INTO clientes (empresa, contacto, email, telefono, rubro, estado)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("MIGUEL_LOCAL_ADMIN", "Miguel", "miguel@axyntrax.com", "51999000000", "GENERAL", "Activo"))
        client_id = cursor.lastrowid
    else:
        client_id = client[0]

    # 2. Crear Licencia Full con 3 Submodulos
    # Nota: Usamos el campo 'notas' para especificar los submodulos segun el esquema actual
    fecha_inicio = datetime.date.today().isoformat()
    fecha_fin = (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
    submodulos = "INV-PRO, CLI-IA, ATLAS-KPI"
    
    cursor.execute("DELETE FROM licencias WHERE cliente_id = ?", (client_id,))
    cursor.execute("""
        INSERT INTO licencias (clave, tipo, dias, cliente_id, rubro, estado, fecha_inicio, fecha_fin, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("AX-LOCAL-FREE", "FULL", 365, client_id, "GENERAL", "Activa", fecha_inicio, fecha_fin, f"SUBMODULOS: {submodulos}"))

    conn.commit()
    conn.close()
    print(f"✅ Éxito: Cliente ID {client_id} (Miguel) configurado con 3 Submódulos: {submodulos}")

if __name__ == "__main__":
    activar()
