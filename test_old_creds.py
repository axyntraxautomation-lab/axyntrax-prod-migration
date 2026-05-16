import os
import requests

token = "EAAOEfgGZC6gEBRSp6KomwAjzds7xSyhjjrZBKxdcLfC2jFtlyyN5ZBW6sZBePFmeP6QCYzkKFrI0k4omvuMmc5jHAZBkTpOZCdIHSMpG0LxxwAn3imbA4slwXewr9CxmCWdCRr7gpRgqSdLr1hCCZBZC05jMavDR7IWZC2QGzy30wG1sJi4i11D8e9gQGSsZAbUZBY7ZBVGSquc8NXm4xbdsPcX124B8N36BnIK3bMGkINFAlcDXqGpY8xw4gudhZCxg3yTZBGRYt5KPGD1Gtvu6NYFOyOlwZDZD"
phone_id = "1148012698386108"
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
    "text": {"body": "Test with OLD CREDENTIALS"}
}

try:
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"STATUS: {resp.status_code}")
    print(f"RESPONSE: {resp.text}")
except Exception as e:
    print(f"ERROR: {e}")
