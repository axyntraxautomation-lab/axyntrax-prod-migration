# Motor de Respuestas de Mando Remoto AXIA

REMOTE_TEMPLATES = {
    "CMD_NOT_FOUND": "He recibido tu mensaje, Miguel. Sin embargo, no reconozco ese comando maestro. Di `AXIA AYUDA` para ver mis capacidades.",
    "CMD_SUCCESS": "Comando ejecutado con exito por el motor neuronal AXIA.",
    "STATUS_REPORT": "Sentinel Reporting: Sistema OPERATIVO. Todos los micro-agentes estan sincronizados bajo Diamond ID."
}

def get_remote_msg(tipo):
    return REMOTE_TEMPLATES.get(tipo, "")
