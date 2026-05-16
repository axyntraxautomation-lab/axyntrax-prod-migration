"""
Backend SQLite solo para entorno desktop / desarrollo local.
No usar en despliegues serverless (Vercel): allí la persistencia web va por Supabase (api/index.js).
"""
import os
import sqlite3
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_master")

# Raíz del repo (padre de db_master/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _resolve_db_path() -> str:
    explicit = os.environ.get("AXYNTRAX_SQLITE_PATH", "").strip()
    if explicit:
        return os.path.abspath(explicit)
    base_dir = os.path.abspath(".")
    return os.path.join(base_dir, "data", "axyntrax.db")


DB_PATH = _resolve_db_path()


class DBConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DBConnection, cls).__new__(cls)
            cls._instance.path = DB_PATH
            os.makedirs(os.path.dirname(cls._instance.path), exist_ok=True)
        return cls._instance

    def get_connection(self, max_retries=5, initial_backoff=0.05):
        retries = 0
        backoff = initial_backoff
        while retries < max_retries:
            try:
                conn = sqlite3.connect(self.path, timeout=20)
                conn.execute("PRAGMA journal_mode=WAL;")
                conn.execute("PRAGMA foreign_keys = ON;")
                conn.row_factory = sqlite3.Row
                return conn
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e).lower() or "busy" in str(e).lower():
                    retries += 1
                    logger.warning(f"[DB LOCKED] Base de datos ocupada. Reintento {retries}/{max_retries} en {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    raise e
        raise sqlite3.OperationalError("La base de datos permanece bloqueada tras multiples reintentos.")


def get_db():
    return DBConnection().get_connection()
