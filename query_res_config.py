import sqlite3
conn = sqlite3.connect('axyntrax.db')
c = conn.cursor()
try:
    rows = c.execute("SELECT * FROM res_config;").fetchall()
    col_names = [description[0] for description in c.description]
    print("Registros en res_config:")
    for r in rows:
        print(dict(zip(col_names, r)))
except Exception as e:
    print("Error:", e)
conn.close()
