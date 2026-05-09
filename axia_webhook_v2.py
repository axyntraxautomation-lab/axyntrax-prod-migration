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
- Cuando detectes interés real (precio, demo, quiero, cuánto, probar) → invita a registrarse en www.axyntrax-automation.net para el demo de 45 días gratis
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
                    response_text = f"Hola, {nombre_cliente}. Te comento que nuestros planes van desde S/. 199/mes (Starter) hasta S/. 799/mes (Diamante). Mis sistemas de cotización automática están en mantenimiento por alta demanda, pero puedes registrarte gratis en www.axyntrax-automation.net para activar tu demo de 45 días 🚀."
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
                response_text += "\n\n👉 Pruébalo gratis 45 días: www.axyntrax-automation.net"
                
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
        <title>Axyntrax - Dashboard & Simulador</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Roboto+Mono&display=swap');
            body { font-family: 'Outfit', sans-serif; background-color: #0b0f19; color: #f3f4f6; }
            .monospace { font-family: 'Roboto Mono', monospace; }
            .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        </style>
    </head>
    <body class="p-6 md:p-12 min-h-screen flex flex-col justify-between relative">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">AXYNTRAX AUTOMATION SUITE</h1>
                <p class="text-gray-400 text-sm mt-1">Consola Gerencial Unificada & Simulador de Cecilia</p>
            </div>
            <div class="flex gap-3 text-xs">
                <span class="px-3 py-1.5 rounded-full font-semibold glass text-emerald-400 border-emerald-500/20 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SISTEMA ACTIVO
                </span>
                <span id="ai-mode" class="px-3 py-1.5 rounded-full font-semibold glass text-amber-400 border-amber-500/20">
                    IA: MODO FALLBACK
                </span>
            </div>
        </header>

        <!-- Main Content Grid -->
        <main class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
            <!-- Left Side: Simulator -->
            <section class="lg:col-span-5 flex flex-col glass rounded-2xl p-6 h-[600px] shadow-2xl relative">
                <div class="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">C</div>
                    <div>
                        <h2 class="font-semibold text-lg text-white">Cecilia (WhatsApp Bot v2)</h2>
                        <p class="text-xs text-emerald-400">En linea | Modo Fallback</p>
                    </div>
                </div>

                <!-- Chat History -->
                <div id="chat-box" class="flex-grow overflow-y-auto space-y-3 mb-4 pr-2 text-sm">
                    <div class="flex justify-start">
                        <div class="bg-gray-800 text-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-md">
                            ¡Hola! Soy CECILIA, tu asistente de AXYNTRAX 👋 ¿Con quién tengo el gusto de hablar?
                        </div>
                    </div>
                </div>

                <!-- Input Field -->
                <div class="flex gap-2">
                    <input id="user-input" type="text" placeholder="Escribe un mensaje de prueba..." class="flex-grow bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors">
                    <button onclick="sendMessage()" class="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl px-6 py-3 text-sm shadow-lg transition-all transform active:scale-95">
                        Enviar
                    </button>
                </div>
            </section>

            <!-- Right Side: Log & Telemetry Dashboard -->
            <section class="lg:col-span-7 flex flex-col gap-6">
                <!-- Telemetry Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="glass p-4 rounded-xl flex flex-col justify-between">
                        <span class="text-xs text-gray-400 uppercase tracking-wider">Puerto Webhook</span>
                        <span class="text-2xl font-bold text-cyan-400 mt-1 monospace">5000</span>
                    </div>
                    <div class="glass p-4 rounded-xl flex flex-col justify-between">
                        <span class="text-xs text-gray-400 uppercase tracking-wider">Manejo de 429</span>
                        <span class="text-2xl font-bold text-emerald-400 mt-1">Activo</span>
                    </div>
                    <div class="glass p-4 rounded-xl flex flex-col justify-between">
                        <span class="text-xs text-gray-400 uppercase tracking-wider">Firebase</span>
                        <span id="firebase-status" class="text-2xl font-bold text-gray-400 mt-1">Desconectado</span>
                    </div>
                </div>

                <!-- Log Viewer Console -->
                <div class="flex-grow glass rounded-2xl p-6 h-[415px] flex flex-col">
                    <div class="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                        <h3 class="font-semibold text-gray-200">Consola de Eventos (backend_webhook.log)</h3>
                        <span class="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
                    </div>
                    <div id="log-box" class="flex-grow overflow-y-auto monospace text-xs text-cyan-300 bg-gray-950 p-4 rounded-xl border border-gray-900 leading-relaxed space-y-1">
                        Cargando registros del sistema...
                    </div>
                </div>
            </section>
        </main>

        <!-- Cecilia Floating Chat Widget -->
        <div id="cecilia-widget" class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <!-- Floating Button -->
            <button onclick="toggleWidgetChat()" class="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-110 active:scale-95 border border-cyan-400/30 animate-pulse">
                <span class="text-2xl">💬</span>
            </button>
            
            <!-- Chat Window -->
            <div id="widget-chat-box" class="hidden glass rounded-2xl w-80 sm:w-96 h-[450px] shadow-2xl flex flex-col border border-cyan-500/30 overflow-hidden mt-3 transition-all">
                <!-- Header -->
                <div class="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 p-4 border-b border-gray-800 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                        <span class="font-semibold text-sm text-gray-100">Cecilia - Soporte & Ventas</span>
                    </div>
                    <button onclick="toggleWidgetChat()" class="text-gray-400 hover:text-white text-xs font-semibold">Cerrar</button>
                </div>
                
                <!-- Messages -->
                <div id="widget-messages" class="flex-grow overflow-y-auto p-4 space-y-3 text-xs">
                    <div class="flex justify-start">
                        <div class="bg-gray-800 text-gray-200 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%]">
                            ¡Hola! Soy Cecilia, especialista de ventas de Axyntrax. ¿Cómo puedo ayudarte a contratar o activar tu demo de 45 días gratis hoy? 🚀
                        </div>
                    </div>
                </div>
                
                <!-- Input -->
                <div class="p-3 border-t border-gray-800 flex gap-2">
                    <input id="widget-input" type="text" placeholder="Escribe al soporte..." class="flex-grow bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500" onkeypress="handleWidgetKey(event)">
                    <button onclick="sendWidgetMessage()" class="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg px-4 py-2 text-xs">Enviar</button>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="text-center text-gray-500 text-xs mt-8">
            Axyntrax Automation © 2026 — Consola de Control Segura e Inmune.
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
                        let responseText = "¡Excelente! He registrado tu interés de ventas. El plan Starter de Axyntrax cuesta solo S/. 199/mes y te permite automatizar completamente tu WhatsApp con IA. ¿Te gustaría activar tu demo de 45 días gratis en www.axyntrax-automation.net?";
                        if (text.toLowerCase().includes("contratar") || text.toLowerCase().includes("comprar") || text.toLowerCase().includes("precio")) {
                            responseText = "¡Por supuesto! Para contratar, puedes registrarte de inmediato en www.axyntrax-automation.net y seleccionar el plan Starter (S/. 199), Pro Cloud (S/. 399) o Diamante (S/. 799). ¡El primer mes es 100% gratis para probar el bot de ventas! 🚀";
                        }
                        msgBox.innerHTML += `
                            <div class="flex justify-start">
                                <div class="bg-gray-800 text-gray-200 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%]">
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
                    document.getElementById('ai-mode').innerText = data.use_ai ? 'IA: MODELO ACTIVO' : 'IA: MODO FALLBACK (Cero Gasto)';
                    document.getElementById('ai-mode').className = data.use_ai ? 'px-3 py-1.5 rounded-full font-semibold glass text-cyan-400 border-cyan-500/20' : 'px-3 py-1.5 rounded-full font-semibold glass text-amber-400 border-amber-500/20';
                    document.getElementById('firebase-status').innerText = data.firebase ? 'Conectado' : 'Offline';
                    document.getElementById('firebase-status').className = data.firebase ? 'text-2xl font-bold text-emerald-400 mt-1' : 'text-2xl font-bold text-amber-400 mt-1';
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
                // Agregar mensaje de usuario
                chatBox.innerHTML += `
                    <div class="flex justify-end">
                        <div class="bg-cyan-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] shadow-md">
                            ${text}
                        </div>
                    </div>
                `;
                input.value = '';
                chatBox.scrollTop = chatBox.scrollHeight;

                // Simular payload de webhook hacia Cecilia
                const payload = {
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
                };

                try {
                    await fetch('/webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    // Agregar respuesta simulada o placeholder elegante de Cecilia
                    setTimeout(() => {
                        let fallbackMsg = "¡Hola, Carlos! Recibí tu mensaje correctamente. Mis sistemas de respuesta inteligente se encuentran en optimización temporal por alta demanda, pero tu consulta ha sido registrada de forma segura. Un asesor se comunicará contigo de inmediato para ayudarte. 🙏";
                        if (text.toLowerCase().includes("cita") || text.toLowerCase().includes("turno")) {
                            fallbackMsg = "Hola, Carlos. Actualmente mis sistemas de agendamiento inteligente están experimentando una alta demanda, pero cuéntame: ¿qué fecha y hora prefieres? Registraré tu solicitud de inmediato para confirmarla en breve 🙏.";
                        } else if (text.toLowerCase().includes("precio") || text.toLowerCase().includes("costo") || text.toLowerCase().includes("plan")) {
                            fallbackMsg = "Hola, Carlos. Te comento que nuestros planes van desde S/. 199/mes (Starter) hasta S/. 799/mes (Diamante). Mis sistemas de cotización automática están en mantenimiento por alta demanda, pero puedes registrarte gratis en www.axyntrax-automation.net para activar tu demo de 45 días 🚀.";
                        }
                        
                        chatBox.innerHTML += `
                            <div class="flex justify-start animate-fade-in">
                                <div class="bg-gray-800 text-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-md">
                                    ${fallbackMsg}
                                </div>
                            </div>
                        `;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }, 800);
                } catch(e) {}
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
