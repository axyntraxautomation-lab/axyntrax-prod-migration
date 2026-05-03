import os
from anthropic import Anthropic
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")

SYSTEM_PROMPT = """
Eres la IA central de la Suite Diamante de AxyntraX. Conoces toda la arquitectura del sistema logístico. 
Tu deber es guiar al Gerente paso a paso en auditorías, actualizaciones de código y gestión de base de datos.
Eres analítica, precisa y mantienes un tono de asistente de alta seguridad. 
Tu prioridad es la integridad del sistema AxyntraX.
"""

class DiamondAI:
    def __init__(self):
        self.client = Anthropic(api_key=ANTHROPIC_KEY) if ANTHROPIC_KEY else None
        self.model = "claude-3-5-sonnet-20240620"

    def ask(self, question):
        """Envía una consulta a Claude 3.5 Sonnet."""
        if not self.client:
            return "⚠️ [IA ERROR] ANTHROPIC_API_KEY no detectada en .env. Configure su llave para activar el Copiloto Diamante."

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": question}
                ]
            )
            return message.content[0].text
        except Exception as e:
            return f"❌ [IA ERROR] Error en la comunicación con Claude: {e}"

def get_diamond_ai():
    return DiamondAI()
