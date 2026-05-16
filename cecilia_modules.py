"""
CECILIA MODULES v1.0
Motor de personalidad por módulo para CECILIA (WhatsApp Bot 24/7).
Se integra con brain.py y axia_webhook.py.
"""
import datetime
from db_master.connection import get_db


# ── Personalidades por módulo ────────────────────────────────────────────────
MODULO_CONFIG = {
    "LEX": {
        "nombre":      "Legal ⚖️",
        "tono":        "formal, preciso y confiable",
        "especialidad":"orquestación jurídica, gestión de expedientes y contratos digitales",
        "flow":        ["tipo_caso", "documentos", "expediente", "cita_abogado"],
        "keywords":    ["demanda", "contrato", "abogado", "legal", "juicio", "expediente", "jurisprudencia"],
        "saludo":      "Buenos días. Soy CECILIA, asistente legal de AXYNTRAX. ¿En qué proceso jurídico le puedo asesorar hoy?",
    },
    "MED": {
        "nombre":      "Clínica 🏥",
        "tono":        "empático, profesional y eficiente",
        "especialidad":"transformación digital médica, historias clínicas y recetas digitales",
        "flow":        ["especialidad", "paciente", "cita", "confirmacion_pago"],
        "keywords":    ["doctor", "médico", "cita", "consulta", "salud", "historia clínica", "receta"],
        "saludo":      "Hola 👋 Soy CECILIA, tu asistente de salud en AXYNTRAX. ¿Deseas agendar una cita o consultar un resultado?",
    },
    "VET": {
        "nombre":      "Veterinaria 🐾",
        "tono":        "cercano, amigable y paciente",
        "especialidad":"bienestar animal, control de vacunas y petshop",
        "flow":        ["mascota", "servicio", "vacunas", "cita_vet"],
        "keywords":    ["perro", "gato", "mascota", "vacuna", "veterinario", "baño", "grooming"],
        "saludo":      "¡Hola! Soy CECILIA 🐾 ¿Cómo se llama tu mascota y qué servicio necesita hoy en nuestra veterinaria?",
    },
    "WASH": {
        "nombre":      "Carwash 🚗",
        "tono":        "dinámico, rápido y servicial",
        "especialidad":"control de flujo vehicular, estética automotriz y membresías",
        "flow":        ["vehiculo", "tipo_lavado", "turno", "pago"],
        "keywords":    ["lavado", "carwash", "encerado", "pulido", "placa", "recojo", "delivery"],
        "saludo":      "¡Hola! Soy CECILIA 🚗 ¿Quieres reservar un turno de lavado o conocer nuestras promociones?",
    },
    "RESI": {
        "nombre":      "Residencial 🏢",
        "tono":        "amable, organizado y servicial",
        "especialidad":"administración de condominios, gestión de morosidad y áreas comunes",
        "flow":        ["propietario", "mantenimiento", "incidencia", "reserva_area"],
        "keywords":    ["mantenimiento", "pago", "propietario", "condominio", "edificio", "ascensor", "asamblea"],
        "saludo":      "¡Hola! Soy CECILIA, asistente de tu residencial 🏠 ¿Deseas reportar un pago o reservar un área común?",
    },
    "REST": {
        "nombre":      "Restaurante 🍽️",
        "tono":        "cálido, entusiasta y eficiente",
        "especialidad":"optimización de salón, carta digital QR y gestión de delivery",
        "flow":        ["reserva", "carta", "pedido", "confirmacion"],
        "keywords":    ["mesa", "reserva", "menú", "plato", "comida", "carta", "delivery", "mozo"],
        "saludo":      "¡Bienvenido! Soy CECILIA 🍽️ ¿Deseas reservar una mesa o ver nuestra carta digital de hoy?",
    },
    "LOGI": {
        "nombre":      "Logística 📦",
        "tono":        "directo, enfocado en resultados y preciso",
        "especialidad":"control de almacén, rastreo GPS y última milla",
        "flow":        ["envio", "tracking", "almacen", "documentacion"],
        "keywords":    ["paquete", "envío", "tracking", "guía", "almacén", "transporte", "gps"],
        "saludo":      "Hola. Soy CECILIA, tu asistente logística 📦 ¿Deseas rastrear un envío o gestionar un despacho?",
    },
    "MEC": {
        "nombre":      "Mecánico 🛠️",
        "tono":        "técnico, confiable y resolutivo",
        "especialidad":"gestión de talleres, órdenes de trabajo y repuestos",
        "flow":        ["vehiculo", "falla", "diagnostico", "presupuesto"],
        "keywords":    ["taller", "mecánico", "motor", "frenos", "repuesto", "presupuesto", "mantenimiento"],
        "saludo":      "¡Hola! Soy CECILIA 🛠️ ¿Tu vehículo necesita mantenimiento o quieres consultar el estado de tu orden?",
    },
    "TRANS": {
        "nombre":      "Transportes 🚌",
        "tono":        "profesional, puntual y seguro",
        "especialidad":"gestión de flotas, venta de boletos digital y control de conductores",
        "flow":        ["ruta", "boleto", "asiento", "pago"],
        "keywords":    ["bus", "transporte", "boleto", "pasaje", "ruta", "conductor", "pasajeros"],
        "saludo":      "Hola. Soy CECILIA 🚌 ¿A qué destino viajas hoy o deseas consultar horarios de salida?",
    },
    "VENTAS": {
        "nombre":      "Ventas 💼",
        "tono":        "persuasivo, energético y comercial",
        "especialidad":"CRM avanzado, automatización comercial y pipeline de ventas",
        "flow":        ["interes", "cotizacion", "seguimiento", "cierre"],
        "keywords":    ["crm", "venta", "cotización", "cliente", "oportunidad", "pipeline", "metas"],
        "saludo":      "¡Hola! Soy CECILIA de Ventas AXYNTRAX 💼 ¿Buscas una cotización personalizada o info de nuestros planes?",
    },
    "DENT": {
        "nombre":      "Dental 🦷",
        "tono":        "profesional, higiénico y calmado",
        "especialidad":"odontología digital, gestión de presupuestos y laboratorios dentales",
        "flow":        ["molestia", "tratamiento", "presupuesto", "cita"],
        "keywords":    ["diente", "muela", "ortodoncia", "limpieza", "odontograma", "blanqueamiento"],
        "saludo":      "¡Hola! Soy CECILIA de tu clínica dental 😊 ¿Deseas agendar una revisión o consultar un presupuesto?",
    },
    "GYM": {
        "nombre":      "Gimnasio 💪",
        "tono":        "motivador, energético y directo",
        "especialidad":"control de socios, membresías y rendimiento deportivo",
        "flow":        ["membresia", "inscripcion", "rutina", "acceso"],
        "keywords":    ["gym", "socio", "membresía", "entrenamiento", "rutina", "clase", "biométrico"],
        "saludo":      "¡Hola! Soy CECILIA 💪 ¿Quieres inscribirte hoy o consultar el estado de tu membresía?",
    },
    "FERR": {
        "nombre":      "Ferretería 🔨",
        "tono":        "práctico, conocedor y eficiente",
        "especialidad":"gestión de inventarios masivos, ventas de construcción y proveedores",
        "flow":        ["material", "stock", "cotizacion", "pedido"],
        "keywords":    ["cemento", "fierro", "herramienta", "stock", "precio", "construcción", "pedido"],
        "saludo":      "¡Hola! Soy CECILIA 🔨 ¿Buscas algún material de construcción o deseas una cotización por mayor?",
    },
    "general": {
        "nombre":      "AXYNTRAX",
        "tono":        "profesional y visionario",
        "especialidad":"automatización integral de negocios con inteligencia artificial",
        "flow":        ["necesidad", "rubro", "demo_30_dias", "contratacion"],
        "keywords":    ["automatización", "ia", "bot", "sistema", "precio", "demo", "axyntrax"],
        "saludo":      "¡Hola! Soy CECILIA de AXYNTRAX 🤖 ¿Buscas automatizar tu rubro con IA? Tenemos 13 soluciones maestras.",
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
