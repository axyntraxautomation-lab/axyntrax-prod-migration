import json
import os
from db_master.connection import BASE_DIR

class AXIAMemory:
    """
    Gestor de Memoria Contextual AXIA.
    Almacena preferencias y datos no estructurados del dueño y clientes.
    """
    def __init__(self):
        self.memory_path = os.path.join(BASE_DIR, "data", "axia_memory.json")
        self._ensure_memory()

    def _ensure_memory(self):
        if not os.path.exists(self.memory_path):
            with open(self.memory_path, 'w') as f:
                json.dump({"preferences": {}, "contexts": {}}, f)

    def save_preference(self, key, value):
        with open(self.memory_path, 'r+') as f:
            data = json.load(f)
            data["preferences"][key] = value
            f.seek(0)
            json.dump(data, f)
            f.truncate()

def get_memory():
    return AXIAMemory()
