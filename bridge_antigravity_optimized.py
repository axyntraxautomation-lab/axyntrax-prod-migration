import os, json, hashlib, time, requests
from pathlib import Path

# --- Configuración ---
PROJECT_ROOT = Path(__file__).parent
STATE_FILE = PROJECT_ROOT / "project_state_light.json"
CACHE_FILE = PROJECT_ROOT / "instruction_cache.json"
BATCH_FILE = PROJECT_ROOT / "pending_batch.json"
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY")

WATCH_FILES = [
    "api/whatsapp.py", "api/messenger.py", "api/cecilia_ia.py",
    "vercel.json", "requirements.txt", "public/index.html"
]

# --- Utilidades ligeras ---
def file_hash(path):
    try:
        return hashlib.sha256(Path(path).read_bytes()).hexdigest()
    except:
        return "MISSING"

def minimal_state():
    prev = {}
    if STATE_FILE.exists():
        prev = json.loads(STATE_FILE.read_text())
    current = {"ts": time.time(), "files": {}, "env": {}}
    changed = False
    for f in WATCH_FILES:
        h = file_hash(PROJECT_ROOT / f)
        current["files"][f] = h
        if f not in prev.get("files", {}) or prev["files"][f] != h:
            current["files"][f + "_mod"] = True
            changed = True
    current["env"]["wsp_token"] = bool(os.getenv("WSP_ACCESS_TOKEN"))
    current["env"]["deepseek_key"] = bool(os.getenv("DEEPSEEK_API_KEY"))
    STATE_FILE.write_text(json.dumps(current, indent=2))
    return current, changed

def accumulate_event(event):
    batch = []
    if BATCH_FILE.exists():
        batch = json.loads(BATCH_FILE.read_text())
    batch.append(event)
    BATCH_FILE.write_text(json.dumps(batch))
    return len(batch)

# --- Comunicación estricta con DeepSeek ---
def call_deepseek_command(question):
    prompt = f"""
Eres un asistente técnico. Responde ÚNICAMENTE con un JSON en este formato exacto, sin texto fuera del JSON:

{{"action":"tipo","cmd":"comando PowerShell","file":"ruta","msg":"breve"}}

Tipos de action: cmd (ejecutar comando), fix (reescribir archivo), info (necesitas datos), wait (esperar).
Pregunta: {question}
"""
    headers = {"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 80,
        "temperature": 0.0
    }
    try:
        res = requests.post("https://api.deepseek.com/v1/chat/completions", headers=headers, json=data)
        content = res.json()["choices"][0]["message"]["content"].strip()
        if content.startswith("```json"): content = content[7:]
        if content.endswith("```"): content = content[:-3]
        return json.loads(content)
    except Exception as e:
        return {"action": "wait", "msg": f"Error DeepSeek: {str(e)}"}

# --- Caché agresivo ---
def get_cached(hash_key):
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text())
        return cache.get(hash_key)
    return None

def set_cache(hash_key, value):
    cache = {}
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text())
    cache[hash_key] = value
    CACHE_FILE.write_text(json.dumps(cache))

# --- Ejecución inmediata ---
if __name__ == "__main__":
    state, changed = minimal_state()
    batch = []
    if BATCH_FILE.exists():
        batch = json.loads(BATCH_FILE.read_text())

    if not changed and not batch:
        print("Nada nuevo.")
        exit(0)

    question = f"Estado: {json.dumps(state)}. Eventos: {batch[-2:] if batch else 'ninguno'}. ¿Acción?"
    action = call_deepseek_command(question)

    if action.get("action") == "cmd":
        cmd = action.get("cmd")
        print(f"Ejecutando: {cmd}")
        os.system(cmd)
    elif action.get("action") == "fix":
        file_path = PROJECT_ROOT / action.get("file", "")
        content = action.get("content", "")
        file_path.write_text(content, encoding="utf-8")
        print(f"Archivo corregido: {file_path}")
    elif action.get("action") == "info":
        print(f"DeepSeek pregunta: {action.get('msg')}")
    else:
        print(f"Estado: {action.get('msg', 'Esperando')}")

    BATCH_FILE.write_text("[]")
    set_cache(hashlib.sha256(json.dumps(state).encode()).hexdigest(), action)
    print("OK")
