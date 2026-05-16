import sqlite3

try:
    conn = sqlite3.connect('axyntrax.db')
    c = conn.cursor()
    c.execute("SELECT telefono, contacto FROM clientes LIMIT 5;")
    rows = c.fetchall()
    for row in rows:
        print(f"CLIENTE: {row[1]} | TEL: {row[0]}")
    conn.close()
except Exception as e:
    print(f"ERROR DB: {e}")
