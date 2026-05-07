"""
Capa de conexión a datos.

- Producción serverless (Vercel): sin SQLite; los leads y la API pública usan Supabase.
- Desktop / local: SQLite opcional vía db_master._sqlite_backend (deshabilitable).
"""
import os

# Siempre exportado para módulos que resuelven rutas de archivos (pdf, excel, etc.)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _sqlite_allowed() -> bool:
    # Vercel inyecta VERCEL=1 y VERCEL_ENV (production|preview|development). Sin sqlite3 en serverless.
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"):
        return False
    if os.environ.get("AXYNTRAX_DISABLE_SQLITE", "").lower() in ("1", "true", "yes"):
        return False
    return True


if _sqlite_allowed():
    from db_master._sqlite_backend import DB_PATH, DBConnection, get_db  # noqa: E402,F401
else:
    DB_PATH = None

    class DBConnection:  # noqa: D101
        def get_connection(self):
            raise RuntimeError(_SERVERLESS_DB_MSG)

    def get_db():
        raise RuntimeError(_SERVERLESS_DB_MSG)


_SERVERLESS_DB_MSG = (
    "SQLite no está habilitado en este entorno (VERCEL/VERCEL_ENV o AXYNTRAX_DISABLE_SQLITE). "
    "La landing y /api/registro-demo usan Supabase vía api/index.js. "
    "Para suite desktop en local: sin VERCEL/VERCEL_ENV y sin AXYNTRAX_DISABLE_SQLITE."
)
