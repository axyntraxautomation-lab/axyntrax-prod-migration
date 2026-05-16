import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("WSP_ACCESS_TOKEN")
waba_id = "4478935279019529"

# Obtener números de teléfono vinculados a este WABA
url = f"https://graph.facebook.com/v19.0/{waba_id}/phone_numbers?access_token={token}"
try:
    resp = requests.get(url, timeout=10)
    print(f"PHONE NUMBERS STATUS: {resp.status_code}")
    print(f"PHONE NUMBERS: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
