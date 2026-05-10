import sqlite3
import json

def extract_schema():
    conn = sqlite3.connect('axyntrax.db')
    cursor = conn.cursor()
    
    # Get tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall() if not t[0].startswith('sqlite_')]
    
    full_schema = {}
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table});")
        columns = cursor.fetchall()
        # Format: cid, name, type, notnull, dflt_value, pk
        full_schema[table] = [
            {"name": col[1], "type": col[2], "notnull": bool(col[3]), "dflt_value": col[4], "pk": bool(col[5])}
            for col in columns
        ]
    
    with open('schema_local.json', 'w', encoding='utf-8') as f:
        json.dump(full_schema, f, indent=2)
    
    print("Schema extracted to schema_local.json")
    print(f"Extracted tables: {', '.join(tables)}")

if __name__ == "__main__":
    extract_schema()
