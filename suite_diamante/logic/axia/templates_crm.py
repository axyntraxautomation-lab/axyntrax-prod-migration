# Plantillas CRM AXIA

CRM_TEMPLATES = {
    "LOYALTY_GIFT": "Hola {nombre}. AXIA ha detectado que eres uno de nuestros clientes más fieles. Te mereces una recompensa.",
    "WINBACK": "Hola {nombre}. Te extrañamos en AXYNTRAX. ¿Te gustaría conocer las mejoras de la Suite Diamante?"
}

def get_crm_msg(tipo, nombre):
    return CRM_TEMPLATES.get(tipo, "Hola {nombre}").replace("{nombre}", nombre)
