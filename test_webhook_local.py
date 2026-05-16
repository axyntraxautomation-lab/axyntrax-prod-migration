import requests
import json

url = "http://localhost:5000/webhook"
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
                    "profile": {"name": "Test Local"},
                    "wa_id": "51991740590"
                }],
                "messages": [{
                    "from": "51991740590",
                    "id": "wamid.LOCAL_TEST_" + str(int(100000)),
                    "timestamp": "123",
                    "text": {"body": "Hola Cecilia, esto es una prueba local"},
                    "type": "text"
                }]
            },
            "field": "messages"
        }]
    }]
}

print("Sending LOCAL POST request to:", url)
try:
    # No enviamos firma HMAC porque en modo dev el webhook la ignora si APP_SECRET es stub
    res = requests.post(url, json=payload)
    print("Status Code:", res.status_code)
    print("Response Text:", res.text)
except Exception as e:
    print("Error:", e)
