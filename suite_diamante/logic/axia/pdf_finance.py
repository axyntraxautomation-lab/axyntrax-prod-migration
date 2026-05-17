import os
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from db_master.connection import BASE_DIR

class AXIAPDFManager:
    """
    Gestor de Reportes en PDF AXIA.
    Genera estados de cuenta y cotizaciones profesionales con branding AXYNTRAX.
    """
    def __init__(self):
        self.output_dir = os.path.join(BASE_DIR, "reportes")
        os.makedirs(self.output_dir, exist_ok=True)
        self.pricing_base = 235.00 # Soles PEN inc. IGV

    def generate_financial_report(self, data):
        """Genera un reporte financiero o cotización en PDF con narrativa premium."""
        fecha_str = data.get('fecha', datetime.datetime.now().strftime("%Y-%m-%d"))
        cliente = data.get('cliente', "CLIENTE PROSPECTO")
        path = os.path.join(self.output_dir, f"COTIZACION_{cliente.replace(' ', '_')}_{fecha_str}.pdf")
        
        c = canvas.Canvas(path, pagesize=letter)
        width, height = letter

        # Branding Header
        c.setFillColor(colors.HexColor("#0D0D0D"))
        c.rect(0, height - 100, width, 100, fill=1)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, height - 60, "AXYNTRAX AUTOMATION")
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 80, "Orquestación Inteligente B2B | www.axyntrax-automation.net")

        # Cliente Info
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 140, f"DIRIGIDO A: {cliente}")
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 160, f"FECHA DE EMISIÓN: {fecha_str}")
        c.drawString(50, height - 175, f"VALIDEZ: 15 DÍAS CALENDARIO")

        # Detalle de Inversión
        c.setStrokeColor(colors.HexColor("#00E5FF"))
        c.setLineWidth(2)
        c.line(50, height - 200, width - 50, height - 200)

        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 230, "RESUMEN DE SOLUCIÓN: PLAN BASE + CECILIA IA")
        
        c.setFont("Helvetica", 11)
        c.drawString(50, height - 260, "• Implementación de Cecilia IA (WhatsApp, FB, IG, Web)")
        c.drawString(50, height - 280, "• 3 Submódulos especializados por rubro (À La Carte)")
        c.drawString(50, height - 300, "• Panel de Control JARVIS & Monitoreo ATLAS")
        c.drawString(50, height - 320, "• Soporte técnico prioritario y actualizaciones cloud")

        # Pricing Table
        c.setFillColor(colors.HexColor("#F4F4F4"))
        c.rect(50, height - 420, width - 100, 60, fill=1)
        
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(70, height - 390, "INVERSIÓN TOTAL MENSUAL")
        c.drawRightString(width - 70, height - 390, f"S/ {self.pricing_base:.2f}")
        
        c.setFont("Helvetica", 9)
        c.drawString(70, height - 410, "* Precios expresados en Soles PEN. Incluye IGV.")

        # Footer / CTA
        c.setFont("Helvetica-Oblique", 10)
        c.setFillColor(colors.grey)
        c.drawCentredString(width/2, 50, "Para activar su servicio, responda con 'SÍ' en WhatsApp o visite nuestra web.")
        
        c.save()
        return path

def get_pdf():
    return AXIAPDFManager()
