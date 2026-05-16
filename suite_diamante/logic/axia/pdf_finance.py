import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from db_master.connection import BASE_DIR

class AXIAPDFManager:
    """
    Gestor de Reportes en PDF AXIA.
    Genera estados de cuenta y facturas profesionales.
    """
    def __init__(self):
        self.output_dir = os.path.join(BASE_DIR, "reportes")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_financial_report(self, data):
        """Genera un reporte financiero en PDF."""
        path = os.path.join(self.output_dir, f"REPORTE_FINANCIERO_{data['fecha']}.pdf")
        c = canvas.Canvas(path, pagesize=letter)
        c.drawString(100, 750, f"AXYNTRAX - REPORTE FINANCIERO")
        c.drawString(100, 730, f"Fecha: {data['fecha']}")
        c.drawString(100, 710, f"Ingresos: S/. {data['ingresos']}")
        c.save()
        return path

def get_pdf():
    return AXIAPDFManager()
