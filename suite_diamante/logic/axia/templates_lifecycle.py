# Plantillas de Ciclo de Vida AXIA

def get_lifecycle_msg(tipo, cliente):
    if tipo == "CHURN_RISK":
        return f"ALERTA AXIA: El cliente {cliente} muestra patrones de inactividad. ¿Deseas aplicar una campaña de retención?"
    return f"Lifecycle status: {cliente}"
