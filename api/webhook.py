import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import requests
import stripe
from flask import Flask, request, jsonify, redirect

app = Flask(__name__)

# Fuente de verdad (sincronizar con assets/axyntrax-config.json)
DEMO_DAYS = 45
PRICE_STARTER = 199
PRICE_PRO = 399
PRICE_DIAMANTE = 799
INSTALLER_URL = "https://www.axyntrax-automation.net/api/installer"
CTA_ACTIVACION = "SOLICITAR ACTIVACIÓN"
REGISTRO_PATH = "/registro.html"
CECILIA_FALLBACK = (
    "✅ ¡Hola! Recibimos tu mensaje. Para activar tus 45 días gratis o descargar "
    f"los optimizadores, ve directo a: {INSTALLER_URL}"
)

VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN") or os.getenv("WH_VERIFY_TOKEN", "Axyntrax_2026_Secure")
ACCESS_TOKEN = os.getenv("WSP_ACCESS_TOKEN") or os.getenv("WHATSAPP_TOKEN")
PHONE_ID = os.getenv("WSP_PHONE_NUMBER_ID", "1156622220859055")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

PLAN_ALIASES = {
    "starter": "starter",
    "pro": "pro",
    "pro_cloud": "pro",
    "cloud": "pro",
    "diamante": "diamante",
    "diamond": "diamante",
}
PLAN_BY_AMOUNT_PEN = {
    PRICE_STARTER: "starter",
    PRICE_PRO: "pro",
    PRICE_DIAMANTE: "diamante",
    PRICE_STARTER * 100: "starter",
    PRICE_PRO * 100: "pro",
    PRICE_DIAMANTE * 100: "diamante",
}

SYSTEM_PROMPT = f"""Eres Cecilia, la IA orquestadora de AXYNTRAX Automation Suite.
Vendes automatización B2B para PYMES peruanas. Tono profesional, cálido, orientado a cierre.
Planes (PEN + IGV): Starter S/{PRICE_STARTER}, Pro Cloud S/{PRICE_PRO}, Diamante S/{PRICE_DIAMANTE}.
Demo gratuita: {DEMO_DAYS} días. CTA: {CTA_ACTIVACION} en {REGISTRO_PATH}. Instalador: {INSTALLER_URL}
Nunca menciones errores técnicos, APIs ni "dificultades técnicas". Respuestas breves."""

_TECHNICAL_RE = (
    "error en mi cerebro",
    "dificultades técnicas",
    "problema técnico",
    "error 500",
    "error 404",
    "api key",
    "deepseek",
    "traceback",
    "exception",
)


def es_respuesta_tecnica(texto: str) -> bool:
    t = (texto or "").lower()
    return any(x in t for x in _TECHNICAL_RE)


def normalizar_respuesta(texto: str) -> str:
    limpio = (texto or "").strip()
    if not limpio or es_respuesta_tecnica(limpio):
        return CECILIA_FALLBACK
    return limpio


def respuesta_comercial_rapida(texto: str) -> Optional[str]:
    t = (texto or "").lower()
    if any(x in t for x in ("hola", "buenos", "buenas", "qué tal", "que tal")):
        return (
            f"¡Hola! 👋 Soy Cecilia de Axyntrax. ¿Quieres activar tu demo de {DEMO_DAYS} días "
            f"o ver planes desde S/{PRICE_STARTER}? {INSTALLER_URL}"
        )
    if any(x in t for x in ("activar", "prueba", "demo", "gratis", "registr", "solicitar")):
        return (
            f"Perfecto 🙌 Demo {DEMO_DAYS} días sin tarjeta. En {REGISTRO_PATH} pulsa "
            f"«{CTA_ACTIVACION}» o descarga: {INSTALLER_URL}"
        )
    if any(x in t for x in ("precio", "costo", "cuanto", "cuánto", "plan")):
        return (
            f"Planes: Starter S/{PRICE_STARTER}, Pro Cloud S/{PRICE_PRO}, "
            f"Diamante S/{PRICE_DIAMANTE} al mes. ¿Te activo la demo de {DEMO_DAYS} días?"
        )
    return None


def llamar_deepseek(mensaje_usuario: str) -> str:
    rapida = respuesta_comercial_rapida(mensaje_usuario)
    if rapida:
        return rapida

    if not DEEPSEEK_API_KEY:
        return CECILIA_FALLBACK

    try:
        clean_key = str(DEEPSEEK_API_KEY).strip().encode("ascii", "ignore").decode("ascii")
        url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json; charset=utf-8",
        }
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": str(mensaje_usuario).encode("utf-8", "ignore").decode("utf-8"),
                },
            ],
            "temperature": 0.7,
        }
        response = requests.post(url, headers=headers, json=payload, timeout=12)
        response.raise_for_status()
        return normalizar_respuesta(response.json()["choices"][0]["message"]["content"])
    except Exception as e:
        print(f"[CECILIA/DeepSeek] {e}")
        return CECILIA_FALLBACK


def supabase_headers(prefer: str = "return=representation") -> Dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase no configurado")
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def normalizar_plan(raw: Optional[str], amount: Optional[int] = None) -> str:
    if raw:
        key = str(raw).strip().lower().replace(" ", "_")
        if key in PLAN_ALIASES:
            return PLAN_ALIASES[key]
    if amount is not None and amount in PLAN_BY_AMOUNT_PEN:
        return PLAN_BY_AMOUNT_PEN[amount]
    return "starter"


def registrar_pago_supabase(
    email: str,
    whatsapp: Optional[str],
    plan: str,
    amount: int,
    status: str,
    payment_intent_id: str,
) -> None:
    if not email:
        print("[Supabase] email vacío, se omite registro")
        return

    demo_expires = (datetime.now(timezone.utc) + timedelta(days=DEMO_DAYS)).isoformat()
    user_payload = {
        "email": email.strip().lower(),
        "whatsapp": whatsapp,
        "plan": plan,
        "demo_expires_at": demo_expires,
    }
    user_res = requests.post(
        f"{SUPABASE_URL}/rest/v1/users?on_conflict=email",
        headers=supabase_headers("resolution=merge-duplicates,return=representation"),
        json=user_payload,
        timeout=15,
    )
    if user_res.status_code >= 400:
        print(f"[Supabase/users] {user_res.status_code} {user_res.text}")
        return

    rows = user_res.json()
    user_id = rows[0]["id"] if isinstance(rows, list) and rows else None
    if not user_id:
        print("[Supabase] no se obtuvo user_id")
        return

    existing = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments",
        headers=supabase_headers(),
        params={
            "stripe_payment_intent": f"eq.{payment_intent_id}",
            "select": "id",
            "limit": "1",
        },
        timeout=15,
    )
    if existing.ok and existing.json():
        print(f"[Supabase] pago ya registrado: {payment_intent_id}")
        return

    pay_res = requests.post(
        f"{SUPABASE_URL}/rest/v1/payments",
        headers=supabase_headers(),
        json={
            "user_id": user_id,
            "amount": amount,
            "status": status,
            "stripe_payment_intent": payment_intent_id,
        },
        timeout=15,
    )
    if pay_res.status_code >= 400:
        print(f"[Supabase/payments] {pay_res.status_code} {pay_res.text}")


def extraer_datos_stripe(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    event_type = event.get("type", "")
    obj = (event.get("data") or {}).get("object") or {}
    metadata = obj.get("metadata") or {}

    if event_type == "checkout.session.completed":
        email = (
            obj.get("customer_email")
            or (obj.get("customer_details") or {}).get("email")
            or metadata.get("email")
        )
        amount = int(obj.get("amount_total") or 0)
        payment_intent_id = obj.get("payment_intent") or obj.get("id")
        return {
            "email": email,
            "whatsapp": metadata.get("whatsapp"),
            "plan": normalizar_plan(metadata.get("plan"), amount),
            "amount": amount,
            "status": "paid",
            "payment_intent_id": str(payment_intent_id),
        }

    if event_type in ("payment_intent.succeeded", "payment_intent.payment_failed"):
        charges = (obj.get("charges") or {}).get("data") or []
        billing = (charges[0].get("billing_details") if charges else {}) or {}
        email = billing.get("email") or metadata.get("email")
        amount = int(obj.get("amount") or 0)
        return {
            "email": email,
            "whatsapp": metadata.get("whatsapp"),
            "plan": normalizar_plan(metadata.get("plan"), amount),
            "amount": amount,
            "status": "paid" if event_type == "payment_intent.succeeded" else "failed",
            "payment_intent_id": str(obj.get("id")),
        }

    return None


def enviar_whatsapp(num: str, texto: str) -> None:
    if not ACCESS_TOKEN:
        print("[WhatsApp] Falta WSP_ACCESS_TOKEN o WHATSAPP_TOKEN")
        return
    url = f"https://graph.facebook.com/v20.0/{PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": num,
        "type": "text",
        "text": {"body": texto},
    }
    requests.post(url, headers=headers, json=payload, timeout=15)


@app.route("/api/installer", methods=["GET"])
def installer_redirect():
    return redirect(REGISTRO_PATH, code=302)


@app.route("/", methods=["GET", "POST"])
@app.route("/api/cecilia/webhook", methods=["GET", "POST"])
@app.route("/api", methods=["GET", "POST"])
def webhook_whatsapp():
    if request.method == "GET":
        mode = request.args.get("hub.mode")
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")
        if mode == "subscribe" and token == VERIFY_TOKEN and challenge is not None:
            return str(challenge), 200
        return "Forbidden", 403

    try:
        data = request.get_json(silent=True) or {}
        if data.get("entry"):
            changes = data["entry"][0].get("changes", [{}])[0]
            value = changes.get("value", {})
            if "messages" in value:
                msg = value["messages"][0]
                if msg.get("type") == "text":
                    num = msg["from"]
                    texto = msg.get("text", {}).get("body", "Hola")
                    respuesta = normalizar_respuesta(llamar_deepseek(texto))
                    enviar_whatsapp(num, respuesta)
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        print(f"[webhook POST] {e}")
        return jsonify({"status": "ok"}), 200


@app.route("/api/stripe-webhook", methods=["POST"])
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")

    if not STRIPE_WEBHOOK_SECRET:
        print("[Stripe] Falta STRIPE_WEBHOOK_SECRET")
        return jsonify({"error": "webhook no configurado"}), 503

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return jsonify({"error": "payload inválido"}), 400
    except stripe.SignatureVerificationError:
        return jsonify({"error": "firma inválida"}), 400

    datos = extraer_datos_stripe(event)
    if datos and datos.get("email") and datos.get("payment_intent_id"):
        try:
            registrar_pago_supabase(
                email=datos["email"],
                whatsapp=datos.get("whatsapp"),
                plan=datos["plan"],
                amount=datos["amount"],
                status=datos["status"],
                payment_intent_id=datos["payment_intent_id"],
            )
        except Exception as e:
            print(f"[Stripe/Supabase] {e}")

    return jsonify({"received": True}), 200


@app.route("/api/cecilia/chat", methods=["POST"])
def chat_web():
    try:
        data = request.get_json(silent=True) or {}
        mensaje = data.get("message", "Hola")
        respuesta = normalizar_respuesta(llamar_deepseek(mensaje))
        return jsonify({"reply": respuesta})
    except Exception as e:
        print(f"[chat_web] {e}")
        return jsonify({"reply": CECILIA_FALLBACK})


if __name__ == "__main__":
    app.run()
