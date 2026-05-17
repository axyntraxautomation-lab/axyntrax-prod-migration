# -*- coding: utf-8 -*-
"""
Script de Migración Idempotente a Supabase - AXYNTRAX Automation Suite.
Generado por Antigravity.
"""

import os
import json
from typing import Any, Dict, List, Optional
from supabase import create_client, Client

def load_env():
    """Carga variables del archivo .env a os.environ si existe."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        print(f"[Env] Cargando variables desde: {env_path}")
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    v = v.strip().strip('"').strip("'")
                    k = k.strip()
                    os.environ[k] = v
    else:
        print("[Env] Archivo .env no encontrado. Usando variables de entorno del sistema.")

def run_ddl_queries(supabase: Client) -> bool:
    """Ejecuta los scripts DDL de creación de tablas usando los RPCs exec_sql o execute_sql."""
    ddl_query = """
    CREATE TABLE IF NOT EXISTS public.clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        email TEXT,
        telefono TEXT,
        fecha_registro TEXT,
        plan TEXT,
        renovacion TEXT,
        acceso_key TEXT
    );

    CREATE TABLE IF NOT EXISTS public.facturacion (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        monto NUMERIC,
        fecha_emision TEXT,
        estado TEXT,
        nro_comprobante TEXT
    );

    CREATE TABLE IF NOT EXISTS public.activaciones (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        modulo TEXT,
        fecha_activacion TEXT,
        licencia_key TEXT,
        estado TEXT
    );

    CREATE TABLE IF NOT EXISTS public.tickets (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        asunto TEXT,
        mensaje TEXT,
        estado TEXT,
        fecha_creacion TEXT,
        prioridad TEXT,
        agente_asignado TEXT,
        respuestas JSONB
    );

    CREATE TABLE IF NOT EXISTS public.faq (
        id TEXT PRIMARY KEY,
        categoria TEXT,
        pregunta TEXT,
        respuesta TEXT,
        rubros JSONB
    );

    CREATE TABLE IF NOT EXISTS public.integraciones (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        tipo TEXT,
        estado TEXT,
        ultima_validacion TEXT,
        latencia_ms INTEGER
    );

    CREATE TABLE IF NOT EXISTS public.onboarding (
        id TEXT PRIMARY KEY,
        paso_numero INTEGER,
        titulo TEXT,
        descripcion TEXT,
        tipo TEXT,
        obligatorio BOOLEAN,
        estado TEXT,
        cliente_id TEXT,
        fecha_completado TEXT
    );

    CREATE TABLE IF NOT EXISTS public.usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        email TEXT,
        username TEXT,
        password TEXT,
        rol TEXT,
        permisos JSONB,
        fecha_creacion TEXT,
        activo BOOLEAN
    );

    CREATE TABLE IF NOT EXISTS public.tareas (
        id TEXT PRIMARY KEY,
        titulo TEXT,
        descripcion TEXT,
        responsable TEXT,
        prioridad TEXT,
        estado TEXT,
        fecha_creacion TEXT,
        fecha_limite TEXT
    );

    CREATE TABLE IF NOT EXISTS public.agenda (
        id TEXT PRIMARY KEY,
        hora TEXT,
        actividad TEXT,
        responsable TEXT,
        recurrencia TEXT,
        activo BOOLEAN
    );

    CREATE TABLE IF NOT EXISTS public.publicidad (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        nombre TEXT,
        canal TEXT,
        presupuesto NUMERIC,
        estado TEXT,
        clics INTEGER,
        impresiones INTEGER,
        conversiones INTEGER,
        fecha_creacion TEXT
    );
    """
    
    print("[DDL] Intentando crear las tablas necesarias en Supabase...")
    
    # Intentar con el RPC exec_sql
    try:
        res = supabase.rpc("exec_sql", {"query": ddl_query}).execute()
        print("[DDL] Tablas verificadas/creadas con éxito vía RPC 'exec_sql'. ✅")
        return True
    except Exception as e1:
        print(f"[DDL] RPC 'exec_sql' falló: {e1}. Intentando con RPC 'execute_sql'...")
        
        # Intentar con el RPC execute_sql
        try:
            res = supabase.rpc("execute_sql", {"sql": ddl_query}).execute()
            print("[DDL] Tablas verificadas/creadas con éxito vía RPC 'execute_sql'. ✅")
            return True
        except Exception as e2:
            print(f"[DDL] RPC 'execute_sql' también falló: {e2}.")
            print("[DDL] Se asume que las tablas ya existen o se crearon externamente vía consola SQL.")
            return False

def migrar_tabla(supabase: Client, table_name: str) -> int:
    """Lee el JSON local correspondiente y lo migra a Supabase usando upsert."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    json_path = os.path.join(base_dir, "data", f"{table_name}.json")
    
    if not os.path.exists(json_path):
        print(f"[Migración] Archivo {table_name}.json no existe localmente. Omitiendo.")
        return 0
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            records = json.load(f)
    except Exception as e:
        print(f"[Migración] Error al leer {table_name}.json: {e}")
        return 0
        
    if not isinstance(records, list) or len(records) == 0:
        print(f"[Migración] No hay registros para migrar en {table_name}.json.")
        return 0
        
    print(f"[Migración] Cargando {len(records)} registros a la tabla '{table_name}'...")
    try:
        # Upsert en Supabase para evitar duplicación (idempotencia garantizada por la columna clave primaria 'id')
        res = supabase.table(table_name).upsert(records).execute()
        migrated_count = len(records)
        print(f"[Migración] Tabla '{table_name}' completada con éxito. Registros: {migrated_count} ✅")
        return migrated_count
    except Exception as e:
        print(f"[Migración] Error migrando tabla '{table_name}': {e}")
        return 0

def main():
    print("==================================================================")
    print("MIGRACIÓN A SUPABASE INICIADA - ECOSISTEMA AXYNTRAX")
    print("==================================================================")
    
    load_env()
    
    supabase_url = os.getenv("SUPABASE_URL")
    # Intentamos cargar la llave de mayor privilegio (service role) y caemos en anon key si no está
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key or "PENDIENTE" in supabase_url or "PENDIENTE" in supabase_key:
        print("[Alerta] Credenciales de Supabase no configuradas o en modo STUB.")
        print("[Alerta] Modifique el archivo .env o las variables de entorno de Vercel.")
        print("[Alerta] Finalizando ejecución en modo simulación (no se realizaron cambios en la nube).")
        return
        
    print(f"[Supabase] Conectando a {supabase_url}...")
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("[Supabase] Conexión establecida con éxito. ✅")
    except Exception as e:
        print(f"[Error] No se pudo inicializar el cliente de Supabase: {e}")
        return

    # 1. Ejecutar DDL
    run_ddl_queries(supabase)
    
    # 2. Migrar Tablas
    tablas = [
        "clientes", "facturacion", "activaciones", "tickets", "faq", 
        "integraciones", "onboarding", "usuarios", "tareas", "agenda", "publicidad"
    ]
    
    resumen_migracion = {}
    total_general = 0
    
    for t in tablas:
        count = migrar_tabla(supabase, t)
        resumen_migracion[t] = count
        total_general += count
        
    print("\n==================================================================")
    print("RESUMEN DE MIGRACIÓN DE DATOS:")
    print("==================================================================")
    for t, count in resumen_migracion.items():
        print(f" - Tabla {t.ljust(15)}: {str(count).rjust(4)} registros migrados.")
    print("------------------------------------------------------------------")
    print(f" TOTAL GENERAL: {total_general} registros migrados con éxito. ✅")
    print("==================================================================\n")

if __name__ == "__main__":
    main()
