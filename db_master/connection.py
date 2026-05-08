import sqlite3
import os

# Configuración Maestra de Base de Datos
BASE_DIR = os.path.abspath(".")
DB_PATH = os.path.join(BASE_DIR, "data", "axyntrax.db")

class DBConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DBConnection, cls).__new__(cls)
            cls._instance.path = DB_PATH
            os.makedirs(os.path.dirname(cls._instance.path), exist_ok=True)
        return cls._instance

    def get_connection(self):
        """Devuelve una conexión a la base de datos con soporte para Foreign Keys y Concurrencia WAL."""
        conn = sqlite3.connect(self.path, timeout=20)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.row_factory = sqlite3.Row  # Permite acceso por nombre de columna
        return conn

def get_db():
    return DBConnection().get_connection()
