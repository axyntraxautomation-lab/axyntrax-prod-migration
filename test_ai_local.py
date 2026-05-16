import os
import sys
from dotenv import load_dotenv

# Añadir ruta del proyecto al path
sys.path.append(os.getcwd())

load_dotenv()
from axia_logic import get_axia_response

history = [{"role": "user", "content": "hola cecilia, como estas?"}]
try:
    response = get_axia_response(history)
    print(f"RESPUESTA IA: {response}")
except Exception as e:
    print(f"ERROR IA: {e}")
