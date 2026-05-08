import hashlib, secrets, string, datetime, json, os

RUBROS = {
    "CLI": "Clínica", "LEG": "Legal", "VET": "Veterinaria",
    "CAR": "Car Wash", "DEN": "Dentista", "LOG": "Logística",
    "TRA": "Transportes", "RET": "Retail"
}

PLANES = {"BAS": "Básico", "PRO": "Profesional", "EMP": "Empresa"}

SECRET_SALT = os.environ.get("AXYNTRAX_SALT", "AX2026$CECILIA#JARVIS@SECURE")

def generar_key(rubro: str, plan: str, cliente_id: str) -> str:
    if rubro not in RUBROS or plan not in PLANES:
        raise ValueError("Rubro o plan inválido")
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    base = f"{rubro}-{plan}-{cliente_id}-{timestamp}-{SECRET_SALT}"
    hash_full = hashlib.sha256(base.encode()).hexdigest().upper()
    chars = string.ascii_uppercase + string.digits
    aleatorio = ''.join(secrets.choice(chars) for _ in range(12))
    raw = hash_full[:28] + aleatorio
    key_body = raw[:40]
    key = f"AX-{rubro}-{plan}-{key_body[:8]}-{key_body[8:16]}-{key_body[16:24]}-{key_body[24:32]}-{key_body[32:40]}"
    return key

def validar_key(key: str) -> dict:
    partes = key.split("-")
    if len(partes) < 3 or partes[0] != "AX":
        return {"valido": False, "error": "Formato inválido"}
    rubro = partes[1]
    plan  = partes[2]
    if rubro not in RUBROS:
        return {"valido": False, "error": "Rubro desconocido"}
    if plan not in PLANES:
        return {"valido": False, "error": "Plan desconocido"}
    return {"valido": True, "rubro": RUBROS[rubro], "plan": PLANES[plan], "key": key}

def guardar_key(key: str, cliente_id: str, email: str, rubro: str, plan: str):
    registro = {
        "key": key, "cliente_id": cliente_id, "email": email,
        "rubro": rubro, "plan": plan,
        "fecha_emision": datetime.datetime.utcnow().isoformat(),
        "activo": True
    }
    ruta = "keygen/keys_emitidas.json"
    if os.path.exists(ruta):
        with open(ruta, "r") as f:
            data = json.load(f)
    else:
        data = []
    existe = any(r["cliente_id"] == cliente_id and r["rubro"] == rubro and r["activo"] for r in data)
    if existe:
        return {"emitida": False, "mensaje": "⚠️ Ya existe una licencia activa para este cliente en este rubro"}
    data.append(registro)
    with open(ruta, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return {"emitida": True, "key": key, "mensaje": "✅ Licencia registrada correctamente"}

def revocar_key(key: str) -> dict:
    ruta = "keygen/keys_emitidas.json"
    if not os.path.exists(ruta):
        return {"ok": False, "error": "No hay registros"}
    with open(ruta, "r") as f:
        data = json.load(f)
    for r in data:
        if r["key"] == key:
            r["activo"] = False
            r["fecha_revocacion"] = datetime.datetime.utcnow().isoformat()
            with open(ruta, "w") as f2:
                json.dump(data, f2, indent=2, ensure_ascii=False)
            return {"ok": True, "mensaje": "🔒 Licencia revocada"}
    return {"ok": False, "error": "Key no encontrada"}

def listar_keys(solo_activas: bool = True) -> list:
    ruta = "keygen/keys_emitidas.json"
    if not os.path.exists(ruta):
        return []
    with open(ruta, "r") as f:
        data = json.load(f)
    return [r for r in data if r["activo"]] if solo_activas else data
