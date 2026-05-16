import os
import sys
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("DEEPSEEK_API_KEY")
print(f"DEEPSEEK_API_KEY: {key[:5]}...{key[-5:] if key else ''}")

import requests
url = "https://api.deepseek.com/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
payload = {
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "hi"}],
    "max_tokens": 10
}
try:
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"STATUS: {resp.status_code}")
    print(f"RESPONSE: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
