# Plantillas Financieras AXIA

def get_finance_msg(tipo, monto):
    if tipo == "MOROSO":
        return f"Hola. He detectado una deuda de S/. {monto}. ¿Deseas que AXIA proceda con el recordatorio suave?"
    return f"Resumen financiero AXIA: S/. {monto}"
