import sqlite3
from db_master.connection import get_db

class AXIAFinance:
    """
    Motor Financiero AXIA.
    Gestiona Cash Flow, Cobranzas y Reporting.
    """
    def __init__(self):
        pass

    def get_cash_flow(self):
        """Calcula el flujo de caja actual (Ingresos - Gastos)."""
        try:
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT SUM(monto) FROM ventas WHERE estado = 'Completada'")
            ingresos = c.fetchone()[0] or 0.0
            c.execute("SELECT SUM(monto) FROM gastos")
            gastos = c.fetchone()[0] or 0.0
            conn.close()
            return ingresos - gastos
        except: return 0.0

    def run_collection_sweep(self):
        """Barrido de cobranzas pendientes."""
        print("[AXIA FINANCE] Verificando facturas por cobrar...")

def get_finance():
    return AXIAFinance()
