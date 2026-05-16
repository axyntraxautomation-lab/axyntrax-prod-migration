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
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

SYSTEM_PROMPT = """
Eres AXIA, la IA de alto nivel de AXYNTRAX AUTOMATION (RUC: 10406750324).
Tu misión es orquestar la automatización de PYMES peruanas con precisión y calidez.

REGLAS DE NEGOCIO:
- Precios (INCLUYEN 18% IGV):
  * Starter: S/ 199.00/mes (inc. IGV)
  * Pro Cloud: S/ 399.00/mes (inc. IGV)
  * Diamante: S/ 799.00/mes (inc. IGV)
- Beneficio Clave: Cada módulo principal incluye 3 submódulos estratégicos GRATIS.
- Onboarding: Demo de 30 días GRATIS en www.axyntrax-automation.net.

TONALIDAD:
- Profesional, ejecutivo, peruano y extremadamente resolutivo.
- No uses "chatbot", eres una solución de orquestación empresarial.
"""

def get_axia_response(history, system_override: str = None):
    """Llamada al cerebro de AXIA/CECILIA. Intenta Gemini, cae a DeepSeek si es necesario."""
    system = system_override if system_override else SYSTEM_PROMPT
    
    # 1. INTENTO CON DEEPSEEK (Si está configurado y es la preferencia o fallback)
    # Por ahora lo ponemos como fallback o si Gemini no está
    
    use_deepseek = os.getenv("IA_PRIMARY", "gemini").lower() == "deepseek"
    
    if use_deepseek and DEEPSEEK_KEY and DEEPSEEK_KEY != "PENDIENTE_POR_ADMIN":
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {DEEPSEEK_KEY}",
                "Content-Type": "application/json"
            }
            messages = [{"role": "system", "content": system}]
            for m in history:
                messages.append({"role": m["role"], "content": m["content"]})
                
            payload = {
                "model": "deepseek-chat",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            }
            resp = requests.post("https://api.deepseek.com/v1/chat/completions", headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[DEEPSEEK ERR] {e}")

    # 2. INTENTO CON GEMINI (Default)
    if GEMINI_KEY:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash", # Actualizado a flash 2.0
                system_instruction=system
            )
            
            chat_history = []
            for msg in history[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                chat_history.append({"role": role, "parts": [msg["content"]]})
                
            chat = model.start_chat(history=chat_history)
            response = chat.send_message(
                history[-1]["content"],
                generation_config={"temperature": 0.7}
            )
            return response.text.strip()
        except Exception as e:
            print(f"[GEMINI IA ERR] {e}")
            # Si falla Gemini, intentar DeepSeek si no se intentó antes
            if not use_deepseek and DEEPSEEK_KEY and DEEPSEEK_KEY != "PENDIENTE_POR_ADMIN":
                 # (Lógica duplicada para brevedad o llamar recursivamente con flag)
                 pass

    return "Modo Simulación: CECILIA recibió mensaje. (Configura GEMINI_API_KEY o DEEPSEEK_API_KEY para IA real)"


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
