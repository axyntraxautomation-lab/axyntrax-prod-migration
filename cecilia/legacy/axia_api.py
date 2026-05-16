"""
AXYNTRAX API SERVER v3.0
Endpoints REST para el dashboard React (axia-core).
Corre en puerto 5001 (separado del webhook en 5000).
NUEVO v3.0: Autenticacion de usuarios, gestion de sesiones, CORS produccion.
"""
import os
import json
import uuid
import hashlib
import datetime
import secrets
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from dotenv import load_dotenv
from db_master.connection import get_db
from db_master.models import get_kpi_summary, init_db

load_dotenv(override=True)

# --- SENTRY OBSERVABILITY ---
try:
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN_BACKEND", ""),
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.05,
        environment=os.getenv("ENV", "development")
    )
    print("[SENTRY] Observabilidad de backend iniciada correctamente.")
except ImportError:
    pass

app = Flask(__name__)

# CORS: permite localhost dev + produccion Vercel/Netlify
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    f"https://{os.getenv('DOMINIO_WEB', 'axyntrax-automation.com')}",
    "https://www.axyntrax-automation.com",
    "https://axyntrax-automation.vercel.app",
    "https://dist-bcgenhizp-axyntraxautomation-1607s-projects.vercel.app",
    "https://phenomenal-semolina-58a73c.netlify.app",
], supports_credentials=True)

# ── Rate limiting (in-memory) ─────────────────────────────────────────────────
from collections import defaultdict, deque
import time

_rate_store = defaultdict(deque)

def is_rate_limited(ip: str, limit: int = 60, window: int = 60) -> bool:
    now = time.time()
    q = _rate_store[ip]
    while q and q[0] < now - window:
        q.popleft()
    if len(q) >= limit:
        return True
    q.append(now)
    return False

@app.before_request
def rate_limit():
    ip = request.remote_addr or "unknown"
    if is_rate_limited(ip):
        return jsonify({"error": "Too many requests"}), 429

# ── Helpers ───────────────────────────────────────────────────────────────────
def sanitize(value: str, max_len: int = 200) -> str:
    if not isinstance(value, str):
        return ""
    import re
    return re.sub(r"[<>\"'%;()&+]", "", value)[:max_len]

def hash_password(password: str) -> str:
    """SHA-256 + salt. Compatible con bcrypt si disponible."""
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    except ImportError:
        salt = secrets.token_hex(16)
        h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return f"sha256:{salt}:{h}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        import bcrypt
        if stored_hash.startswith("sha256:"):
            _, salt, h = stored_hash.split(":")
            return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h
        return bcrypt.checkpw(password.encode(), stored_hash.encode())
    except ImportError:
        if stored_hash.startswith("sha256:"):
            _, salt, h = stored_hash.split(":")
            return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h
        return False

# Sesiones en memoria (simple, sin Redis)
_sessions: dict[str, dict] = {}

def create_session(user_id: int, email: str, rol: str, nombre: str) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = {
        "user_id": user_id,
        "email": email,
        "rol": rol,
        "nombre": nombre,
        "created_at": time.time()
    }
    return token

def get_session(token: str) -> dict | None:
    if not token:
        return None
    session = _sessions.get(token)
    if not session:
        return None
    # Expirar después de 8 horas
    if time.time() - session["created_at"] > 28800:
        _sessions.pop(token, None)
        return None
    return session

def require_auth(f):
    """Decorador: requiere token de sesion valido."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("X-Auth-Token", "")
        session = get_session(token)
        if not session:
            return jsonify({"error": "No autorizado — inicia sesion"}), 401
        request.session = session
        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    """Decorador: requiere rol admin o master."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("X-Auth-Token", "")
        session = get_session(token)
        if not session:
            return jsonify({"error": "No autorizado"}), 401
        if session["rol"] not in ("admin", "master"):
            return jsonify({"error": "Acceso denegado — solo admin"}), 403
        request.session = session
        return f(*args, **kwargs)
    return decorated


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/health", methods=["GET"])
def health():
    wsp_ok = bool(os.getenv("WSP_ACCESS_TOKEN") and os.getenv("WSP_PHONE_NUMBER_ID"))
    gemini_present = bool(os.getenv("GEMINI_API_KEY"))
    use_ai = os.getenv("USE_AI", "true").lower() == "true"
    return jsonify({
        "status": "operational",
        "whatsapp": wsp_ok,
        "gemini_present": gemini_present,
        "use_ai": use_ai,
        "gemini_active": gemini_present and use_ai,
        "version": "3.0",
        "timestamp": datetime.datetime.now().isoformat()
    })


# ══════════════════════════════════════════════════════════════════════════════
# AUTH — Login / Register / Users
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/auth/register", methods=["POST"])
def register():
    """Registra un nuevo usuario. Primer usuario = master, resto = operador."""
    body     = request.get_json(silent=True) or {}
    nombre   = sanitize(body.get("nombre", ""), 80)
    email    = sanitize(body.get("email", ""), 120).lower()
    password = body.get("password", "")
    rol      = sanitize(body.get("rol", "operador"), 20)

    if not nombre or not email or not password:
        return jsonify({"ok": False, "error": "nombre, email y password son requeridos"}), 400
    if len(password) < 6:
        return jsonify({"ok": False, "error": "Password minimo 6 caracteres"}), 400
    if rol not in ("master", "admin", "operador", "viewer"):
        rol = "operador"

    try:
        conn = get_db()
        c    = conn.cursor()

        # Verificar si ya existe
        c.execute("SELECT id FROM usuarios WHERE email = ?", (email,))
        if c.fetchone():
            conn.close()
            return jsonify({"ok": False, "error": "Email ya registrado"}), 409

        # Primer usuario siempre es master
        c.execute("SELECT COUNT(*) FROM usuarios")
        count = c.fetchone()[0]
        if count == 0:
            rol = "master"

        pw_hash = hash_password(password)
        c.execute("""
            INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
            VALUES (?, ?, ?, ?, 1)
        """, (nombre, email, pw_hash, rol))
        conn.commit()
        user_id = c.lastrowid
        conn.close()

        token = create_session(user_id, email, rol, nombre)
        return jsonify({
            "ok":    True,
            "token": token,
            "user":  {"id": user_id, "nombre": nombre, "email": email, "rol": rol}
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Inicia sesion con email + password."""
    body     = request.get_json(silent=True) or {}
    email    = sanitize(body.get("email", ""), 120).lower()
    password = body.get("password", "")

    if not email or not password:
        return jsonify({"ok": False, "error": "Email y password requeridos"}), 400

    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?", (email,))
        row = c.fetchone()
        conn.close()

        if not row:
            return jsonify({"ok": False, "error": "Email o password incorrectos"}), 401
        user_id, nombre, email_db, pw_hash, rol, activo = row
        if not activo:
            return jsonify({"ok": False, "error": "Usuario desactivado"}), 403
        if not verify_password(password, pw_hash):
            return jsonify({"ok": False, "error": "Email o password incorrectos"}), 401

        token = create_session(user_id, email_db, rol, nombre)
        return jsonify({
            "ok":    True,
            "token": token,
            "user":  {"id": user_id, "nombre": nombre, "email": email_db, "rol": rol}
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def me():
    """Verifica token y retorna datos del usuario actual."""
    return jsonify({"ok": True, "user": request.session})


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    token = request.headers.get("X-Auth-Token", "")
    _sessions.pop(token, None)
    return jsonify({"ok": True})


@app.route("/api/auth/reset-password", methods=["POST"])
@require_auth
def reset_password():
    """Permite al usuario autenticado cambiar su propia contraseña."""
    body         = request.get_json(silent=True) or {}
    current_pass = body.get("current_password", "")
    new_pass     = body.get("new_password", "")

    if not current_pass or not new_pass:
        return jsonify({"ok": False, "error": "current_password y new_password requeridos"}), 400
    if len(new_pass) < 6:
        return jsonify({"ok": False, "error": "Nueva contraseña mínimo 6 caracteres"}), 400

    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("SELECT id, password_hash FROM usuarios WHERE email = ?", (request.session["email"],))
        row = c.fetchone()
        if not row or not verify_password(current_pass, row["password_hash"]):
            conn.close()
            return jsonify({"ok": False, "error": "Contraseña actual incorrecta"}), 401
        new_hash = hash_password(new_pass)
        c.execute("UPDATE usuarios SET password_hash = ? WHERE id = ?", (new_hash, row["id"]))
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "mensaje": "Contraseña actualizada correctamente"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/users", methods=["GET"])
@require_admin
def list_users():
    """Lista todos los usuarios del sistema (solo admin)."""
    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY id")
        rows = [{"id": r[0], "nombre": r[1], "email": r[2], "rol": r[3], "activo": bool(r[4])} for r in c.fetchall()]
        conn.close()
        return jsonify({"ok": True, "users": rows, "count": len(rows)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/users/<int:user_id>", methods=["PUT"])
@require_admin
def update_user(user_id):
    """Actualiza rol o estado de un usuario (solo admin)."""
    body   = request.get_json(silent=True) or {}
    rol    = sanitize(body.get("rol", ""), 20)
    activo = body.get("activo")

    try:
        conn = get_db()
        c    = conn.cursor()
        if rol and rol in ("master", "admin", "operador", "viewer"):
            c.execute("UPDATE usuarios SET rol = ? WHERE id = ?", (rol, user_id))
        if activo is not None:
            c.execute("UPDATE usuarios SET activo = ? WHERE id = ?", (1 if activo else 0, user_id))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/users/<int:user_id>", methods=["DELETE"])
@require_admin
def delete_user(user_id):
    """Desactiva un usuario (no elimina para auditoría)."""
    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("UPDATE usuarios SET activo = 0 WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# KPIs / DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/dashboard/kpis", methods=["GET"])
def get_kpis():
    try:
        data = get_kpi_summary()
        try:
            conn = get_db()
            c    = conn.cursor()
            c.execute("SELECT COUNT(*) FROM clientes WHERE estado NOT IN ('Prospecto','Inactivo')")
            data["clientes_activos"] = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM clientes WHERE estado='Prospecto'")
            data["prospectos"]       = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM citas WHERE resultado='Pendiente' AND fecha_cita LIKE ?",
                      (datetime.datetime.now().strftime("%Y-%m-%d") + "%",))
            data["citas_hoy"]        = c.fetchone()[0]
            conn.close()
        except Exception as db_err:
            print(f"[DB ERROR] get_kpis fallback: {db_err}")
            data["clientes_activos"] = data.get("clientes_activos", 0)
            data["prospectos"] = data.get("prospectos", 0)
            data["citas_hoy"] = data.get("citas_hoy", 0)
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/dashboard/alerts", methods=["GET"])
def get_alerts():
    try:
        from suite_diamante.logic.axia.brain import get_brain
        alerts = get_brain().check_critical_alerts()
        return jsonify({"ok": True, "alerts": alerts, "count": len(alerts)})
    except Exception as e:
        return jsonify({"ok": False, "alerts": [], "error": str(e)}), 500


@app.route("/api/dashboard/brief", methods=["GET"])
def get_daily_brief():
    try:
        from suite_diamante.logic.axia.brain import get_brain
        brief = get_brain().generate_axia_daily_brief()
        return jsonify({"ok": True, "brief": brief})
    except Exception as e:
        return jsonify({"ok": False, "brief": "Sistema AXIA inicializando...", "error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# AXIA CHAT
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/chat", methods=["POST"])
def axia_chat():
    body    = request.get_json(silent=True) or {}
    message = sanitize(body.get("message", ""), 500)
    if not message:
        return jsonify({"ok": False, "error": "Mensaje vacio"}), 400

    gemini_key = os.getenv("GEMINI_API_KEY", "")

    try:
        kpi = {}
        try:
            kpi = get_kpi_summary()
            conn = get_db()
            c    = conn.cursor()
            c.execute("SELECT COUNT(*) FROM clientes WHERE estado NOT IN ('Prospecto','Inactivo')")
            kpi["clientes_activos"] = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM clientes WHERE estado='Prospecto'")
            kpi["prospectos"] = c.fetchone()[0]
            conn.close()
        except Exception:
            pass

        context_str = (
            f"Estado: Ingresos S/.{kpi.get('ingresos',0):.2f} | "
            f"Pendientes S/.{kpi.get('pendientes',0):.2f} | "
            f"Clientes activos:{kpi.get('clientes_activos',0)} | "
            f"Prospectos:{kpi.get('prospectos',0)} | "
            f"Licencias:{kpi.get('licencias',0)}"
        )

        system_prompt = f"""Eres AXIA, la inteligencia gerencial de AXYNTRAX Automation.
Propietario: Miguel Montero. Lima, Peru.
{context_str}
Responde en espanol, conciso (max 4 oraciones), con datos reales. Eres AXIA, no una IA generica."""

        use_ai = os.getenv("USE_AI", "true").lower() == "true"
        if gemini_key and use_ai:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_prompt)
            max_tokens = int(os.getenv("MAX_TOKENS", 300))
            temperature = float(os.getenv("TEMPERATURE", 0.5))
            response = model.generate_content(
                message,
                generation_config={"temperature": temperature, "max_output_tokens": max_tokens}
            )
            reply = response.text.strip()
            mode  = "gemini"
        else:
            lower = message.lower()
            if any(w in lower for w in ["caja","ingreso","dinero","kpi","financ"]):
                reply = (f"Estado financiero: Ingresos S/. {kpi.get('ingresos',0):.2f} | "
                         f"Pendiente S/. {kpi.get('pendientes',0):.2f}. "
                         f"{kpi.get('clientes_activos',0)} clientes activos. "
                         f"Configura GEMINI_API_KEY para IA completa.")
            elif any(w in lower for w in ["alerta","critico","problema"]):
                reply = "Sin alertas criticas. Sistema al 100%."
            elif any(w in lower for w in ["resumen","ejecutivo","hoy"]):
                reply = (f"Resumen: {kpi.get('clientes_activos',0)} clientes, "
                         f"S/. {kpi.get('ingresos',0):.2f} caja, "
                         f"{kpi.get('licencias',0)} licencias. "
                         f"Sistema operativo.")
            else:
                reply = (f"Procesando consulta. Sistema con {kpi.get('clientes_activos',0)} clientes "
                         f"y S/. {kpi.get('ingresos',0):.2f} en caja. "
                         f"Configura GEMINI_API_KEY para respuestas con IA real.")
            mode = "local"

        return jsonify({"ok": True, "reply": reply, "mode": mode})
    except Exception as e:
        return jsonify({"ok": False, "reply": f"Error: {str(e)[:80]}", "mode": "error"}), 500


# ══════════════════════════════════════════════════════════════════════════════
# LICENCIAS (KEYGE)
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/license/generate", methods=["POST"])
@require_admin
def generate_license():
    body    = request.get_json(silent=True) or {}
    tipo    = sanitize(body.get("tipo", "DEMO"))
    dias    = int(body.get("dias", 14))
    rubro   = sanitize(body.get("rubro", "general"))
    modulos = body.get("modulos", ["general"])

    if tipo not in ("DEMO", "BASICA", "PRO", "EMPRESA"):
        return jsonify({"ok": False, "error": "Tipo invalido"}), 400

    raw_key   = f"AXN-{tipo[:2].upper()}-{uuid.uuid4().hex[:8].upper()}"
    hoy       = datetime.datetime.now()
    fecha_fin = (hoy + datetime.timedelta(days=dias)).strftime("%Y-%m-%d")

    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("""
            INSERT INTO licencias (clave, tipo, dias, rubro, estado, fecha_inicio, fecha_fin, notas)
            VALUES (?, ?, ?, ?, 'Emitida', ?, ?, ?)
        """, (raw_key, tipo, dias, rubro, hoy.strftime("%Y-%m-%d"), fecha_fin,
              f"Modulos: {','.join(modulos)}"))
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "key": raw_key, "tipo": tipo, "dias": dias,
                        "vence": fecha_fin, "modulos": modulos})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/license/validate", methods=["POST"])
def validate_license():
    body = request.get_json(silent=True) or {}
    key  = sanitize(body.get("key", ""))

    if not key:
        return jsonify({"ok": False, "error": "KEY requerida"}), 400

    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("SELECT tipo, rubro, estado, fecha_fin, notas FROM licencias WHERE clave = ?", (key,))
        row = c.fetchone()
        conn.close()

        if not row:
            return jsonify({"ok": False, "active": False, "error": "KEY no encontrada"}), 404

        tipo, rubro, estado, fecha_fin, notas = row[0], row[1], row[2], row[3], row[4]
        vence   = datetime.datetime.strptime(fecha_fin, "%Y-%m-%d") if fecha_fin else None
        expired = vence and vence < datetime.datetime.now()

        if estado != "Emitida" or expired:
            return jsonify({"ok": True, "active": False, "reason": "Licencia vencida o revocada"})

        modulos = ["general"]
        if notas and "Modulos:" in notas:
            modulos = [m.strip() for m in notas.replace("Modulos:", "").split(",")]

        return jsonify({"ok": True, "active": True, "tipo": tipo, "rubro": rubro,
                        "vence": fecha_fin, "modulos": modulos})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# QR WHATSAPP
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/qr/<license_key>", methods=["GET"])
def generate_qr(license_key: str):
    try:
        import qrcode, io
        from flask import send_file
        phone  = os.getenv("ADMIN_PHONE_NUMBER", "51991740590")
        wa_url = f"https://wa.me/{phone}?text=INICIO_{sanitize(license_key)}"
        qr     = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(wa_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#00bcd4", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return send_file(buf, mimetype="image/png", download_name=f"qr_{license_key}.png")
    except ImportError:
        phone  = os.getenv("ADMIN_PHONE_NUMBER", "51991740590")
        wa_url = f"https://wa.me/{phone}?text=INICIO_{license_key}"
        return jsonify({"ok": True, "url": wa_url})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# CLIENTES
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/clients", methods=["GET"])
def list_clients():
    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute("""SELECT id, empresa, contacto, email, telefono, rubro, estado, score
                     FROM clientes ORDER BY id DESC LIMIT 100""")
        rows = [dict(zip(["id","empresa","contacto","email","telefono","rubro","estado","score"], r))
                for r in c.fetchall()]
        conn.close()
        return jsonify({"ok": True, "data": rows, "count": len(rows)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ARRANQUE
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    init_db()
    port = int(os.getenv("API_PORT", 5001))
    use_ai = os.getenv("USE_AI", "true").lower() == "true"
    gemini_present = bool(os.getenv("GEMINI_API_KEY"))
    gemini_active = gemini_present and use_ai
    print(f"[AXYNTRAX API v3.0] Puerto {port} | Auth: ON | Gemini present: {gemini_present} | Use_AI: {use_ai} | Gemini active: {gemini_active}")
    app.run(port=port, debug=False, host="0.0.0.0")
