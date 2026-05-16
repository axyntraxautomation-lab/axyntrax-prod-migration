import sqlite3
conn = sqlite3.connect('axyntrax.db')
c = conn.cursor()
try:
    tablas = c.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    print("Tablas en axyntrax.db:", [t[0] for t in tablas])
    
    if ('licencias',) in tablas:
        rows = c.execute("SELECT * FROM licencias ORDER BY id DESC LIMIT 5;").fetchall()
        col_names = [description[0] for description in c.description]
        print("Licencias (últimas 5):")
        for r in rows:
            print(dict(zip(col_names, r)))
except Exception as e:
    print("Error:", e)
conn.close()
