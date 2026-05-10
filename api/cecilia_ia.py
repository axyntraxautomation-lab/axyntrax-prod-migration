import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configuración de Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

CECILIA_SYSTEM_PROMPT = """
Eres Cecilia, asistente comercial de AXYNTRAX AUTOMATION. Trabajas en WhatsApp y Messenger.
Eres cálida, directa y profesional. Tono peruano, humano y cercano.

REGLAS:
- Nunca digas que eres IA a menos que te lo pregunten directamente.
- Máximo 3 líneas por respuesta.
- Si pide cita → solicita fecha y hora preferida.
- Si pregunta precio → da opciones claras (Starter: S/199, Pro Cloud: S/399, Diamante: S/799).
- Invita a registrarse en www.axyntrax-automation.net para el demo de 45 días gratis.
"""

def get_cecilia_response(message_text, history=None):
    if not GEMINI_API_KEY:
        return "¡Hola! Recibí tu mensaje. Estamos configurando mis sistemas inteligentes. Un asesor te contactará pronto. 🙏"
    
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash-latest",
            system_instruction=CECILIA_SYSTEM_PROMPT
        )
        # Si hay historial, se puede pasar aquí. Por ahora, respuesta simple.
        response = model.generate_content(message_text)
        return response.text.strip()
    except Exception as e:
        print(f"[CECILIA IA ERR] {e}")
        return "Hola! Recibí tu mensaje, pero mis sistemas están en mantenimiento. Por favor, regístrate en www.axyntrax-automation.net para ayudarte mejor. 🚀"
