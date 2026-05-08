# Plantillas de Agenda AXIA

CALENDAR_TEMPLATES = {
    "APPOINTMENT_REMINDER": (
        "RECORDATORIO AXIA\n"
        "Miguel, tienes una cita en 1 hora.\n"
        "Evento: {asunto}\n"
        "Cliente: {cliente}\n"
        "Lugar/Link: {ubicacion}\n\n"
        "¿Deseas que te prepare algún reporte de antecedentes del cliente?"
    ),
    "CONFLICT_ALERT": "ALERTA DE AGENDA\nMiguel, he detectado un conflicto de horarios para '{asunto}'."
}

def get_calendar_msg(tipo, **kwargs):
    template = CALENDAR_TEMPLATES.get(tipo, "")
    for key, value in kwargs.items():
        template = template.replace(f"{{{key}}}", str(value))
    return template
