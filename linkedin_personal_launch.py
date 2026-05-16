import os
import requests
from dotenv import load_dotenv

load_dotenv()

def post_to_linkedin_personal():
    token = os.getenv("LI_ACCESS_TOKEN")
    # Usando el ID que me pasó Miguel
    author_urn = "urn:li:member:322731461" 
    
    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    
    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": "🚀 AXYNTRAX AUTOMATION: ¡Evolución Industrial 2026!\n\nEstamos redefiniendo la eficiencia B2B en Perú mediante Ecosistemas Autónomos de IA. Orgulloso de liderar esta transformación. #Axyntrax #AI #Industry40 #Innovation"
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    r = requests.post(url, json=payload, headers=headers)
    print("LinkedIn Personal Result:", r.status_code)
    print(r.text)

if __name__ == "__main__":
    post_to_linkedin_personal()
