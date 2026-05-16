import os
import json
import datetime
import logging
from dotenv import load_dotenv

# Carga el .env del root
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(ENV_PATH)

logging.basicConfig(level=logging.INFO, format='[CECILIA-QUOTER] %(message)s')

class CeciliaBudgeter:
    """
    Motor de Inteligencia Comercial de Cecilia. 
    Analiza requerimientos, desglosa módulos y calcula presupuestos finales con márgenes asegurados.
    """
    def __init__(self):
        self.base_margin = 0.40  # 40% Margen de ganancia requerido (FASE 8)
        self.igv = 0.18          # 18% IGV Peruano
        
        # Catálogo Cache (Reflejando la BD de Supabase)
        self.catalog = {
            "web": {"name": "Creación de Web / E-commerce", "base_cost": 500, "days": 7, "keywords": ["web", "pagina", "landing", "tienda"]},
            "automation": {"name": "Automatización RPA", "base_cost": 1200, "days": 14, "keywords": ["automatizar", "bot", "flujo", "rpa"]},
            "custom_ai": {"name": "App AI a Medida", "base_cost": 3000, "days": 30, "keywords": ["aplicacion", "app", "software", "potenciada"]},
            "ai_integrations": {"name": "Integración IAs Externas", "base_cost": 1000, "days": 7, "keywords": ["chatgpt", "deepseek", "openai", "integrar"]},
            "dashboards": {"name": "Smart Dashboards & BI", "base_cost": 1500, "days": 10, "keywords": ["dashboard", "reporte", "analisis"]},
            "enterprise_ai": {"name": "Modelos IA Empresarial", "base_cost": 5000, "days": 45, "keywords": ["modelo", "ia propia", "entrenar", "corporativo"]},
            "support": {"name": "Suscripción Soporte 24/7", "base_cost": 200, "days": 30, "keywords": ["soporte", "mantenimiento", "ayuda"]}
        }

    def analyze_intent(self, client_request):
        """NLP Básico: Identifica qué productos solicita el cliente en el texto."""
        req_lower = client_request.lower()
        selected_modules = []
        
        for key, item in self.catalog.items():
            for kw in item["keywords"]:
                if kw in req_lower:
                    selected_modules.append(item)
                    break # Module matched, go to next
        
        # Si no detecta nada, asigna Web corporativa por defecto como punto de entrada
        if not selected_modules:
            selected_modules.append(self.catalog["web"])
            
        return selected_modules

    def calculate_budget(self, modules, urgency="NORMAL"):
        """Realiza el cálculo financiero basado en las reglas corporativas AXYNTRAX."""
        total_base_cost = sum(m["base_cost"] for m in modules)
        
        # Factor de urgencia
        multiplier = 1.0
        if urgency.upper() == "URGENTE":
            multiplier = 1.25 # 25% Recargo
        
        cost_adjusted = total_base_cost * multiplier
        
        # Asegurar el 40% de margen sobre el precio final de venta
        # Precio Venta = Costo / (1 - Margen) -> Venta * 0.6 = Costo
        sale_price = cost_adjusted / (1 - self.base_margin)
        
        total_igv = sale_price * self.igv
        total_final = sale_price + total_igv
        
        # Tiempos (El máximo entre los módulos, mas ajuste por complejidad)
        est_days = max(m["days"] for m in modules)
        if urgency.upper() == "URGENTE":
            est_days = int(est_days * 0.7) # 30% menos tiempo

        return {
            "subtotal_neto": round(sale_price, 2),
            "igv": round(total_igv, 2),
            "total_final": round(total_final, 2),
            "ahorro_eficiencia": round(sale_price * 0.15, 2), # Placeholder de beneficio
            "eta_dias": est_days
        }

    def generate_quote(self, client_name, request_text, urgency="NORMAL"):
        """Flujo Maestro de Cotización."""
        logging.info(f"Generando presupuesto para: {client_name}")
        
        modules = self.analyze_intent(request_text)
        finance = self.calculate_budget(modules, urgency)
        
        quote = {
            "folio": f"AX-QUOTE-{datetime.datetime.now().strftime('%Y%m%d-%H%M')}",
            "fecha": datetime.datetime.now().strftime("%Y-%m-%d"),
            "cliente": client_name,
            "detalle_solicitado": request_text,
            "conceptos": [m["name"] for m in modules],
            "urgencia": urgency,
            "financiero": finance,
            "condiciones": "50% adelanto para inicio de proyecto, 50% contra entrega satisfactoria.",
            "vendedor": "Cecilia (AXYNTRAX Commercial AI)"
        }
        
        # Mock guardado en DB (Fase 9 requirement: Save to local/remote)
        save_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output_quotes")
        os.makedirs(save_path, exist_ok=True)
        with open(os.path.join(save_path, f"{quote['folio']}.json"), "w") as f:
            json.dump(quote, f, indent=4)
            
        return quote

if __name__ == "__main__":
    bot = CeciliaBudgeter()
    
    # Prueba 1: Cliente pide Web + RPA
    ejemplo = bot.generate_quote(
        client_name="Clínica Dental Sonrisas", 
        request_text="Hola Cecilia, queremos una página web para nuestra clínica dental y un bot de automatización para agendar citas.",
        urgency="URGENTE"
    )
    print(json.dumps(ejemplo, indent=4, ensure_ascii=False))
