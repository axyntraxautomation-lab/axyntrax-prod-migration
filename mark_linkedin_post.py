import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def publish_to_linkedin():
    access_token = os.getenv("LI_ACCESS_TOKEN")
    org_id = os.getenv("LI_ORG_ID") # urn:li:organization:115842090
    image_path = r"C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite\assets\branding\Axyntrax_LinkedIn_Banner.png"
    
    if not access_token:
        print("LinkedIn Token missing")
        return

    # 1. Register Upload
    register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    register_payload = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": org_id if org_id != "PENDIENTE" else "urn:li:person:YOUR_PERSON_ID",
            "serviceRelationships": [{
                "relationshipType": "OWNER",
                "identifier": "urn:li:userGeneratedContent"
            }]
        }
    }
    
    # For now, let's try a simple text post first to verify Org permission
    # because image upload requires specific owner validation
    
    post_url = "https://api.linkedin.com/v2/ugcPosts"
    post_payload = {
        "author": org_id,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": "🚀 Axyntrax Automation: Redefiniendo la eficiencia empresarial con IA. \n\nConsigue tu Plan Base por solo S/ 235 (inc. IGV) y automatiza tu rubro hoy mismo. \n\n👉 SOLICITAR ACTIVACIÓN: www.axyntrax-automation.net \n\n#Axyntrax #AI #Automation #PymesPeru"
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    r = requests.post(post_url, json=post_payload, headers=headers)
    
    if r.status_code == 201:
        print("SUCCESS: Post published to LinkedIn Company Page!")
    else:
        print(f"ERROR: Status {r.status_code}")
        print(r.text)
        
        # Fallback to member post if Org fails
        if "does not match" in r.text or "ACCESS_DENIED" in r.text:
            print("Intentando publicar en perfil personal como fallback...")
            # We need the person URN, but since we don't have it easily, 
            # we tell the user to wait for Org approval.

if __name__ == "__main__":
    publish_to_linkedin()
