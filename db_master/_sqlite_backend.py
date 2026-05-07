"""
Backend SQLite solo para entorno desktop / desarrollo local.
No usar en despliegues serverless (Vercel): allí la persistencia web va por Supabase (api/index.js).
"""
import os
import sqlite3

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

    def get_connection(self):
        conn = sqlite3.connect(self.path, timeout=20)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.row_factory = sqlite3.Row
        return conn


def get_db():
    return DBConnection().get_connection()
