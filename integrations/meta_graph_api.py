import os
import requests
import logging
from dotenv import load_dotenv

# Path adjustment for standalone loading
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(ENV_PATH)

# Config
META_ACCESS_TOKEN = os.getenv("META_GRAPH_ACCESS_TOKEN", "PENDIENTE")
IG_BUSINESS_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID", "PENDIENTE")
FB_PAGE_ID = os.getenv("FB_PAGE_ID", "PENDIENTE")
API_VERSION = "v19.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("META_GRAPH")

class MetaIntegrator:
    def __init__(self):
        self.token = META_ACCESS_TOKEN
        
    def _get_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    def get_instagram_insights(self):
        """Obtiene estadísticas básicas de la cuenta de IG vinculada."""
        if self.token == "PENDIENTE" or IG_BUSINESS_ACCOUNT_ID == "PENDIENTE":
            return {"status": "error", "message": "Credenciales faltantes en .env"}
        
        url = f"{BASE_URL}/{IG_BUSINESS_ACCOUNT_ID}/insights"
        params = {
            "metric": "impressions,reach,follower_count",
            "period": "day"
        }
        try:
            r = requests.get(url, headers=self._get_headers(), params=params)
            return r.json()
        except Exception as e:
            logger.error(f"Error IG Insights: {e}")
            return {"error": str(e)}

    def publish_facebook_post(self, message):
        """Publica un mensaje directo al feed de la página de Facebook."""
        if self.token == "PENDIENTE" or FB_PAGE_ID == "PENDIENTE":
            return {"status": "error", "message": "Credenciales faltantes en .env"}
            
        url = f"{BASE_URL}/{FB_PAGE_ID}/feed"
        data = {"message": message}
        try:
            r = requests.post(url, headers=self._get_headers(), data=data)
            return r.json()
        except Exception as e:
            logger.error(f"Error FB Post: {e}")
            return {"error": str(e)}

    def get_instagram_media_feed(self):
        """Obtiene el feed más reciente de la cuenta de Instagram."""
        if self.token == "PENDIENTE" or IG_BUSINESS_ACCOUNT_ID == "PENDIENTE":
            return []
            
        url = f"{BASE_URL}/{IG_BUSINESS_ACCOUNT_ID}/media"
        params = {"fields": "id,caption,media_type,media_url,permalink,timestamp"}
        try:
            r = requests.get(url, headers=self._get_headers(), params=params)
            return r.json().get("data", [])
        except Exception as e:
            logger.error(f"Error IG Feed: {e}")
            return []

if __name__ == "__main__":
    # Test simple
    meta = MetaIntegrator()
    print("[MetaIntegrator] Iniciado en modo prueba.")
    feed = meta.get_instagram_media_feed()
    print(f"Found {len(feed)} items in Instagram feed (Simulation/Real).")
