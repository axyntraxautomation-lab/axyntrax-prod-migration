import sqlite3

conn = sqlite3.connect("axyntrax.db")
cursor = conn.cursor()
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", tables)
    
    for table in tables:
        t_name = table[0]
        try:
            cursor.execute(f"SELECT * FROM {t_name} WHERE email LIKE '%montero%';")
            rows = cursor.fetchall()
            if rows:
                print(f"\n--- FOUND IN {t_name} ---")
                print(rows)
        except Exception:
            pass
            
    try:
        # Let's search generic columns too
        cursor.execute("SELECT * FROM clientes;")
        print("\nClientes Table:")
        for r in cursor.fetchall():
            print(r)
    except Exception as e:
        print(f"Error reading clientes: {e}")
except Exception as e:
    print(f"General Error: {e}")
finally:
    conn.close()
