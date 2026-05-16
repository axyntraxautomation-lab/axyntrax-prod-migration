import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("WSP_ACCESS_TOKEN")

# Intentar obtener información de la página
url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={token}"
try:
    resp = requests.get(url, timeout=10)
    print(f"ACCOUNTS: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
