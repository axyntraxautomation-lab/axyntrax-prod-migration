import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("WSP_ACCESS_TOKEN")

# Intentar obtener las cuentas de WhatsApp Business vinculadas al token
url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={token}"
try:
    resp = requests.get(url, timeout=10)
    print(f"ACCOUNTS STATUS: {resp.status_code}")
    print(f"ACCOUNTS: {resp.text}")
    
    # También intentar con /me?fields=whatsapp_business_accounts
    url2 = f"https://graph.facebook.com/v19.0/me?fields=id,name,whatsapp_business_accounts&access_token={token}"
    resp2 = requests.get(url2, timeout=10)
    print(f"WABA STATUS: {resp2.status_code}")
    print(f"WABA: {resp2.text}")
except Exception as e:
    print(f"ERROR: {e}")
