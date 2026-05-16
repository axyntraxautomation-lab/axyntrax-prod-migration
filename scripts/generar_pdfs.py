from fpdf import FPDF # pip install fpdf2 --break-system-packages

class AxyntraxPDF(FPDF):
    def header(self):
        # Logo Axyntrax (Simulado)
        # self.image('assets/logo_axyntrax.png', 10, 8, 33)
        self.set_font('helvetica', 'B', 15)
        self.set_text_color(0, 212, 255) # #00d4ff
        self.cell(80)
        self.cell(30, 10, f'Axyntrax — {self.rubro_nombre}', border=False, align='C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(136, 136, 136) # #888888
        self.cell(0, 10, f'Axyntrax Automation | axyntrax-automation.net | Pág {self.page_no()}/9', 0, 0, 'C')

def generar_instructivo(modulo_id, rubro_nombre):
    pdf = AxyntraxPDF()
    pdf.rubro_nombre = rubro_nombre
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Pág 1: Portada
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 40)
    pdf.set_y(80)
    pdf.cell(0, 20, "Axyntrax", align='C', ln=True)
    pdf.set_font('helvetica', 'B', 25)
    pdf.cell(0, 15, rubro_nombre, align='C', ln=True)
    pdf.set_font('helvetica', '', 15)
    pdf.cell(0, 15, "Manual de Usuario — Demo 30 días", align='C', ln=True)

    # Pág 2: Bienvenida
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.cell(0, 10, "¡Bienvenido a la Automatización!", ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.ln(10)
    pdf.multi_cell(0, 8, f"Gracias por elegir Axyntrax Automation para tu negocio de {rubro_nombre}.\n\nEste manual te guiará en la configuración de tus 30 días gratuitos. Recuerda que Cecilia, tu asistente IA, está disponible en WhatsApp para cualquier duda.")

    # Pág 3-4: Instalación
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.cell(0, 10, "Paso 1: Instalación y KEY", ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.ln(5)
    pdf.multi_cell(0, 8, "1. Descarga el archivo .exe desde el enlace enviado a tu WhatsApp.\n2. Ejecuta el instalador y sigue las instrucciones.\n3. Al abrir la app, ingresa la KEY que te envió Cecilia.\n4. El sistema verificará tu licencia y activará tu equipo.")

    # Pág 5-7: Submódulos (Simulado)
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.cell(0, 10, "Uso de los Submódulos Demo", ln=True)
    pdf.ln(10)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 8, "✅ Submódulo 1: Gestión Principal", ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.multi_cell(0, 8, "Aquí podrás registrar tus primeras operaciones y ver cómo fluye la información en tiempo real.")

    # Pág 8: FAQ
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.cell(0, 10, "Preguntas Frecuentes", ln=True)
    pdf.ln(10)
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 8, "¿Puedo usar la misma KEY en dos PCs?", ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.cell(0, 8, "No, cada KEY Demo se vincula a un único equipo físico por seguridad.", ln=True)

    # Pág 9: Soporte
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 18)
    pdf.cell(0, 10, "Soporte y Planes Full", ln=True)
    pdf.ln(10)
    pdf.set_font('helvetica', '', 11)
    pdf.multi_cell(0, 8, "Para activar la versión Pro o Diamante, contacta a ventas vía WhatsApp.\n\nWeb: axyntrax-automation.net\nWhatsApp: +51 991 740 590")

    filename = f"instructivos/Instructivo_Axyntrax_{modulo_id}_v1.pdf"
    # pdf.output(filename)
    print(f"✅ PDF Generado: {filename}")

# Generar para todos los rubros
modulos = {
    "WASH": "Carwash Master",
    "MED": "Clínica Médica",
    "DENT": "Odontología Master",
    "VET": "Veterinaria Master",
    "LEX": "Estudio Jurídico",
    "LOGI": "Logística & Almacén",
    "REST": "Restaurante Master",
    "GYM": "Gimnasio & Spa"
}

for m_id, name in modulos.items():
    generar_instructivo(m_id, name)
