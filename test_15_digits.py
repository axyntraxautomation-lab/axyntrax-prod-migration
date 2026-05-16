import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("WSP_ACCESS_TOKEN")
phone_id = "115662222085905" # 15 digits (removed last 5)
to = "51991740590"

url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
payload = {
    "messaging_product": "whatsapp",
    "to": to,
    "type": "text",
    "text": {"body": "Test with 15 digit ID"}
}

try:
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"STATUS: {resp.status_code}")
    print(f"RESPONSE: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
