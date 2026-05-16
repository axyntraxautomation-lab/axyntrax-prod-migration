import sqlite3

def debug():
    conn = sqlite3.connect('axyntrax.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tablas encontradas:", tables)
    
    for table in tables:
        tname = table[0]
        cursor.execute(f"PRAGMA table_info({tname});")
        info = cursor.fetchall()
        print(f"\nEsquema de {tname}:")
        for col in info:
            print(f" - {col[1]} ({col[2]})")
            
    conn.close()

if __name__ == "__main__":
    debug()
