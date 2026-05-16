from keygen_engine import generar_key, guardar_key, revocar_key, listar_keys, validar_key

def solicitud_nueva_licencia(cliente_id: str, email: str, rubro: str, plan: str) -> str:
    try:
        key = generar_key(rubro, plan, cliente_id)
        resultado = guardar_key(key, cliente_id, email, rubro, plan)
        if resultado["emitida"]:
            return (
                f"🔑 *Licencia AXYNTRAX generada*\n\n"
                f"Cliente: {email}\n"
                f"Rubro: {rubro} | Plan: {plan}\n"
                f"Key: `{key}`\n\n"
                f"Guárdela en un lugar seguro.\n"
                f"Ingrésela al iniciar el programa para activar."
            )
        else:
            return resultado["mensaje"]
    except ValueError as e:
        return f"❌ Error: {str(e)}"

def consultar_estado_licencia(key: str) -> str:
    keys = listar_keys(solo_activas=True)
    registro = next((r for r in keys if r["key"] == key), None)
    if not registro:
        return "❌ Licencia no encontrada o inactiva. Contacte soporte AXYNTRAX."
    return (
        f"✅ Licencia válida\n"
        f"Cliente: {registro['email']}\n"
        f"Rubro: {registro['rubro']} | Plan: {registro['plan']}\n"
        f"Emitida: {registro['fecha_emision'][:10]}"
    )
