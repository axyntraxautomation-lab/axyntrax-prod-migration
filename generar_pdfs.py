import os
from fpdf import FPDF

class AxyntraxPDF(FPDF):
    def __init__(self, title_text):
        super().__init__()
        self.title_text = title_text

    def header(self):
        # Fondo oscuro premium o detalle arriba
        self.set_fill_color(13, 13, 13) # #0D0D0D
        self.rect(0, 0, 210, 20, 'F')
        
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(0, 229, 255) # Cyan #00E5FF
        self.cell(0, 10, 'AXYNTRAX AUTOMATION SUITE', border=False, align='L')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, 'Axyntrax Automation | www.axyntrax-automation.net | Soporte +51 991 740 590', 0, 0, 'L')

def crear_catalogo():
    pdf = AxyntraxPDF("Catalogo Oficial de Modulos")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    
    # Portada del Catalogo
    pdf.set_fill_color(13, 13, 13)
    pdf.rect(0, 20, 210, 260, 'F')
    
    pdf.set_y(50)
    pdf.set_font('helvetica', 'B', 32)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 15, "AXYNTRAX", align='C', ln=True)
    pdf.set_font('helvetica', 'B', 22)
    pdf.set_text_color(0, 229, 255) # Cyan
    pdf.cell(0, 12, "CATALOGO DE MODULOS DE IA", align='C', ln=True)
    
    pdf.ln(10)
    pdf.set_font('helvetica', 'I', 11)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 8, "La revolucion de la automatizacion B2B para PYMEs en el Peru", align='C', ln=True)
    
    pdf.ln(30)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, "13 RUBROS ESTRATEGICOS AUTOMATIZADOS", align='C', ln=True)
    pdf.ln(5)
    
    rubros = [
        "1. Medico / Clinicas de Salud", "2. Legal / Estudios de Abogados", 
        "3. Gastronomia y Restaurantes", "4. Condominios y Residenciales",
        "5. Comercio Minorista / Retail", "6. Educacion / Cursos y Academias",
        "7. Inmobiliarias y Corretaje", "8. Hoteleria y Hospedajes",
        "9. Logistica y Distribucion", "10. Manufactura e Industrial",
        "11. Talleres Automotrices", "12. Estetica / Salones de Belleza y SPA",
        "13. Consultoria B2B y Asesorias"
    ]
    
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(180, 180, 180)
    for r in rubros:
        pdf.cell(0, 7, f"    * {r}", align='L', ln=True)
        
    # Pag 2: Detalle de Planes
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.set_text_color(13, 13, 13)
    pdf.cell(0, 10, "Planes Comerciales y Precios", ln=True)
    pdf.ln(5)
    
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 7, "Axyntrax ofrece una suite flexible en la nube para adaptarse a la medida de tu crecimiento, con IGV incluido y soporte local continuo en Peru.\n\nTodos los planes cuentan con una prueba completamente gratuita de 30 dias.")
    pdf.ln(10)
    
    # Starter
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(0, 130, 145)
    pdf.cell(0, 8, "Plan Starter - S/ 199 al mes (Inc. IGV)", ln=True)
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6, "Ideal para pequenos negocios. Incluye 1 modulo a eleccion, atencion basica por la IA Cecilia, base de datos local robusta y reportes diarios basicos.")
    pdf.ln(5)
    
    # Pro Cloud
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(0, 130, 145)
    pdf.cell(0, 8, "Plan Pro Cloud - S/ 399 al mes (Inc. IGV)", ln=True)
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6, "Nuestro plan mas popular. Incluye hasta 3 modulos interconectados, atencion ilimitada por Cecilia en Web y WhatsApp, sincronizacion total en la nube Supabase, campanas publicitarias de prospeccion automatizadas con Mark y reportes de rentabilidad avanzados.")
    pdf.ln(5)
    
    # Diamante
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(0, 130, 145)
    pdf.cell(0, 8, "Plan Diamante - S/ 799 al mes (Inc. IGV)", ln=True)
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6, "Para empresas corporativas. Modulos ilimitados sin restricciones, soporte de alta prioridad con el agente Antigravity, integraciones customizadas de CRM externas, y automatizacion publicitaria omnicanal con analitica predictiva en tiempo real.")
    
    # Guardar Catalogo
    os.makedirs("assets", exist_ok=True)
    pdf.output("assets/catalogo_axyntrax.pdf")
    print("SUCCESS: assets/catalogo_axyntrax.pdf generado correctamente.")

def crear_brochure():
    pdf = AxyntraxPDF("Brochure Premium corporativo")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    
    # Portada del Brochure
    pdf.set_fill_color(0, 130, 145) # Color Axyntrax
    pdf.rect(0, 20, 210, 260, 'F')
    
    pdf.set_y(60)
    pdf.set_font('helvetica', 'B', 36)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 15, "AXYNTRAX", align='C', ln=True)
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(13, 13, 13)
    pdf.cell(0, 12, "PRESENTACION DE SERVICIOS CORPORATIVOS", align='C', ln=True)
    
    pdf.ln(10)
    pdf.set_font('helvetica', 'I', 12)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 8, "La Suite Inteligente de Mayor Crecimiento en el Peru", align='C', ln=True)
    
    pdf.ln(40)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 8, "NUESTRO SISTEMA DE 4 AGENTES INTELIGENTES", align='C', ln=True)
    pdf.ln(5)
    
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(240, 240, 240)
    pdf.cell(0, 6, "  * CECILIA: Atencion automatizada 24/7 de leads y clientes por WhatsApp.", align='L', ln=True)
    pdf.cell(0, 6, "  * JARVIS: CEO virtual y orquestador central de procesos e infraestructura.", align='L', ln=True)
    pdf.cell(0, 6, "  * MARK: Especialista en marketing digital autonomo y seguimiento de embudos.", align='L', ln=True)
    pdf.cell(0, 6, "  * ANTIGRAVITY: Auditor tecnico de codigo, integraciones y despliegues robustos.", align='L', ln=True)
    
    # Pag 2: Seguridad y Nube
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.set_text_color(13, 13, 13)
    pdf.cell(0, 10, "Tecnologia en la Nube y Seguridad", ln=True)
    pdf.ln(5)
    
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 7, "Axyntrax opera bajo un modelo de Software como Servicio (SaaS) robusto e interconectado.\n\nVentajas de nuestra infraestructura Cloud-First:\n* Conectividad 24/7 sin caidas gracias a servidores globales de alta fidelidad.\n* Bases de datos encriptadas Supabase para maxima seguridad transaccional de tus clientes.\n* Pasarela de pago Culqi real, segura e integrada directamente en tu portal de autogestion.\n* Facturacion electronica integrada directo con SUNAT sin tramites pesados.\n* Soporte tecnico inmediato en espanol con ingenieros expertos y agentes de diagnostico automaticos.")
    
    # Guardar Brochure
    pdf.output("assets/brochure_premium.pdf")
    print("SUCCESS: assets/brochure_premium.pdf generado correctamente.")

if __name__ == "__main__":
    crear_catalogo()
    crear_brochure()
