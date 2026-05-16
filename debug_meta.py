import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("WSP_ACCESS_TOKEN")
print(f"TOKEN: {token[:10]}...")

url = f"https://graph.facebook.com/v19.0/me?access_token={token}"
try:
    resp = requests.get(url, timeout=10)
    print(f"STATUS: {resp.status_code}")
    print(f"RESPONSE: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
