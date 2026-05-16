import requests
import json

url = "https://qatawtbfrfreakdbluat.supabase.co/functions/v1/whatsapp-webhook"
payload = {
    "object": "whatsapp_business_account",
    "entry": [{
        "id": "1156622220859055",
        "changes": [{
            "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                    "display_phone_number": "123",
                    "phone_number_id": "1156622220859055"
                },
                "contacts": [{
                    "profile": {"name": "Test"},
                    "wa_id": "51991740590"
                }],
                "messages": [{
                    "from": "51991740590",
                    "id": "wamid.HBgL",
                    "timestamp": "123",
                    "text": {"body": "Hola Cecilia"},
                    "type": "text"
                }]
            }
        }]
    }]
}

print("Sending POST request to:", url)
try:
    res = requests.post(url, json=payload)
    print("Status Code:", res.status_code)
    print("Response Text:", res.text)
except Exception as e:
    print("Error:", e)
