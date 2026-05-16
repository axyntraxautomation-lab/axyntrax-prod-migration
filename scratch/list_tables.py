import sqlite3
conn = sqlite3.connect('axyntrax.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables found:", c.fetchall())
conn.close()
