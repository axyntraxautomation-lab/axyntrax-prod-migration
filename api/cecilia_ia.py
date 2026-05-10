import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Configuración de Mentes (Gemini y DeepSeek)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

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
    # Prioridad 1: DeepSeek (La "Nueva Mente")
    if DEEPSEEK_API_KEY:
        try:
            url = "https://api.deepseek.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": CECILIA_SYSTEM_PROMPT},
                    {"role": "user", "content": message_text}
                ],
                "max_tokens": 150
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            if resp.status_code == 200:
                return resp.json()['choices'][0]['message']['content'].strip()
            else:
                print(f"[DEEPSEEK ERR] Status {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[DEEPSEEK EXCEPTION] {e}")

    # Prioridad 2: Gemini (Respaldo)
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash-latest",
                system_instruction=CECILIA_SYSTEM_PROMPT
            )
            response = model.generate_content(message_text)
            return response.text.strip()
        except Exception as e:
            print(f"[GEMINI ERR] {e}")

    return "¡Hola! Recibí tu mensaje. Estamos optimizando mis sistemas. Un asesor te contactará pronto para ayudarte con AXYNTRAX. 🙏"
