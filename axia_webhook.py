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
            print("[WEBHOOK] Firebase inicializado correctamente.")
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
# Webhook Meta: mismo criterio que api/index.js — META_VERIFY_TOKEN en .env; si falta, valor fijo Axyntrax_2026_Secure.
VERIFY_TOKEN = (os.getenv("META_VERIFY_TOKEN") or "").strip() or "Axyntrax_2026_Secure"
APP_SECRET      = os.getenv("WSP_APP_SECRET", "")  # Para validar firma HMAC


# ── Validación HMAC (seguridad Meta) ────────────────────────────────────────
def verify_meta_signature(payload: bytes, signature_header: str) -> bool:
    """Verifica que el webhook viene realmente de Meta."""
    if not APP_SECRET:
        return True  # Sin secret configurado, pasar (modo dev)
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    mac = hmac.new(APP_SECRET.encode("utf-8"), payload, hashlib.sha256)
    expected = "sha256=" + mac.hexdigest()
    return hmac.compare_digest(expected, signature_header)


# ── Envío WhatsApp con retry ─────────────────────────────────────────────────
def send_whatsapp_message(to: str, text: str, retries: int = 3) -> bool:
    """Envía mensaje con hasta 3 reintentos automáticos."""
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        print(f"[WSP-STUB] Mensaje a {to}: {text[:80]}")
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
                # Llamar IA con historial + mensaje actual
                full_history = history + [{"role": "user", "content": message_body}]
                response_text = get_axia_response(full_history, system_override=system_prompt)
            except Exception as ia_err:
                # 2. MANEJO DE ERROR GEMINI
                error_msg = "Estoy verificando tu solicitud, te respondo en un momento 🙏"
                send_whatsapp_message(from_number, error_msg)
                
                # Registrar error en Firebase
                db.collection("errores_cecilia").add({
                    "timestamp": datetime.utcnow().isoformat(),
                    "canal": "whatsapp",
                    "from": from_number,
                    "error_message": str(ia_err)
                })
                return

            # 4. DETECCIÓN DE INTERÉS Y CTA
            interes_triggers = ["precio", "demo", "probar", "quiero", "cuánto", "cuanto", "costo", "valor", "plan"]
            if any(t in message_body.lower() for t in interes_triggers):
                response_text += "\n\n👉 Pruébalo gratis 45 días: www.axyntrax-automation.net"
                
                # Alerta a JARVIS
                try:
                    requests.post(f"{request.url_root}jarvis/alert", json={
                        "tipo": "nuevo_prospecto",
                        "nombre": context.get("nombre", "Cliente"),
                        "canal": "whatsapp",
                        "mensaje": message_body
                    }, timeout=5)
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
        print("[WEBHOOK] Verificación Meta exitosa.")
        return challenge, 200
    abort(403)


@app.route("/webhook", methods=["POST"])
def webhook():
    # Validar firma HMAC de Meta
    sig = request.headers.get("X-Hub-Signature-256", "")
    if not verify_meta_signature(request.get_data(), sig):
        print("[WEBHOOK] Firma HMAC inválida — rechazado.")
        abort(403)

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "ignored"}), 200

    # Procesar en segundo plano para responder 200 OK a Meta de inmediato
    threading.Thread(target=process_message, args=(data,), daemon=True).start()
    return jsonify({"status": "ok"}), 200


@app.route("/jarvis/alert", methods=["POST"])
def jarvis_alert():
    """Endpoint para recibir alertas internas de Cecilia/ATLAS."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "no_data"}), 400
    
    if db:
        db.collection("alertas_jarvis").add({
            **data,
            "timestamp": firestore.SERVER_TIMESTAMP
        })
    return jsonify({"status": "alert_logged"}), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":    "operational",
        "service":   "CECILIA WhatsApp Bot 24/7",
        "firebase":  db is not None,
        "whatsapp":  bool(ACCESS_TOKEN and PHONE_NUMBER_ID),
        "version":   "CECILIA v2.0"
    }), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[AXYNTRAX] CECILIA Webhook corriendo en puerto {port}")
    app.run(port=port, debug=False)
