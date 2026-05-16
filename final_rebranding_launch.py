import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def post_to_facebook():
    page_id = os.getenv("FB_PAGE_ID")
    token = os.getenv("FB_ACCESS_TOKEN")
    
    url = f"https://graph.facebook.com/v20.0/{page_id}/feed"
    payload = {
        "message": "🚀 AXYNTRAX AUTOMATION: REBRANDING OFICIAL\n\nEstamos evolucionando. Presentamos nuestra nueva identidad visual diseñada para el futuro de la autonomía industrial. #Axyntrax #Rebranding #AI #Automation",
        "access_token": token
    }
    r = requests.post(url, data=payload)
    print("Facebook Result:", r.json())

def post_to_linkedin():
    token = os.getenv("LI_ACCESS_TOKEN")
    
    # Simple text post to personal profile for now
    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    
    # We need the person URN. Let's try to get it from the token generator's context or assume it.
    # Actually, without the 'me' or 'userinfo' working, we can't get the URN.
    # But I'll try to use the token to post to the Org ID we have.
    
    org_id = os.getenv("LI_ORG_ID")
    payload = {
        "author": org_id,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": "🚀 Axyntrax Automation: Redefiniendo la eficiencia industrial mediante IA. #Axyntrax #Industry40 #AI"
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    r = requests.post(url, json=payload, headers=headers)
    print("LinkedIn Result:", r.status_code, r.text)

if __name__ == "__main__":
    print("--- LANZANDO PUBLICACIÓN DE REBRANDING ---")
    post_to_facebook()
    post_to_linkedin()
