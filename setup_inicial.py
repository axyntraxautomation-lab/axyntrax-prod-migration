"""
AXYNTRAX -- Setup Inicial Completo
Resuelve de una vez:
  1. Solicita WSP_ACCESS_TOKEN y WSP_PHONE_NUMBER_ID -> los guarda en .env
  2. Crea el usuario master en la DB si no existe (o resetea su password)
  3. Verifica que el .env tenga todas las vars criticas

Uso: python setup_inicial.py
"""
import os
import sys
import hashlib
import secrets
from pathlib import Path

# Forzar UTF-8 en terminal Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv, set_key

BASE_DIR = Path(__file__).parent
ENV_PATH = BASE_DIR / ".env"


def banner():
    print("""
  +==========================================+
  |     AXYNTRAX -- SETUP INICIAL v1.0      |
  |   Resolviendo pendientes de produccion  |
  +==========================================+
""")


def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    val = input(f"  > {prompt}{suffix}: ").strip()
    return val or default


def write_env(key: str, value: str):
    set_key(str(ENV_PATH), key, value)
    print(f"  [OK] {key} guardado en .env")


# =============================================================================
# PASO 1 - Credenciales Meta WhatsApp
# =============================================================================
def setup_meta_credentials():
    print("\n--- PASO 1: Credenciales Meta WhatsApp ---")
    print("  -> Ve a business.facebook.com -> Tu App -> WhatsApp -> API Setup")
    print("  -> Copia el 'Temporary access token' y el 'Phone number ID'\n")

    load_dotenv(ENV_PATH)
    current_token = os.getenv("WSP_ACCESS_TOKEN", "")
    current_phone = os.getenv("WSP_PHONE_NUMBER_ID", "")

    if current_token and current_phone:
        print("  [OK] Ya tienes credenciales configuradas:")
        print(f"    Token   : {current_token[:20]}...")
        print(f"    Phone ID: {current_phone}")
        if ask("Deseas reemplazarlas? (s/N)", "n").lower() != "s":
            print("  [OK] Credenciales Meta sin cambios.")
            return

    token    = ask("WSP_ACCESS_TOKEN  (pega tu token de Meta API)")
    phone_id = ask("WSP_PHONE_NUMBER_ID (ej: 123456789012345)")

    if not token or not phone_id:
        print("  [SKIP] Se requieren ambos valores. Saltando...")
        return

    write_env("WSP_ACCESS_TOKEN", token)
    write_env("WSP_PHONE_NUMBER_ID", phone_id)
    print("  [OK] Credenciales Meta guardadas correctamente.")


# =============================================================================
# PASO 2 - Usuario Master en DB
# =============================================================================
def setup_master_user():
    print("\n--- PASO 2: Usuario Master (Login Dashboard) ---")

    try:
        sys.path.insert(0, str(BASE_DIR))
        from db_master.models import init_db
        from db_master.connection import get_db
        init_db()
    except Exception as e:
        print(f"  [ERROR] No se pudo inicializar la DB: {e}")
        return

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM usuarios")
    count = c.fetchone()[0]

    if count > 0:
        c.execute("SELECT nombre, email, rol FROM usuarios WHERE rol='master' LIMIT 1")
        row = c.fetchone()
        if row:
            print("  [OK] Usuario master ya existe:")
            print(f"    Nombre : {row['nombre']}")
            print(f"    Email  : {row['email']}")
            print(f"    Rol    : {row['rol']}")
        conn.close()
        if ask("Deseas crear/resetear un usuario? (s/N)", "n").lower() != "s":
            return
        conn = get_db()
        c = conn.cursor()
    else:
        print("  [!] No hay usuarios registrados. Creando usuario master...\n")

    nombre   = ask("Nombre completo", "Miguel Montero")
    email    = ask("Email", "axyntraxautomation@gmail.com").lower()
    password = ask("Contrasena (min 6 caracteres)")

    if len(password) < 6:
        print("  [ERROR] Contrasena muy corta. Usa minimo 6 caracteres.")
        conn.close()
        return

    salt    = secrets.token_hex(16)
    pw_hash = f"sha256:{salt}:{hashlib.sha256(f'{salt}{password}'.encode()).hexdigest()}"

    c.execute("SELECT id FROM usuarios WHERE email = ?", (email,))
    if c.fetchone():
        print("  [!] Email ya registrado. Actualizando contrasena...")
        c.execute("UPDATE usuarios SET password_hash=?, activo=1 WHERE email=?", (pw_hash, email))
    else:
        rol = "master" if count == 0 else "operador"
        c.execute(
            "INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?,?,?,?,1)",
            (nombre, email, pw_hash, rol)
        )
        print(f"  [OK] Usuario '{nombre}' creado con rol '{rol}'.")

    conn.commit()
    conn.close()
    print(f"\n  [OK] Login listo:")
    print(f"       Email     : {email}")
    print(f"       Contrasena: la que acabas de ingresar")


# =============================================================================
# PASO 3 - Verificacion final del .env
# =============================================================================
def verify_env():
    print("\n--- PASO 3: Verificacion de Variables Criticas ---")
    load_dotenv(ENV_PATH, override=True)

    checks = {
        "WSP_ACCESS_TOKEN":    os.getenv("WSP_ACCESS_TOKEN"),
        "WSP_PHONE_NUMBER_ID": os.getenv("WSP_PHONE_NUMBER_ID"),
        "WSP_APP_SECRET":      os.getenv("WSP_APP_SECRET"),
        "WH_VERIFY_TOKEN":     os.getenv("WH_VERIFY_TOKEN"),
        "GEMINI_API_KEY":      os.getenv("GEMINI_API_KEY"),
        "ADMIN_PHONE_NUMBER":  os.getenv("ADMIN_PHONE_NUMBER"),
        "EMAIL_CORPORATIVO":   os.getenv("EMAIL_CORPORATIVO"),
    }

    all_ok = True
    for key, val in checks.items():
        if val:
            masked = val[:8] + "..." if len(val) > 8 else val
            print(f"  [OK]    {key:<25} = {masked}")
        else:
            print(f"  [VACIO] {key:<25} = (sin configurar)")
            all_ok = False

    if all_ok:
        print("\n  [OK] Todas las variables criticas estan configuradas.")
    else:
        print("\n  [!] Algunos valores estan vacios. Completalos en el .env manualmente.")


# =============================================================================
if __name__ == "__main__":
    banner()
    setup_meta_credentials()
    setup_master_user()
    verify_env()

    print("""
  +==========================================+
  |           SETUP COMPLETADO              |
  +==========================================+

  Proximos pasos:
  1. Inicia el backend   -> python axia_api.py
  2. Inicia el webhook   -> python axia_webhook.py
  3. Inicia el frontend  -> cd axia-core && npm run dev
  4. Abre el dashboard   -> http://localhost:5173
  5. Login con el email y contrasena configurados.
""")
