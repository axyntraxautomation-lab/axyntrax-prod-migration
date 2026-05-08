import hashlib
import json
import sqlite3
from datetime import datetime
from db_master.connection import get_db
import threading

audit_lock = threading.Lock()

def init_db():
    """Inicializa la base de datos Maestra con el esquema sincronizado."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Tabla Usuarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL,
        activo INTEGER DEFAULT 1
    )""")

    # 2. Tabla Clientes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa TEXT NOT NULL,
        contacto TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        ruc TEXT,
        ciudad TEXT,
        rubro TEXT,
        estado TEXT DEFAULT 'Prospecto',
        score INTEGER DEFAULT 0,
        puntos_lealtad INTEGER DEFAULT 0,
        categoria_vip TEXT DEFAULT 'Bronce',
        fecha_ultima_interaccion TEXT,
        fecha_nacimiento TEXT,
        fecha_aniversario TEXT,
        notas TEXT,
        usuario_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )""")

    # 3. Tabla Licencias
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS licencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        tipo TEXT NOT NULL,
        dias INTEGER NOT NULL,
        cliente_id INTEGER,
        rubro TEXT NOT NULL,
        estado TEXT DEFAULT 'Emitida',
        fecha_inicio TEXT,
        fecha_fin TEXT,
        creado_por INTEGER,
        notas TEXT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (creado_por) REFERENCES usuarios(id)
    )""")

    # 4. Tabla Ventas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        licencia_id INTEGER,
        monto REAL NOT NULL,
        etapa TEXT DEFAULT 'Cierre',
        estado TEXT DEFAULT 'Completada',
        metodo_pago TEXT,
        notas TEXT,
        usuario_id INTEGER,
        creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (licencia_id) REFERENCES licencias(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )""")

    # 5. Tabla Cobros
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cobros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        venta_id INTEGER,
        monto REAL NOT NULL,
        fecha_vencimiento TEXT,
        fecha_pago TEXT,
        estado TEXT DEFAULT 'Pendiente',
        metodo_pago TEXT,
        notas TEXT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
    )""")

    # 6. Tabla Gastos
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria TEXT,
        rubro TEXT DEFAULT 'General',
        descripcion TEXT,
        monto REAL,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )""")

    # 11. Tabla Logs de Auditoria (Inmutable)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        accion TEXT,
        tabla TEXT,
        registro_id INTEGER,
        rubro TEXT,
        detalles TEXT,
        hash_actual TEXT,
        hash_previo TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )""")

    # AXIA: REGISTRO GENESIS (Firma Maestra Inicial)
    cursor.execute("SELECT COUNT(*) FROM logs")
    if cursor.fetchone()[0] == 0:
        genesis_hash = hashlib.sha256(b"AXYNTRAX_DIAMANTE_GENESIS_v1.0").hexdigest()
        cursor.execute("""
            INSERT INTO logs (usuario_id, accion, tabla, registro_id, rubro, detalles, hash_actual, hash_previo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (None, 'SISTEMA', 'GENESIS', 0, 'SISTEMA', 'Iniciando AxyntraX Automation | Suite Diamante', genesis_hash, '0'*64))
        conn.commit()

    # AXIA: MEMORIA NEURONAL
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        context TEXT,
        interaction_type TEXT,
        sentiment TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )""")

    # AXIA: LOGS DE AUTONOMÍA
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_autonomy_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modulo TEXT,
        decision TEXT,
        nivel_riesgo TEXT,
        resultado TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # AXIA: PATRONES DE APRENDIZAJE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entidad TEXT,
        patron_clave TEXT,
        peso REAL DEFAULT 1.0,
        ultima_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # AXIA: CONTROL DE NOTIFICACIONES
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entidad_id INTEGER,
        tipo_aviso TEXT,
        fecha_envio TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # AXIA: CONFIGURACIÓN MAESTRA
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_config (
        key TEXT PRIMARY KEY,
        value TEXT
    )""")

    # AXIA: MARKETING INTELIGENTE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_programada TEXT,
        segmento TEXT,
        mensaje_raw TEXT,
        estado TEXT DEFAULT 'Pendiente',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_marketing_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        campana_id INTEGER,
        fecha_envio TEXT DEFAULT CURRENT_TIMESTAMP,
        resultado TEXT,
        interaccion TEXT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (campana_id) REFERENCES axia_campaigns(id)
    )""")

    # AXIA: AGENDA Y CITAS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        fecha_cita TEXT,
        asunto TEXT,
        ubicacion TEXT,
        resultado TEXT DEFAULT 'Pendiente',
        sync_provider TEXT DEFAULT 'Local',
        external_id TEXT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )""")

    # AXIA: REGISTRO DE REPORTES
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS axia_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT,
        nombre_archivo TEXT,
        ruta_archivo TEXT,
        fecha_generacion TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # AXIA: CRECIMIENTO (HUNTER)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads_v6 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT UNIQUE,
        score INTEGER DEFAULT 0,
        rubro TEXT,
        estado TEXT DEFAULT 'Nuevo',
        creado_en TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        tipo_seguimiento TEXT,
        estado_envio TEXT,
        fecha_disparo TEXT,
        resultado_log TEXT,
        FOREIGN KEY (lead_id) REFERENCES leads_v6(id)
    )""")

    # AXIA: AUDITORÍA DE BOTS (INMUTABLE)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bot_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id INTEGER,
        action_type TEXT,
        result TEXT,
        details TEXT,
        rubro TEXT,
        tenant_id TEXT,
        hash_signature TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # MÓDULO RESIDENCIAL (Mantenido para compatibilidad)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS res_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_condominio TEXT DEFAULT 'AXYNTRAX RESIDENCIAL',
        cta_principal TEXT DEFAULT 'PAGAR MANTENIMIENTO',
        logo_path TEXT,
        moneda TEXT DEFAULT 'S/',
        dia_cierre INTEGER DEFAULT 1,
        transparencia_activa INTEGER DEFAULT 1
    )""")

    conn.commit()
    conn.close()
    print("[DB_MASTER] Base de Datos Inicializada.")

def get_kpi_summary():
    """Obtiene métricas reales para el Dashboard Diamante."""
    summary = {"ingresos": 0.0, "pendientes": 0.0, "prospectos": 0, "licencias": 0}
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT SUM(monto) FROM ventas WHERE estado = 'Completada'")
        res = cursor.fetchone()
        summary["ingresos"] = res[0] if res[0] else 0.0
        
        cursor.execute("SELECT SUM(monto) FROM cobros WHERE estado = 'Pendiente'")
        res = cursor.fetchone()
        summary["pendientes"] = res[0] if res[0] else 0.0
        
        cursor.execute("SELECT COUNT(*) FROM clientes WHERE estado = 'Prospecto'")
        summary["prospectos"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM licencias WHERE estado IN ('Emitida', 'INSTALACIÓN EXITOSA', 'Activa')")
        summary["licencias"] = cursor.fetchone()[0]
        
        conn.close()
    except Exception as e:
        print(f"[DB ERROR] get_kpi_summary: {e}")
    return summary

def insert_audit_log(usuario_id, accion, tabla, registro_id, rubro="General", detalles=""):
    """Inserta un log con firma criptográfica encadenada (Thread-Safe)."""
    with audit_lock:
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            cursor.execute("SELECT hash_actual FROM logs ORDER BY id DESC LIMIT 1")
            res = cursor.fetchone()
            last_hash = res[0] if res else "0"*64
            
            log_payload = f"{usuario_id}{accion}{tabla}{registro_id}{rubro}{detalles}{last_hash}"
            signature = hashlib.sha256(log_payload.encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO logs (usuario_id, accion, tabla, registro_id, rubro, detalles, hash_actual, hash_previo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (usuario_id, accion, tabla, registro_id, rubro, detalles, signature, last_hash))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"[DB ERROR] insert_audit_log: {e}")
            return False

if __name__ == "__main__":
    init_db()
