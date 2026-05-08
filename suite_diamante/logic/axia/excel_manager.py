import os
import pandas as pd
from db_master.connection import get_db, BASE_DIR

class AXIAExcelManager:
    """
    Gestor de Reportes en Excel AXIA.
    Exporta datos de la base de datos maestra a formatos legibles por humanos.
    """
    def __init__(self):
        self.output_dir = os.path.join(BASE_DIR, "reportes")
        os.makedirs(self.output_dir, exist_ok=True)

    def export_clients(self):
        """Exporta la lista de clientes a Excel."""
        try:
            conn = get_db()
            df = pd.read_sql_query("SELECT * FROM clientes", conn)
            path = os.path.join(self.output_dir, "CLIENTES_MASTRER.xlsx")
            df.to_excel(path, index=False)
            conn.close()
            return path
        except Exception as e: return f"Error: {e}"

def get_excel():
    return AXIAExcelManager()
