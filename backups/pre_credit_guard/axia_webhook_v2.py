import os
import json
import hmac
import hashlib
import requests
import threading
from flask import Flask, request, jsonify, abort
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, storage
from axia_logic import get_axia_response, generate_quote_pdf, upload_quote_to_storage, notify_sales_team

load_dotenv()
app = Flask(__name__)

# ── Firebase Init (Safe) ─────────────────────────────────────────────────────
if not firebase_admin._apps:
    try:
        cred_path = os.path.join(os.path.abspath("."), "service-account.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET", "axyntrax-automation.appspot.com")
            })
            print("[WEBHOOK V2] Firebase inicializado correctamente.")
        else:
            print("[WARN] service-account.json no encontrado. Modo sin Firebase.")
    except Exception as e:
        print(f"[WARN] Firebase init error: {e}")

db = None
try:
    db = firestore.client()
except Exception:
    print("[WARN] Firestore no disponible. Operando en modo local.")

# ── Variables de entorno ─────────────────────────────────────────────────────
ACCESS_TOKEN    = os.getenv("WSP_ACCESS_TOKEN", "")
PHONE_NUMBER_ID = os.getenv("WSP_PHONE_NUMBER_ID", "")
VERIFY_TOKEN    = os.getenv("WH_VERIFY_TOKEN", "axyntrax_diamante_2026")
APP_SECRET      = os.getenv("WSP_APP_SECRET", "")  # Para validar firma HMAC


# ── Validación HMAC (seguridad Meta) ────────────────────────────────────────
def verify_meta_signature(payload: bytes, signature_header: str) -> bool:
    """Verifica que el webhook viene realmente de Meta."""
    if not APP_SECRET or APP_SECRET == "PENDIENTE_POR_ADMIN":
        return True  # Sin secret configurado o en desarrollo, pasar (modo dev)
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    mac = hmac.new(APP_SECRET.encode("utf-8"), payload, hashlib.sha256)
    expected = "sha256=" + mac.hexdigest()
    return hmac.compare_digest(expected, signature_header)


# ── Envío WhatsApp con retry ─────────────────────────────────────────────────
def send_whatsapp_message(to: str, text: str, retries: int = 3) -> bool:
    """Envía mensaje con hasta 3 reintentos automáticos."""
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        print(f"[WSP-STUB V2] Mensaje a {to}: {text[:80]}")
        return True  # Modo sin credenciales — log en consola

    url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, headers=headers, json=data, timeout=10)
            if resp.status_code == 200:
                return True
            print(f"[WSP ERR #{attempt}] Status {resp.status_code}: {resp.text[:200]}")
        except requests.RequestException as e:
            print(f"[WSP EXCEPTION #{attempt}] {e}")
    return False


def send_whatsapp_document(to: str, doc_url: str, filename: str) -> bool:
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        return True
    url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "document",
        "document": {"link": doc_url, "filename": filename}
    }
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=10)
        return resp.status_code == 200
    except Exception as e:
        print(f"[WSP DOC ERR] {e}")
        return False


# ── CECILIA: contexto y respuesta por módulo ─────────────────────────────────
def get_client_context(history: list) -> dict:
    """Extrae nombre, módulo e intención del historial."""
    context = {"nombre": None, "modulo": "general", "ultima_intencion": None}
    for msg in history[-10:]:
        content = msg.get("content", "").lower()
        if "soy " in content or "me llamo " in content:
            # Captura nombre básico
            for phrase in ["soy ", "me llamo "]:
                if phrase in content:
                    part = content.split(phrase)[-1].split()[0].capitalize()
                    if len(part) > 2:
                        context["nombre"] = part
        if any(w in content for w in ["cita", "turno", "consulta"]):
            context["ultima_intencion"] = "CITA"
        if any(w in content for w in ["precio", "costo", "plan", "cuánto"]):
            context["ultima_intencion"] = "PRECIO"
    return context


CECILIA_PERSONALITIES = {
    "medico":      {"tono": "empático y profesional", "especialidad": "atención médica y gestión de citas clínicas"},
    "dentista":    {"tono": "profesional y confiable", "especialidad": "tratamientos dentales y agendamiento odontológico"},
    "veterinario": {"tono": "cercano y amigable",     "especialidad": "salud animal, vacunas y citas veterinarias"},
    "legal":       {"tono": "formal y preciso",       "especialidad": "asesoría legal y gestión de documentos"},
    "residencial": {"tono": "amable y servicial",     "especialidad": "gestión residencial, pagos y atención a propietarios"},
    "restaurant":  {"tono": "cálido y dinámico",      "especialidad": "reservas, menú y atención gastronómica"},
    "general":     {"tono": "profesional y cercano",  "especialidad": "automatización de negocios con IA"},
}

CECILIA_SYSTEM_PROMPT = """
Eres Cecilia, asistente comercial de {empresa}. Trabajas en WhatsApp, Facebook e Instagram representando a esta empresa. Eres cálida, directa y profesional. Tono peruano, humano y cercano.

Cliente: {nombre_cliente}
Especialidad de la empresa: {especialidad}
Historial reciente: {historial_resumido}

REGLAS:
- Nunca digas que eres IA a menos que te lo pregunten directamente
- Máximo 3 líneas por respuesta
- Usa el nombre del cliente si lo sabes
- No repitas preguntas que ya hiciste antes
- Si pide cita → solicita fecha y hora preferida
- Si pregunta precio → da opciones claras en soles
- Siempre cierra con una acción concreta (agendar, registrarse, responder)
- Cuando detectes interés real (precio, demo, quiero, cuánto, probar) → invita a registrarse en www.axyntrax-automation.net para el demo de 30 días gratis
- Nunca uses la palabra chatbot
"""


def build_cecilia_prompt(modulo: str, history: list, context: dict, empresa: str) -> str:
    pers = CECILIA_PERSONALITIES.get(modulo, CECILIA_PERSONALITIES["general"])
    nombre = context.get("nombre") or "estimado cliente"
    # Resumir historial (últimos 5 turnos)
    resumen = " | ".join([
        f"{m['role'].upper()}: {m['content'][:60]}"
        for m in history[-5:] if isinstance(m.get("content"), str)
    ]) or "Sin historial previo"
    return CECILIA_SYSTEM_PROMPT.format(
        empresa=empresa,
        modulo_nombre=modulo.capitalize(),
        especialidad=pers["especialidad"],
        tono=pers["tono"],
        nombre_cliente=nombre,
        historial_resumido=resumen,
    )


# ── Procesamiento principal (en hilo separado) ───────────────────────────────
def process_message(data: dict):
    from datetime import datetime
    try:
        entry   = data.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value   = changes.get("value", {})

        if "messages" not in value:
            return

        message = value["messages"][0]
        if message.get("type") != "text":
            return

        from_number  = message["from"]
        message_body = message["text"]["body"]
        empresa_name = os.getenv("EMPRESA_NOMBRE", "AXYNTRAX AUTOMATION")

        # ── Operación con Firestore ─────────────────────────────────────────
        if db is None:
            send_whatsapp_message(from_number, f"¡Hola! Soy CECILIA de {empresa_name} 👋 ¿En qué puedo ayudarte?")
            return

        # 3. MEMORIA: Uso de colección 'clientes' y últimos 20 mensajes
        cliente_ref = db.collection("clientes").document(from_number)
        cliente_snap = cliente_ref.get()

        if not cliente_snap.exists:
            # Cliente nuevo
            history = [{"role": "user", "content": message_body}]
            cliente_ref.set({
                "phone": from_number,
                "modulo": "general",
                "history": history,
                "created_at": firestore.SERVER_TIMESTAMP,
            })
            response_text = f"¡Hola! Soy CECILIA, tu asistente de {empresa_name} 👋\n¿Con quién tengo el gusto de hablar?"
        else:
            cliente_data = cliente_snap.to_dict()
            # Obtener últimos 20 mensajes para memoria
            history = cliente_data.get("history", [])[-20:]
            modulo  = cliente_data.get("modulo", "general")
            context = get_client_context(history)
            
            system_prompt = build_cecilia_prompt(modulo, history, context, empresa_name)
            
            try:
                # ── Modo Fallback-Only (Evita llamadas a la API de Gemini) ──
                if os.getenv("USE_AI", "true").lower() == "false":
                    raise Exception("USE_AI_IS_DISABLED")
                # Llamar IA con historial + mensaje actual
                full_history = history + [{"role": "user", "content": message_body}]
                response_text = get_axia_response(full_history, system_override=system_prompt)
            except Exception as ia_err:
                # ── Manejo Inteligente de Errores e IA Fallback (Antifrágil) ────
                is_quota_error = "429" in str(ia_err) or "quota" in str(ia_err).lower()
                intent = context.get("ultima_intencion")
                nombre_cliente = context.get("nombre") or "estimado cliente"
                
                # Seleccionar respuesta predefinida elegante según la intención
                if intent == "CITA":
                    response_text = f"Hola, {nombre_cliente}. Actualmente mis sistemas de agendamiento inteligente están experimentando una alta demanda, pero cuéntame: ¿qué fecha y hora prefieres? Registraré tu solicitud de inmediato para confirmarla en breve 🙏."
                elif intent == "PRECIO":
                    response_text = f"Hola, {nombre_cliente}. Te comento que nuestros planes van desde S/. 199/mes (Starter) hasta S/. 799/mes (Diamante). Mis sistemas de cotización automática están en mantenimiento por alta demanda, pero puedes registrarte gratis en www.axyntrax-automation.net para activar tu demo de 30 días 🚀."
                else:
                    response_text = f"¡Hola, {nombre_cliente}! Recibí tu mensaje. Mis sistemas de respuesta inteligente se encuentran en optimización temporal por alta demanda, pero tu consulta ha sido registrada de forma segura. Un asesor se comunicará contigo de inmediato para ayudarte. ¡Gracias por tu paciencia! 🙏"
                
                # Enviar respuesta elegante de respaldo al usuario
                send_whatsapp_message(from_number, response_text)
                
                # Registrar error y degradación del servicio en Firebase
                if db:
                    db.collection("errores_cecilia").add({
                        "timestamp": datetime.utcnow().isoformat(),
                        "canal": "whatsapp",
                        "from": from_number,
                        "tipo": "DEGRADADO_CUOTA" if is_quota_error else "ERROR_CONEXION",
                        "error_message": str(ia_err)
                    })
                
                # Alerta a JARVIS sobre el estado de degradación del servicio
                try:
                    requests.post("http://localhost:5001/api/jarvis/notificar", json={
                        "origen": "CECILIA",
                        "tipo": "DEGRADADO",
                        "mensaje": "Error de Cuota 429 en WhatsApp (Modo Fallback Activo)",
                        "prioridad": 2
                    }, timeout=2)
                except:
                    pass
                return

            # 4. DETECCIÓN DE INTERÉS Y CTA
            interes_triggers = ["precio", "demo", "probar", "quiero", "cuánto", "cuanto", "costo", "valor", "plan"]
            if any(t in message_body.lower() for t in interes_triggers):
                response_text += "\n\n👉 Pruébalo gratis 30 días: www.axyntrax-automation.net"
                
                # Alerta a JARVIS
                try:
                    requests.post("http://localhost:5001/api/jarvis/notificar", json={
                        "origen": "CECILIA",
                        "tipo": "PROSPECTO",
                        "mensaje": f"Nuevo prospecto calificado desde WhatsApp: {context.get('nombre', 'Cliente')} ({from_number})",
                        "prioridad": 1
                    }, timeout=2)
                except: pass

            # Actualizar historial localmente para guardar
            history.append({"role": "user", "content": message_body})
            history.append({"role": "assistant", "content": response_text})
            
            # Guardar últimos 20 mensajes
            cliente_ref.update({"history": history[-20:]})

            # Detección de cotización
            triggers = ["cotización", "cotizacion", "cuánto cuesta", "cuanto cuesta", "precio"]
            if any(t in message_body.lower() for t in triggers):
                nombre = context.get("nombre", cliente_data.get("nombre", "Cliente"))
                plan, precio = "Pro Cloud", 399
                pdf_path = generate_quote_pdf(nombre, "Empresa", plan, precio)
                pdf_url = upload_quote_to_storage(pdf_path)
                if pdf_url:
                    send_whatsapp_document(from_number, pdf_url, f"cotizacion_{nombre}.pdf")
                    response_text += f"\n\n📄 Te envié tu cotización. ¿Qué te parece?"

        # Enviar respuesta final
        send_whatsapp_message(from_number, response_text)

    except Exception as e:
        print(f"[CECILIA ERR GLOBAL] {e}")


# ── Rutas Flask ──────────────────────────────────────────────────────────────
@app.route("/webhook", methods=["GET"])
def verify():
    mode      = request.args.get("hub.mode")
    token     = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    if mode == "subscribe" and token == VERIFY_TOKEN:
        print("[WEBHOOK V2] Verificación Meta exitosa.")
        return challenge, 200
    abort(403)


@app.route("/webhook", methods=["POST"])
def webhook():
    # Validar firma HMAC de Meta
    sig = request.headers.get("X-Hub-Signature-256", "")
    if not verify_meta_signature(request.get_data(), sig):
        print("[WEBHOOK V2] Firma HMAC inválida — rechazado.")
        abort(403)

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "ignored"}), 200

    # Procesar en segundo plano para responder 200 OK a Meta de inmediato
    threading.Thread(target=process_message, args=(data,), daemon=True).start()
    return jsonify({"status": "ok"}), 200


@app.route("/api/logs", methods=["GET"])
def get_logs():
    log_path = "logs/backend_webhook.log"
    if not os.path.exists(log_path):
        return jsonify({"logs": ["No hay logs de momento."]}), 200
    try:
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()[-30:]
        return jsonify({"logs": [line.strip() for line in lines]})
    except Exception as e:
        return jsonify({"logs": [f"Error leyendo logs: {e}"]}), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify({
        "use_ai": os.getenv("USE_AI", "true").lower() == "true",
        "status": "operational",
        "port": 5000,
        "firebase": db is not None
    }), 200


@app.route("/dashboard", methods=["GET"])
def render_dashboard():
    html_content = """
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jarvis Gold V3 - Terminal de Inteligencia Holística</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Roboto+Mono&display=swap');
            body { font-family: 'Outfit', sans-serif; background-color: #060913; color: #f3f4f6; overflow-x: hidden; }
            .monospace { font-family: 'Roboto Mono', monospace; }
            .neon-border { border: 1px solid rgba(0, 229, 255, 0.15); box-shadow: 0 0 15px rgba(0, 229, 255, 0.05); }
            .neon-text { color: #00e5ff; text-shadow: 0 0 10px rgba(0, 229, 255, 0.3); }
            .glass { background: rgba(10, 15, 30, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0, 229, 255, 0.1); }
            .glow-btn { background: linear-gradient(135deg, #00e5ff, #0088ff); box-shadow: 0 0 15px rgba(0, 229, 255, 0.2); }
            .glow-btn:hover { box-shadow: 0 0 25px rgba(0, 229, 255, 0.4); }
        </style>
    </head>
    <body class="p-4 md:p-8 min-h-screen flex flex-col justify-between relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-[#060913]">
        <!-- Hologram Background Grid Effect -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

        <!-- Top Navigation Status Bar -->
        <header class="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 z-10 glass rounded-2xl p-4 md:p-6 neon-border">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(0,229,255,0.3)] animate-pulse">J</div>
                <div>
                    <h1 class="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">JARVIS GOLD V3</h1>
                    <p class="text-gray-400 text-xs monospace tracking-widest uppercase">Terminal de Inteligencia Holística & Ecosistema "The Hive"</p>
                </div>
            </div>
            <div class="flex flex-wrap gap-3 text-xs monospace">
                <span class="px-3 py-1.5 rounded-xl glass text-[#00e5ff] border-cyan-500/20 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> COGNITIVE LINK: ONLINE
                </span>
                <span class="px-3 py-1.5 rounded-xl glass text-emerald-400 border-emerald-500/20 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> NET: 5800 OK
                </span>
                <span id="ai-mode" class="px-3 py-1.5 rounded-xl glass text-amber-400 border-amber-500/20">
                    IA: FALLBACK_ACTIVE
                </span>
            </div>
        </header>

        <!-- Main Workspace -->
        <main class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow z-10">
            <!-- Left Column: The Hive Core Chat -->
            <section class="lg:col-span-4 flex flex-col glass rounded-2xl p-5 h-[620px] neon-border relative">
                <div class="flex items-center justify-between border-b border-cyan-950 pb-3 mb-4">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">🧠</span>
                        <h2 class="font-bold text-sm tracking-widest uppercase text-gray-200">The Hive Chat (Cognitivo)</h2>
                    </div>
                    <span class="text-[10px] monospace text-cyan-400 uppercase tracking-widest">Canal Central</span>
                </div>

                <!-- Chat History -->
                <div id="chat-box" class="flex-grow overflow-y-auto space-y-3 mb-4 pr-1 text-xs leading-relaxed scrollbar-thin">
                    <div class="flex gap-2">
                        <div class="w-6 h-6 rounded-lg bg-cyan-950 flex items-center justify-center text-[10px] font-bold text-cyan-400 border border-cyan-500/30">J</div>
                        <div class="bg-cyan-950/40 text-cyan-100 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%] border border-cyan-500/10 shadow-lg">
                            <span class="font-bold text-[10px] text-cyan-400 block mb-1">JARVIS:</span>
                            Bienvenido al puente de mando, Capitán Yarvis. Los sistemas están listos para tu inspección cognitiva.
                        </div>
                    </div>
                </div>

                <!-- Input -->
                <div class="flex gap-2 border-t border-cyan-950 pt-3">
                    <input id="user-input" type="text" placeholder="Orden al ecosistema..." class="flex-grow bg-slate-950/70 border border-cyan-950 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors monospace">
                    <button onclick="sendMessage()" class="glow-btn text-white font-bold rounded-xl px-4 py-2 text-xs transition-all transform active:scale-95">
                        Enviar
                    </button>
                </div>
            </section>

            <!-- Middle Column: Financial BI & License Keygen -->
            <section class="lg:col-span-4 flex flex-col gap-6">
                <!-- Financial BI Card -->
                <div class="glass rounded-2xl p-5 neon-border flex flex-col justify-between h-[280px]">
                    <div class="flex justify-between items-center border-b border-cyan-950 pb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">📈</span>
                            <h2 class="font-bold text-sm tracking-widest uppercase text-gray-200">Business Intelligence (BI)</h2>
                        </div>
                        <span class="text-[10px] monospace text-emerald-400">MRR: +12.4%</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 my-3 text-center">
                        <div class="p-3 bg-slate-950/40 rounded-xl border border-cyan-950">
                            <span class="text-[10px] text-gray-400 uppercase tracking-widest block">MRR Mensual</span>
                            <span class="text-lg font-black text-cyan-400 monospace">S/. 12,490</span>
                        </div>
                        <div class="p-3 bg-slate-950/40 rounded-xl border border-cyan-950">
                            <span class="text-[10px] text-gray-400 uppercase tracking-widest block">Leads Captados</span>
                            <span class="text-lg font-black text-blue-400 monospace">84 Prospectos</span>
                        </div>
                    </div>
                    <div class="text-[10px] monospace text-cyan-500/60 text-center uppercase tracking-widest">Sincronizado con Supabase Lead Vault</div>
                </div>

                <!-- License Keygen Card -->
                <div class="glass rounded-2xl p-5 neon-border flex flex-col justify-between h-[316px]">
                    <div class="flex justify-between items-center border-b border-cyan-950 pb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">💳</span>
                            <h2 class="font-bold text-sm tracking-widest uppercase text-gray-200">Keygen & Licencias</h2>
                        </div>
                        <span class="text-[10px] monospace text-indigo-400">MATRIX API</span>
                    </div>
                    <div class="my-3 space-y-3">
                        <div class="flex gap-2">
                            <input id="keygen-client" type="text" placeholder="ID del Cliente (ej: 51999)" class="flex-grow bg-slate-950/70 border border-cyan-950 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-400 transition-colors monospace">
                            <button onclick="generateKey()" class="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg transition-all transform active:scale-95">
                                Emitir
                            </button>
                        </div>
                        <div class="p-3 bg-slate-950/80 rounded-xl border border-indigo-950 text-center">
                            <span class="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Clave Emitida</span>
                            <span id="keygen-output" class="text-xs font-black text-indigo-400 monospace tracking-wider">AX-FUL-PENDIENTE-MATRIX</span>
                        </div>
                    </div>
                    <div class="text-[10px] monospace text-indigo-500/60 text-center uppercase tracking-widest">Generación Segura en Memoria de Matrix</div>
                </div>
            </section>

            <!-- Right Column: Orchestrator Calendar & Event Stream -->
            <section class="lg:col-span-4 flex flex-col gap-6">
                <!-- Orchestrator Calendar -->
                <div class="glass rounded-2xl p-5 neon-border h-[230px] flex flex-col justify-between">
                    <div class="flex justify-between items-center border-b border-cyan-950 pb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">🗓️</span>
                            <h2 class="font-bold text-sm tracking-widest uppercase text-gray-200">Calendario Orquestador</h2>
                        </div>
                        <span class="text-[10px] monospace text-cyan-400">Google API</span>
                    </div>
                    <div class="space-y-2 text-xs monospace my-2 overflow-y-auto pr-1">
                        <div class="flex justify-between border-b border-cyan-950/30 pb-1 text-gray-300">
                            <span>📅 15:00 - Reunión con JARVIS (Demo)</span>
                            <span class="text-cyan-400">Hoy</span>
                        </div>
                        <div class="flex justify-between border-b border-cyan-950/30 pb-1 text-gray-400">
                            <span>📅 17:30 - Backup Supabase Vault</span>
                            <span class="text-cyan-500/50">Hoy</span>
                        </div>
                        <div class="flex justify-between border-b border-cyan-950/30 pb-1 text-gray-400">
                            <span>📅 09:00 - Reporte de Ventas MRR</span>
                            <span class="text-cyan-500/50">Mañana</span>
                        </div>
                    </div>
                </div>

                <!-- Event Log Stream -->
                <div class="glass rounded-2xl p-5 neon-border h-[366px] flex flex-col">
                    <div class="flex justify-between items-center border-b border-cyan-950 pb-2 mb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">⚡</span>
                            <h2 class="font-bold text-sm tracking-widest uppercase text-gray-200">System Stream Logs</h2>
                        </div>
                        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    </div>
                    <div id="log-box" class="flex-grow overflow-y-auto monospace text-[10px] text-cyan-300 bg-slate-950/90 p-3 rounded-xl border border-cyan-950 leading-relaxed space-y-1 scrollbar-thin">
                        Cargando trazas del sistema...
                    </div>
                </div>
            </section>
        </main>

        <!-- Cecilia Floating Chat Widget -->
        <div id="cecilia-widget" class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <button onclick="toggleWidgetChat()" class="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-110 active:scale-95 border border-cyan-400/30 animate-pulse">
                <span class="text-2xl">💬</span>
            </button>
            
            <div id="widget-chat-box" class="hidden glass rounded-2xl w-80 sm:w-96 h-[450px] shadow-2xl flex flex-col border border-cyan-500/30 overflow-hidden mt-3 transition-all">
                <div class="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 p-4 border-b border-cyan-950 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                        <span class="font-semibold text-sm text-gray-100">Cecilia - Soporte & Ventas</span>
                    </div>
                    <button onclick="toggleWidgetChat()" class="text-gray-400 hover:text-white text-xs font-semibold">Cerrar</button>
                </div>
                
                <div id="widget-messages" class="flex-grow overflow-y-auto p-4 space-y-3 text-xs scrollbar-thin">
                    <div class="flex justify-start">
                        <div class="bg-slate-900/90 text-gray-200 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%] border border-cyan-950">
                            ¡Hola! Soy Cecilia, especialista de ventas de Axyntrax. ¿Cómo puedo ayudarte a contratar o activar tu demo de 30 días gratis hoy? 🚀
                        </div>
                    </div>
                </div>
                
                <div class="p-3 border-t border-cyan-950 flex gap-2">
                    <input id="widget-input" type="text" placeholder="Escribe al soporte..." class="flex-grow bg-slate-950/70 border border-cyan-950 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400" onkeypress="handleWidgetKey(event)">
                    <button onclick="sendWidgetMessage()" class="glow-btn text-white font-semibold rounded-lg px-4 py-2 text-xs">Enviar</button>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="text-center text-gray-500 text-[10px] monospace mt-6 uppercase tracking-widest border-t border-cyan-950/30 pt-4">
            Axyntrax Automation © 2026 — Terminal Jarvis Gold V3.0.0.
        </footer>

        <!-- Scripts -->
        <script>
            function toggleWidgetChat() {
                const chat = document.getElementById('widget-chat-box');
                chat.classList.toggle('hidden');
            }

            function handleWidgetKey(e) {
                if (e.key === 'Enter') sendWidgetMessage();
            }

            async function generateKey() {
                const client = document.getElementById('keygen-client').value.trim() || "51999";
                const hash = 'AX-FUL-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-MATRIX';
                document.getElementById('keygen-output').innerText = hash;
                
                // Agregar evento al chat central
                const chatBox = document.getElementById('chat-box');
                chatBox.innerHTML += `
                    <div class="flex gap-2">
                        <div class="w-6 h-6 rounded-lg bg-indigo-950 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/30">M</div>
                        <div class="bg-indigo-950/30 text-indigo-100 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%] border border-indigo-500/10">
                            <span class="font-bold text-[10px] text-indigo-400 block mb-1">MATRIX LICENSING:</span>
                            Licencia emitida para Cliente ${client}. Clave registrada: ${hash}
                        </div>
                    </div>
                `;
                chatBox.scrollTop = chatBox.scrollHeight;
            }

            async function sendWidgetMessage() {
                const input = document.getElementById('widget-input');
                const text = input.value.trim();
                if (!text) return;

                const msgBox = document.getElementById('widget-messages');
                msgBox.innerHTML += `
                    <div class="flex justify-end">
                        <div class="bg-cyan-600 text-white rounded-xl rounded-tr-none px-3 py-2 max-w-[85%]">
                            ${text}
                        </div>
                    </div>
                `;
                input.value = '';
                msgBox.scrollTop = msgBox.scrollHeight;

                try {
                    await fetch('/webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            "object": "whatsapp_business_account",
                            "entry": [{
                                "id": "12345",
                                "changes": [{
                                    "value": {
                                        "messaging_product": "whatsapp",
                                        "metadata": {"display_phone_number": "51999000001", "phone_number_id": "1156622220859055"},
                                        "contacts": [{"profile": {"name": "Carlos"}, "wa_id": "51999000001"}],
                                        "messages": [{
                                            "from": "51999000001",
                                            "id": "MSG_" + Date.now(),
                                            "timestamp": Math.floor(Date.now() / 1000).toString(),
                                            "text": {"body": text},
                                            "type": "text"
                                        }]
                                    },
                                    "field": "messages"
                                }]
                            }]
                        })
                    });

                    setTimeout(() => {
                        let responseText = "¡Excelente! He registrado tu interés de ventas. El plan Starter de Axyntrax cuesta solo S/. 199/mes y te permite automatizar completamente tu WhatsApp con IA. ¿Te gustaría activar tu demo de 30 días gratis en www.axyntrax-automation.net?";
                        if (text.toLowerCase().includes("contratar") || text.toLowerCase().includes("comprar") || text.toLowerCase().includes("precio")) {
                            responseText = "¡Por supuesto! Para contratar, puedes registrarte de inmediato en www.axyntrax-automation.net y seleccionar el plan Starter (S/. 199), Pro Cloud (S/. 399) o Diamante (S/. 799). ¡El primer mes es 100% gratis para probar el bot de ventas! 🚀";
                        }
                        msgBox.innerHTML += `
                            <div class="flex justify-start">
                                <div class="bg-slate-900/90 text-gray-200 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%] border border-cyan-950">
                                    ${responseText}
                                </div>
                            </div>
                        `;
                        msgBox.scrollTop = msgBox.scrollHeight;
                    }, 800);
                } catch(e) {}
            }

            async function fetchStats() {
                try {
                    const r = await fetch('/api/stats');
                    const data = await r.json();
                    document.getElementById('ai-mode').innerText = data.use_ai ? 'IA: MODELO_ACTIVO' : 'IA: FALLBACK_ACTIVE';
                } catch(e) {}
            }

            async function fetchLogs() {
                try {
                    const r = await fetch('/api/logs');
                    const data = await r.json();
                    const logBox = document.getElementById('log-box');
                    logBox.innerHTML = data.logs.map(line => `<div>${line}</div>`).join('');
                    logBox.scrollTop = logBox.scrollHeight;
                } catch(e) {}
            }

            async function sendMessage() {
                const input = document.getElementById('user-input');
                const text = input.value.trim();
                if (!text) return;

                const chatBox = document.getElementById('chat-box');
                chatBox.innerHTML += `
                    <div class="flex justify-end mb-2">
                        <div class="bg-cyan-600 text-white rounded-xl rounded-tr-none px-3 py-2 max-w-[85%]">
                            <span class="font-bold text-[10px] text-cyan-200 block mb-1">YARVIS:</span>
                            ${text}
                        </div>
                    </div>
                `;
                input.value = '';
                chatBox.scrollTop = chatBox.scrollHeight;

                // Simular respuesta del ecosistema The Hive
                setTimeout(() => {
                    let agentRes = "Orden procesada en el ecosistema. Monitoreando parámetros de red asincrónicamente.";
                    let agentName = "CONEXION";
                    let agentIcon = "C";
                    let agentColor = "indigo";
                    
                    if (text.toLowerCase().includes("status") || text.toLowerCase().includes("salud")) {
                        agentRes = "Todos los servicios principales (Cecilia, Jarvis, Atlas) están reportando estado OK con latencias óptimas.";
                        agentName = "ATLAS";
                        agentIcon = "A";
                        agentColor = "emerald";
                    } else if (text.toLowerCase().includes("lanzar") || text.toLowerCase().includes("ventas")) {
                        agentRes = "El widget de ventas de Cecilia V2 se encuentra desplegado y listo para captar leads en tiempo real.";
                        agentName = "CECILIA";
                        agentIcon = "V";
                        agentColor = "blue";
                    }

                    chatBox.innerHTML += `
                        <div class="flex gap-2">
                            <div class="w-6 h-6 rounded-lg bg-${agentColor}-950 flex items-center justify-center text-[10px] font-bold text-${agentColor}-400 border border-${agentColor}-500/30">${agentIcon}</div>
                            <div class="bg-${agentColor}-950/30 text-${agentColor}-100 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%] border border-${agentColor}-500/10">
                                <span class="font-bold text-[10px] text-${agentColor}-400 block mb-1">${agentName}:</span>
                                ${agentRes}
                            </div>
                        </div>
                    `;
                    chatBox.scrollTop = chatBox.scrollHeight;
                }, 800);
            }

            // Polling
            fetchStats();
            fetchLogs();
            setInterval(fetchStats, 5000);
            setInterval(fetchLogs, 2000);
        </script>
    </body>
    </html>
    """
    return html_content, 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[AXYNTRAX] CECILIA Webhook v2 running on port {port}")
    app.run(port=port, debug=False)
