import sqlite3

def init_db():
    conn = sqlite3.connect('axyntrax.db')
    c = conn.cursor()
    
    print("Creating infrastructure tables in axyntrax.db...")
    
    c.execute("""
    CREATE TABLE IF NOT EXISTS neo_projects (
        id TEXT PRIMARY KEY,
        quote_folio TEXT,
        name TEXT,
        status TEXT,
        git_branch TEXT,
        deadline TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    c.execute("""
    CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        assigned_to TEXT,
        step_name TEXT,
        status TEXT DEFAULT 'PENDING',
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    print("INFRASTRUCTURE TABLES CREATED SUCCESSFULLY IN SQLITE.")

if __name__ == "__main__":
    init_db()
