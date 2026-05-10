import requests
import json

url = "https://www.axyntrax-automation.net/api/whatsapp"
payload = {
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "51991740590", "phone_number_id": "1148012698386108" },
        "contacts": [{ "profile": { "name": "Test Sim Antigravity" } }],
        "messages": [{
          "from": "51991740590",
          "type": "text",
          "text": { "body": "Simulacion Antigravity" },
          "id": "sim_id_1",
          "timestamp": "12345"
        }]
      }
    }]
  }]
}

try:
    resp = requests.post(url, json=payload, timeout=30)
    print(f"STATUS_CODE: {resp.status_code}")
    print(f"RESPONSE_TEXT: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
