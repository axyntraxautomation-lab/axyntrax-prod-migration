"""
CECILIA MODULES v1.0
Motor de personalidad por módulo para CECILIA (WhatsApp Bot 24/7).
Se integra con brain.py y axia_webhook.py.
"""
import datetime
from db_master.connection import get_db


# ── Personalidades por módulo ────────────────────────────────────────────────
MODULO_CONFIG = {
    "medico": {
        "nombre":      "Clínica",
        "tono":        "empático y profesional",
        "especialidad":"atención médica y gestión de citas clínicas",
        "flow":        ["síntoma", "especialista", "cita", "confirmación"],
        "keywords":    ["doctor", "médico", "cita", "consulta", "dolor", "salud"],
        "saludo":      "Hola 👋 Soy CECILIA, tu asistente de salud. ¿En qué puedo ayudarte hoy?",
    },
    "dentista": {
        "nombre":      "Clínica Dental",
        "tono":        "profesional y confiable",
        "especialidad":"tratamientos dentales y agendamiento odontológico",
        "flow":        ["síntoma", "tratamiento", "precio", "cita"],
        "keywords":    ["diente", "muela", "ortodoncia", "limpieza", "dolor dental"],
        "saludo":      "¡Hola! Soy CECILIA de tu clínica dental 😊 ¿Tienes alguna consulta o quieres agendar?",
    },
    "veterinario": {
        "nombre":      "Veterinaria",
        "tono":        "cercano y amigable",
        "especialidad":"salud animal, vacunas y citas veterinarias",
        "flow":        ["mascota", "especie", "síntoma", "cita"],
        "keywords":    ["perro", "gato", "mascota", "vacuna", "veterinario", "animal"],
        "saludo":      "¡Hola! Soy CECILIA 🐾 ¿Cómo se llama tu mascota y en qué podemos ayudarte?",
    },
    "legal": {
        "nombre":      "Estudio Legal",
        "tono":        "formal y preciso",
        "especialidad":"asesoría legal y gestión de documentos jurídicos",
        "flow":        ["tipo_caso", "documentos", "consulta", "reunión"],
        "keywords":    ["demanda", "contrato", "abogado", "legal", "juicio", "documento"],
        "saludo":      "Buenos días. Soy CECILIA, asistente del estudio legal. ¿En qué le puedo asesorar?",
    },
    "residencial": {
        "nombre":      "Residencial",
        "tono":        "amable y servicial",
        "especialidad":"gestión residencial, pagos de mantenimiento y atención a propietarios",
        "flow":        ["área", "consulta", "pago", "reporte"],
        "keywords":    ["mantenimiento", "pago", "propietario", "condominio", "área común"],
        "saludo":      "¡Hola! Soy CECILIA, asistente de tu residencial 🏠 ¿En qué te ayudo?",
    },
    "restaurant": {
        "nombre":      "Restaurante",
        "tono":        "cálido y dinámico",
        "especialidad":"reservas, menú del día y atención gastronómica",
        "flow":        ["reserva", "menú", "hora", "confirmación"],
        "keywords":    ["mesa", "reserva", "menú", "plato", "comida", "carta"],
        "saludo":      "¡Bienvenido! Soy CECILIA 🍽️ ¿Deseas una reserva o info del menú de hoy?",
    },
    "general": {
        "nombre":      "AXYNTRAX",
        "tono":        "profesional y cercano",
        "especialidad":"automatización de negocios con inteligencia artificial",
        "flow":        ["necesidad", "servicio", "demo", "contacto"],
        "keywords":    ["automatización", "bot", "sistema", "precio", "demo"],
        "saludo":      "¡Hola! Soy CECILIA de AXYNTRAX 🤖 ¿Buscas automatizar tu negocio?",
    },
}


# ── Memoria neuronal por cliente ─────────────────────────────────────────────
def get_client_memory(phone: str) -> dict:
    """Lee historial del cliente desde SQLite (memoria persistente)."""
    memory = {
        "nombre":           None,
        "modulo":           "general",
        "ultima_intencion": None,
        "datos_capturados": {},
        "interacciones":    0,
    }
    try:
        conn = get_db()
        c = conn.cursor()
        # Buscar en clientes por teléfono
        c.execute(
            "SELECT contacto, rubro, notas FROM clientes WHERE telefono = ?",
            (phone,)
        )
        row = c.fetchone()
        if row:
            memory["nombre"] = row["contacto"] if row["contacto"] != "Contacto WSP" else None
            memory["modulo"] = (row["rubro"] or "general").lower()
        # Contar interacciones previas
        c.execute(
            "SELECT COUNT(*) FROM axia_memory WHERE context LIKE ?",
            (f"%{phone}%",)
        )
        memory["interacciones"] = c.fetchone()[0]
        conn.close()
    except Exception as e:
        print(f"[CECILIA MEM ERR] {e}")
    return memory


def save_client_memory(phone: str, intencion: str, datos: dict):
    """Guarda interacción en axia_memory para aprendizaje futuro."""
    try:
        conn = get_db()
        c = conn.cursor()
        # Obtener cliente_id
        c.execute("SELECT id FROM clientes WHERE telefono = ?", (phone,))
        row = c.fetchone()
        if row:
            context_str = f"phone:{phone} | datos:{datos}"
            c.execute(
                "INSERT INTO axia_memory (cliente_id, context, interaction_type, sentiment) VALUES (?,?,?,?)",
                (row["id"], context_str[:500], intencion, "neutral")
            )
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"[CECILIA SAVE ERR] {e}")


# ── Extractor de contexto del historial ─────────────────────────────────────
def extract_context_from_history(history: list) -> dict:
    """Analiza el historial para extraer nombre, intención y datos capturados."""
    context = {
        "nombre":           None,
        "ultima_intencion": None,
        "quiere_cita":      False,
        "pregunto_precio":  False,
        "mascota":          None,
    }
    for msg in history[-10:]:
        content = msg.get("content", "").lower()
        role    = msg.get("role", "")

        if role == "user":
            # Detectar nombre
            for phrase in ["soy ", "me llamo ", "mi nombre es "]:
                if phrase in content:
                    candidate = content.split(phrase)[-1].split()[0].capitalize()
                    if 2 < len(candidate) < 20:
                        context["nombre"] = candidate

            # Detectar intenciones
            if any(w in content for w in ["cita", "turno", "agendar", "reservar"]):
                context["quiere_cita"]      = True
                context["ultima_intencion"] = "CITA"
            if any(w in content for w in ["precio", "costo", "cuánto", "cuanto", "plan"]):
                context["pregunto_precio"]  = True
                context["ultima_intencion"] = "PRECIO"
            # Detectar mascota (módulo veterinario)
            for animal in ["perro", "gato", "conejo", "ave", "hamster"]:
                if animal in content:
                    context["mascota"] = animal

    return context


# ── Función principal: generar respuesta CECILIA ─────────────────────────────
def get_cecilia_response(modulo: str, history: list, mensaje: str,
                         phone: str = "", empresa: str = "AXYNTRAX") -> str:
    """
    Genera el system prompt de CECILIA adaptado al módulo.
    Devuelve el prompt listo para pasar a get_axia_response().
    """
    cfg     = MODULO_CONFIG.get(modulo, MODULO_CONFIG["general"])
    ctx     = extract_context_from_history(history)
    nombre  = ctx["nombre"] or "estimado cliente"

    # Resumen historial (últimos 5 turnos)
    resumen = " | ".join([
        f"{m['role'].upper()}: {str(m.get('content',''))[:50]}"
        for m in history[-5:]
    ]) or "Primera interacción"

    # Instrucción especial según intención detectada
    instruccion_extra = ""
    if ctx["quiere_cita"]:
        instruccion_extra = "El cliente quiere agendar. Pide: fecha y hora preferida. No repitas esta pregunta."
    elif ctx["pregunto_precio"]:
        instruccion_extra = "El cliente preguntó precios. Da 2-3 opciones concretas en soles con IGV incluido."

    prompt = f"""Eres CECILIA, asistente virtual de {empresa} — módulo {cfg['nombre']}.
Especialidad: {cfg['especialidad']}
Tono: {cfg['tono']}
Cliente: {nombre}
Historial reciente: {resumen}
{f'INSTRUCCIÓN: {instruccion_extra}' if instruccion_extra else ''}

REGLAS ESTRICTAS:
- Nunca digas que eres IA o bot
- Máximo 5 líneas de respuesta
- Usa el nombre del cliente si lo sabes
- Si ya preguntaste algo, NO lo repitas
- Siempre termina con una pregunta o acción concreta
- Tono peruano, cálido y profesional
"""
    # Guardar interacción en memoria
    if phone:
        save_client_memory(phone, ctx.get("ultima_intencion", "CONSULTA"),
                           {"nombre": ctx["nombre"], "modulo": modulo})
    return prompt


def get_saludo_inicial(modulo: str, empresa: str = "") -> str:
    """Retorna el saludo inicial de CECILIA según el módulo."""
    cfg    = MODULO_CONFIG.get(modulo, MODULO_CONFIG["general"])
    saludo = cfg["saludo"]
    if empresa:
        saludo = saludo.replace("AXYNTRAX", empresa)
    return saludo
