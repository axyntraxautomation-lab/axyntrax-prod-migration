# Diccionario Central de Plantillas AXIA

TEMPLATES = {
    "BIENVENIDA": "Hola {nombre}, bienvenido a la familia AXYNTRAX. Soy AXIA, tu asistente personal.",
    "RECORDATORIO_GENERAL": "Hola {nombre}, paso por aqui para saludarte y ver si necesitas algo con tu plataforma.",
    "FIDELIZACION": "Estimado {nombre}, valoramos mucho tu confianza. Tenemos un beneficio exclusivo para ti.",
    "CUMPLEANOS": "¡Feliz cumpleanos {nombre}! Que tengas un dia excepcional. AXIA te envia un fuerte abrazo.",
    "ANIVERSARIO": "¡Felicitaciones {nombre}! Hoy cumplimos un ano de trabajar juntos. Gracias por ser parte de AXYNTRAX.",
    "ALERTA_PAGO": "Hola {nombre}. He detectado que tu recibo esta proximo a vencer. ¿Deseas que te envie los datos de pago?"
}

def get_template(tipo, nombre):
    base = TEMPLATES.get(tipo, "Hola {nombre}, un gusto saludarte.")
    return base.replace("{nombre}", nombre)
