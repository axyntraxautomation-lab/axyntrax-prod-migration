"""
AXIA SYSTEM — Daemon de Monitoreo y Vigilancia 24/7
Responsabilidades:
  - Salud del sistema (CPU, RAM, disco)
  - Disponibilidad web y SSL
  - Activacion automatica SSL cuando el dominio este listo
  - Reporte a AXIA CENTRAL en tiempo real
"""
import threading
import time
import datetime
import socket
import os
import ssl

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

from dotenv import dotenv_values

ENV = dotenv_values(os.path.join(os.path.abspath("."), ".env"))
DOMINIO = ENV.get("DOMINIO_WEB", "axyntrax-automation.com")
CHECK_INTERVAL = int(ENV.get("AXIA_SYSTEM_CHECK_INTERVAL_SEC", "300"))

_log_callbacks = []
_last_report = {}


def add_log_callback(fn):
    """Registra una funcion que recibe (nivel, mensaje) para mostrar en UI."""
    _log_callbacks.append(fn)


def _emit(level, msg):
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    for cb in _log_callbacks:
        try:
            cb(level, line)
        except Exception:
            pass
    _store_log(level, msg)


def _store_log(level, msg):
    try:
        from db_master.connection import get_db
        conn = get_db()
        c = conn.cursor()
        c.execute("INSERT INTO bot_audit (timestamp, action_type, result, hash_signature) VALUES (?,?,?,?)",
                  (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                   "AXIA_SYSTEM", level, msg[:120]))
        conn.commit()
        conn.close()
    except Exception:
        pass


# ── CHECKS ────────────────────────────────────────────────

def check_system_health():
    results = {}
    if HAS_PSUTIL:
        results["cpu"] = psutil.cpu_percent(interval=1)
        results["ram"] = psutil.virtual_memory().percent
        results["disk"] = psutil.disk_usage("/").percent

        if results["cpu"] > 85:
            _emit("WARN", f"CPU elevado: {results['cpu']}% — revisar procesos")
        if results["ram"] > 90:
            _emit("WARN", f"RAM critica: {results['ram']}%")
        if results["disk"] > 90:
            _emit("ALERTA", f"Disco casi lleno: {results['disk']}%")
        else:
            _emit("OK", f"Sistema saludable — CPU:{results['cpu']}% RAM:{results['ram']}% Disco:{results['disk']}%")
    else:
        _emit("OK", "Sistema operativo — psutil no instalado (monitoreo basico)")
    return results


def check_dns_propagation():
    """Verifica si el dominio ya resuelve a Netlify."""
    try:
        ip = socket.gethostbyname(DOMINIO)
        # IPs rango Netlify/AWS
        netlify_ranges = ("75.", "99.83.", "44.235.", "34.", "52.", "54.")
        is_netlify = any(ip.startswith(r) for r in netlify_ranges)
        if is_netlify:
            _emit("OK", f"DNS propagado — {DOMINIO} resuelve a {ip} (Netlify CDN)")
            return True, ip
        else:
            _emit("INFO", f"DNS aun propagando — {DOMINIO} -> {ip} (no Netlify)")
            return False, ip
    except socket.gaierror:
        _emit("INFO", f"DNS sin resolver aun para {DOMINIO}")
        return False, None


def check_ssl():
    """Verifica si el SSL esta activo en el dominio."""
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=DOMINIO) as s:
            s.settimeout(8)
            s.connect((DOMINIO, 443))
            cert = s.getpeercert()
            expiry = cert.get("notAfter", "N/A")
            _emit("OK", f"SSL/HTTPS ACTIVO en {DOMINIO} — expira: {expiry}")
            return True
    except ssl.SSLCertVerificationError:
        _emit("WARN", f"SSL sin certificado valido en {DOMINIO}")
        return False
    except Exception:
        _emit("INFO", f"HTTPS aun no disponible en {DOMINIO} — aguardando propagacion DNS")
        return False


def check_netlify_app():
    """Verifica que axyntrax-automation.netlify.app responda 200."""
    try:
        import urllib.request
        url = "https://axyntrax-automation.netlify.app"
        req = urllib.request.Request(url, headers={"User-Agent": "AXIA-Monitor/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            code = r.getcode()
            _emit("OK", f"Web Netlify respondiendo HTTP {code}")
            return code == 200
    except Exception as e:
        _emit("ALERTA", f"Web Netlify sin respuesta: {e}")
        return False


def check_security_headers():
    """Verifica que los headers de seguridad esten presentes."""
    try:
        import urllib.request
        url = "https://axyntrax-automation.netlify.app"
        req = urllib.request.Request(url, headers={"User-Agent": "AXIA-Monitor/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            headers = dict(r.headers)
            required = ["x-frame-options", "x-content-type-options", "x-xss-protection"]
            missing = [h for h in required if h not in {k.lower(): v for k, v in headers.items()}]
            if missing:
                _emit("WARN", f"Headers de seguridad faltantes: {missing}")
            else:
                _emit("OK", "Headers de seguridad correctos (XFO, XCTO, XSS)")
    except Exception:
        pass


# ── CICLO PRINCIPAL ───────────────────────────────────────

def _run_cycle():
    _emit("INIT", "AXIA SYSTEM iniciado — monitoreo 24/7 activo")
    ssl_active = False
    while True:
        try:
            _emit("CICLO", "--- Iniciando ciclo de vigilancia ---")
            check_system_health()
            check_netlify_app()
            dns_ok, ip = check_dns_propagation()
            if dns_ok and not ssl_active:
                ssl_active = check_ssl()
                if ssl_active:
                    _emit("EXITO", f"SSL ACTIVADO en {DOMINIO} — HTTPS listo para produccion")
            elif ssl_active:
                check_ssl()  # Verificar que siga activo
            check_security_headers()
            _emit("CICLO", f"Proximo ciclo en {CHECK_INTERVAL//60} min")
        except Exception as e:
            _emit("ERROR", f"Error en ciclo AXIA SYSTEM: {e}")
        time.sleep(CHECK_INTERVAL)


def start_axia_system():
    """Inicia el daemon de monitoreo en background thread."""
    enabled = ENV.get("AXIA_SYSTEM_ENABLED", "true").lower() == "true"
    if not enabled:
        return
    t = threading.Thread(target=_run_cycle, daemon=True, name="AXIA_SYSTEM")
    t.start()
    return t


def get_last_report():
    return _last_report


_instance = None


def get_axia_system():
    global _instance
    if _instance is None:
        _instance = True
    return {
        "start": start_axia_system,
        "add_callback": add_log_callback,
        "check_dns": check_dns_propagation,
        "check_ssl": check_ssl,
        "check_web": check_netlify_app,
        "check_health": check_system_health,
    }
