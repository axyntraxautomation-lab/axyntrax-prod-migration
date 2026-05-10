import json

def generate_sql():
    with open('schema_local.json', 'r', encoding='utf-8') as f:
        schema = json.load(f)
    
    sql = []
    sql.append("-- ===============================================")
    sql.append("-- MIGRACION AXYNTRAX A SUPABASE (POSTGRESQL)")
    sql.append("-- Generado por Antigravity")
    sql.append("-- ===============================================")
    sql.append("\n-- 1. Activar extensiones")
    sql.append('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n')

    sql.append("-- 2. Tablas Existentes (Migradas de SQLite)")
    type_map = {
        "INTEGER": "BIGINT",
        "TEXT": "TEXT",
        "REAL": "NUMERIC",
        "BLOB": "BYTEA"
    }

    for table, cols in schema.items():
        sql.append(f"CREATE TABLE IF NOT EXISTS public.{table} (")
        defs = []
        for c in cols:
            p_type = type_map.get(c["type"].upper(), "TEXT")
            d = f'    "{c["name"]}" {p_type}'
            if c["pk"]:
                if p_type == "BIGINT":
                    d = f'    "{c["name"]}" BIGSERIAL PRIMARY KEY'
                else:
                    d += " PRIMARY KEY"
            elif c["notnull"]:
                d += " NOT NULL"
            
            if c["dflt_value"] and not c["pk"]:
                val = c["dflt_value"]
                if "CURRENT_TIMESTAMP" in val.upper():
                    d += " DEFAULT NOW()"
                else:
                    d += f" DEFAULT {val}"
            defs.append(d)
        sql.append(",\n".join(defs))
        sql.append(");\n")

    sql.append("-- 3. Nuevas Tablas Requeridas para el Dashboard Gerencial")
    
    sql.append("""
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    master_key TEXT UNIQUE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    role TEXT DEFAULT 'worker',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    description TEXT,
    download_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kpis (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_list (
    id SERIAL PRIMARY KEY,
    plan_name TEXT NOT NULL,
    price_pen NUMERIC NOT NULL,
    benefits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    """)
    
    sql.append("\n-- 4. Politicas de Seguridad Básicas (RLS)")
    sql.append("ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;")
    sql.append("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;")
    
    with open('migration_supabase.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(sql))
    print("migration_supabase.sql generated successfully.")

if __name__ == "__main__":
    generate_sql()
