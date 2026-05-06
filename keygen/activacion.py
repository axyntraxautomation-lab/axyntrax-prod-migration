import json, os, sys
from keygen_engine import validar_key, listar_keys

def activar_sistema(key_ingresada: str) -> dict:
    resultado = validar_key(key_ingresada)
    if not resultado["valido"]:
        return {"acceso": False, "mensaje": resultado["error"]}
    keys_activas = listar_keys(solo_activas=True)
    registrada = any(r["key"] == key_ingresada for r in keys_activas)
    if not registrada:
        return {"acceso": False, "mensaje": "❌ Licencia no registrada o revocada. Contacte a AXYNTRAX."}
    return {
        "acceso": True,
        "rubro": resultado["rubro"],
        "plan": resultado["plan"],
        "mensaje": f"✅ Bienvenido. Sistema {resultado['rubro']} — Plan {resultado['plan']} activado."
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python activacion.py <KEY>")
        sys.exit(1)
    res = activar_sistema(sys.argv[1])
    print(res["mensaje"])
    sys.exit(0 if res["acceso"] else 1)
