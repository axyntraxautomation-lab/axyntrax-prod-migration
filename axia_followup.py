import os
import time
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
from axia_webhook import send_whatsapp_message # Reusamos la función de envío

# 1. Inicializar Firebase (Si no está inicializado)
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def run_followup_cycle():
    """Busca leads inactivos por > 24h y envía un seguimiento"""
    print(f"[{datetime.now()}] Iniciando ciclo de seguimiento...")
    
    # Tiempo límite: 24 horas atrás
    threshold_time = datetime.now() - timedelta(hours=24)
    
    # Buscar leads que no son clientes y cuya última interacción fue hace > 24h
    leads_ref = db.collection("leads")
    query = leads_ref.where("status", "in", ["nuevo", "calificado", "cotizado"]).stream()
    
    for doc in query:
        lead_data = doc.to_dict()
        last_interaction = lead_data.get("updated_at")
        
        # Simulación de check de tiempo (Firestore usa timestamps)
        if last_interaction and last_interaction.replace(tzinfo=None) < threshold_time:
            phone = lead_data.get("phone")
            nombre = lead_data.get("nombre", "amigo")
            
            # Mensaje de seguimiento proactivo
            followup_msg = f"Hola {nombre}, ¡buenos días! 🤝 Paso por aquí para ver si tuviste oportunidad de revisar la información que te envié. ¿Tienes alguna duda adicional sobre cómo podemos automatizar tu negocio?"
            
            print(f"Enviando seguimiento a {phone}...")
            send_whatsapp_message(phone, followup_msg)
            
            # Actualizar estado para no repetir el seguimiento inmediatamente
            doc.reference.update({
                "status": "seguimiento_enviado",
                "updated_at": firestore.SERVER_TIMESTAMP
            })

if __name__ == "__main__":
    # Este script puede correrse como un cron job cada hora
    run_followup_cycle()
