import os
import re
import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fpdf import FPDF  # fpdf2 instalado
import google.generativeai as genai
from firebase_admin import storage
from dotenv import load_dotenv

load_dotenv()

# Configuración de IA (Google Gemini 2.0 Flash)
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

SYSTEM_PROMPT = """
Eres AXIA, la IA experta en automatización B2B de AXYNTRAX.
Tu objetivo es calificar leads, presentar soluciones y cerrar contratos.
Tono: Profesional, peruano, resolutivo.
Planes de Precios (SIEMPRE COTIZAR EN SOLES + IGV):
- Starter: S/ 199/mes + IGV (1 Bot, Básico)
- Pro Cloud: S/ 399/mes + IGV (2 Bots, Analytics, Soporte)
- Diamante: S/ 799/mes + IGV (Bots ilimitados, Dashboard Gerencial, IA Avanzada)
"""

def get_axia_response(history, system_override: str = None):
    """Llamada al cerebro de AXIA/CECILIA usando Gemini 2.0 Flash."""
    if not GEMINI_KEY:
        return "Modo Simulación: CECILIA recibió mensaje. (Configura GEMINI_API_KEY para IA real)"
        
    try:
        system = system_override if system_override else SYSTEM_PROMPT
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system
        )
        
        # Convertir historial al formato Gemini
        chat_history = []
        for msg in history[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            chat_history.append({"role": role, "parts": [msg["content"]]})
            
        chat = model.start_chat(history=chat_history)
        response = chat.send_message(history[-1]["content"])
        
        return response.text.strip()
    except Exception as e:
        print(f"[AXIA IA ERR] {e}")
        return "Disculpa, tengo una breve interrupción técnica. ¿Puedes repetir tu consulta? Te respondo de inmediato. 🙏"

def generate_quote_pdf(lead_name, empresa, plan, precio):
    """Genera una cotización formal en PDF"""
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, "COTIZACIÓN FORMAL - AXYNTRAX AUTOMATION", 0, 1, 'C')
    pdf.ln(10)
    
    # Body
    pdf.set_font("Arial", '', 12)
    pdf.cell(200, 10, f"Cliente: {lead_name}", 0, 1)
    pdf.cell(200, 10, f"Empresa: {empresa}", 0, 1)
    pdf.cell(200, 10, f"Fecha: 22/04/2026", 0, 1)
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, f"Solución Propuesta: Plan {plan}", 0, 1)
    pdf.set_font("Arial", '', 12)
    pdf.multi_cell(0, 10, "Incluye: Implementación de Chatbot IA, integración con WhatsApp Business, dashboard gerencial y soporte 24/7.")
    pdf.ln(5)
    
    pdf.set_font("Arial", 'B', 14)
    pdf.set_text_color(0, 163, 255) # Electric Blue
    pdf.cell(200, 10, f"INVERSIÓN MENSUAL: S/ {precio}.00", 0, 1)
    
    pdf.set_text_color(0, 0, 0)
    pdf.ln(20)
    pdf.set_font("Arial", 'I', 10)
    pdf.multi_cell(0, 10, "Esta cotización tiene una validez de 15 días. Al contratar esta semana, incluimos el onboarding y configuración gratis.")
    
    # Sanitización estricta para evitar Path Traversal y caracteres raros
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', "", lead_name).replace(" ", "_")
    filename = f"cotizacion_{clean_name}.pdf"
    file_path = os.path.join("temp_quotes", filename)
    
    if not os.path.exists("temp_quotes"):
        os.makedirs("temp_quotes")
        
    pdf.output(file_path)
    return file_path

def upload_quote_to_storage(file_path):
    """Sube el PDF a Firebase Storage y devuelve la URL pública"""
    try:
        bucket = storage.bucket()
        blob = bucket.blob(f"quotes/{os.path.basename(file_path)}")
        blob.upload_from_filename(file_path)
        
        # Hacer el archivo público (o generar URL con token)
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print(f"Error subiendo a Storage: {e}")
        return None

def notify_sales_team(lead_data):
    """Envía un email al equipo de ventas sobre un lead caliente"""
    try:
        sender_email = os.getenv("EMAIL_CORPORATIVO")
        sender_password = os.getenv("EMAIL_PASSWORD")
        admin_email = os.getenv("ADMIN_EMAIL", sender_email)
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = admin_email
        msg['Subject'] = f"🔥 LEAD CALIENTE DETECTADO: {lead_data.get('nombre')}"
        
        body = f"""
        Hola Equipo de Ventas,
        
        AXIA ha detectado un lead de alta prioridad:
        
        - Nombre: {lead_data.get('nombre')}
        - WhatsApp: {lead_data.get('phone')}
        - Empresa: {lead_data.get('empresa')}
        - Sector: {lead_data.get('sector')}
        - Score de Interés: {lead_data.get('score', 85)}/100
        
        El cliente ha solicitado una cotización. Por favor, realizar seguimiento manual si es necesario.
        
        Atentamente,
        AXIA Brain System
        """
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(os.getenv("EMAIL_SMTP_HOST"), int(os.getenv("EMAIL_SMTP_PORT")))
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error notificando ventas: {e}")
        return False
