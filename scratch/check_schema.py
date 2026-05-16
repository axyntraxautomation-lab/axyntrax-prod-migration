import sqlite3
import json

db_path = r"C:\Users\YARVIS\.gemini\antigravity\scratch\AXYNTRAX_AUTOMATION_Suite\axyntrax.db"

def get_schema():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in c.fetchall()]
    
    schema = {}
    for table in tables:
        c.execute(f"PRAGMA table_info({table});")
        schema[table] = c.fetchall()
    
    conn.close()
    return schema

if __name__ == "__main__":
    print(json.dumps(get_schema(), indent=2))
