import requests
import json

url = "https://axyntrax-automation.net/api/cecilia/webhook"
payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "51999999999",
                "text": {
                  "body": "hola"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}

headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
