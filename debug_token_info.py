import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("WSP_ACCESS_TOKEN")

# Verificar permisos del token
url = f"https://graph.facebook.com/debug_token?input_token={token}&access_token={token}"
try:
    resp = requests.get(url, timeout=10)
    print(f"DEBUG TOKEN: {resp.text}")
    
    # Intentar ver cuentas de empresa
    url2 = f"https://graph.facebook.com/v19.0/me?fields=id,name,email,permissions&access_token={token}"
    resp2 = requests.get(url2, timeout=10)
    print(f"ME INFO: {resp2.text}")
except Exception as e:
    print(f"ERROR: {e}")
