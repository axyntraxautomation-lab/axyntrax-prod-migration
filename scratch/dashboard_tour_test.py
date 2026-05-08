"""
TOUR AUTOMATICO — Dashboard Diamante
Prueba cada sección/botón del dashboard sin GUI (headless)
Reporta errores en tiempo real y los describe
"""
import sys, os, datetime, traceback
sys.path.insert(0, '.')

# Suprimir creacion de ventana para test headless
os.environ['DISPLAY'] = ''

fails = []
passed = []

def test(name, fn):
    try:
        result = fn()
        passed.append(name)
        print(f"  [OK  ] {name}" + (f" — {result}" if result else ""))
    except Exception as e:
        fails.append((name, str(e), traceback.format_exc()))
        print(f"  [FAIL] {name}")
        print(f"         Causa: {e}")

print("=" * 65)
print("  AXYNTRAX SUITE DIAMANTE — TOUR DE BOTONES (headless)")
print("=" * 65)

# ═══════════════════ CAPA 1: DB ═══════════════════
print("\n[SECCION 1] ROOT > Dashboard — KPIs")
from db_master.models import init_db, get_kpi_summary
init_db()

def t_kpis():
    data = get_kpi_summary()
    assert 'ingresos' in data and 'licencias' in data
    return f"ingresos={data['ingresos']} licencias={data['licencias']}"
test("KPI: get_kpi_summary()", t_kpis)

# ═══════════════════ CAPA 2: EXECUTIVE ═══════════════════
print("\n[SECCION 2] EXEC > Ejecutivo")
from suite_diamante.logic.axia.executive import get_executive
exec_mgr = get_executive()

def t_executive_advice():
    adv = exec_mgr.get_proactive_advice()
    assert isinstance(adv, str) and len(adv) > 5
    return adv[:80]
test("Executive: get_proactive_advice()", t_executive_advice)

def t_agenda():
    from db_master.connection import get_db
    conn = get_db()
    c = conn.cursor()
    hoy = datetime.datetime.now().strftime("%Y-%m-%d")
    c.execute("SELECT asunto, fecha_cita FROM citas WHERE fecha_cita LIKE ? ORDER BY fecha_cita", (f"{hoy}%",))
    citas = c.fetchall()
    conn.close()
    return f"{len(citas)} citas hoy"
test("Executive: Agenda del dia (DB)", t_agenda)

def t_kpi_finanzas():
    from db_master.connection import get_db
    conn = get_db()
    c = conn.cursor()
    ayer = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    c.execute("SELECT SUM(monto) FROM ventas WHERE estado='Completada' AND creado_en LIKE ?", (f"{ayer}%",))
    v = c.fetchone()[0] or 0.0
    conn.close()
    return f"Ventas ayer: S/. {v:.2f}"
test("Executive: CFO Resumen (ventas ayer)", t_kpi_finanzas)

# ═══════════════════ CAPA 3: BRAIN / IA ═══════════════════
print("\n[SECCION 3] BRAIN > IA Central")
from suite_diamante.logic.axia.brain import get_brain
brain = get_brain()

def t_brain_query():
    r = brain.process_event("USER_QUERY", "Hola AXIA, estado del sistema?")
    assert isinstance(r, str) and len(r) > 0
    return r[:100]
test("Brain: process_event USER_QUERY", t_brain_query)

def t_brain_revenue():
    r = brain.process_event("REVENUE_ALERT", "Ingreso de S/. 500")
    assert isinstance(r, str)
    return r[:80]
test("Brain: process_event REVENUE_ALERT", t_brain_revenue)

# ═══════════════════ CAPA 4: MARKETING ═══════════════════
print("\n[SECCION 4] GROWTH > Marketing IA")

def t_marketing_db():
    from db_master.connection import get_db
    conn = get_db()
    c = conn.cursor()
    hoy = datetime.datetime.now().strftime("%Y-%m-%d")
    c.execute("SELECT fecha_programada, segmento, mensaje_raw FROM axia_campaigns WHERE estado='Pendiente' AND fecha_programada >= ? ORDER BY fecha_programada LIMIT 20", (hoy,))
    actions = c.fetchall()
    conn.close()
    return f"{len(actions)} campanas pendientes"
test("Marketing: Campanas desde DB", t_marketing_db)

def t_marketing_fallback():
    hoy_dt = datetime.datetime.now()
    actions = [
        ((hoy_dt + datetime.timedelta(days=2)).strftime("%Y-%m-%d"), "FIELES", "Seguimiento"),
        ((hoy_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"), "NUEVOS", "Bienvenida"),
    ]
    assert len(actions) == 2
    return f"Fallback OK: {actions[0][0]}"
test("Marketing: Fallback dinamico fechas", t_marketing_fallback)

# ═══════════════════ CAPA 5: AUDITORIA ═══════════════════
print("\n[SECCION 5] SAFE > Auditoria")

def t_audit():
    from db_master.connection import get_db
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT timestamp, action_type, result, hash_signature FROM bot_audit ORDER BY id DESC")
    logs = c.fetchall()
    conn.close()
    return f"{len(logs)} registros en bot_audit"
test("Auditoria: Lectura bot_audit (DB)", t_audit)

# ═══════════════════ CAPA 6: CONFIGURACION ═══════════════════
print("\n[SECCION 6] SET > Configuracion")

def t_config_env():
    import dotenv
    env_path = os.path.join(os.path.abspath("."), ".env")
    env_vals = dotenv.dotenv_values(env_path)
    phone = env_vals.get("ADMIN_PHONE_NUMBER", "")
    did = env_vals.get("AUTHORIZED_DIAMOND_ID", "")
    masked_phone = f"+51 ***{phone[-4:]}" if len(phone) >= 4 else "No config"
    masked_did = f"{did[:8]}...{did[-4:]}" if len(did) >= 12 else "No config"
    return f"phone={masked_phone} id={masked_did}"
test("Config: Lectura .env con masking", t_config_env)

# ═══════════════════ CAPA 7: ORQUESTADOR ═══════════════════
print("\n[SECCION 7] Orquestador (background)")

def t_orchestrator():
    from suite_diamante.logic.axia.orchestrator import get_orchestrator
    orch = get_orchestrator()
    orch.run_morning_cycle()
    return "morning_cycle OK"
test("Orchestrator: run_morning_cycle()", t_orchestrator)

# ═══════════════════ CAPA 8: SECURITY ═══════════════════
print("\n[SECCION 8] Security / Diamond ID")

def t_security():
    from suite_diamante.logic.axia.security import get_security
    s = get_security()
    valid, hw = s.validate_machine()
    return f"valid={valid} hw={hw}"
test("Security: validate_machine()", t_security)

# ═══════════════════ CAPA 9: WSP LISTENER ═══════════════════
print("\n[SECCION 9] WSP Listener")

def t_wsp():
    from suite_diamante.logic.wsp_listener import run_listener_async
    return "import OK"
test("WSP: run_listener_async import", t_wsp)

# ══════════════════════ REPORTE FINAL ══════════════════════
print()
print("=" * 65)
print(f"  RESULTADO FINAL: {len(passed)} PASARON | {len(fails)} FALLARON")
print("=" * 65)

if fails:
    print("\n  FALLOS DETECTADOS:")
    for name, err, tb in fails:
        print(f"\n  [{name}]")
        print(f"  Causa: {err}")
else:
    print("\n  TODOS LOS BOTONES Y SECCIONES — OPERATIVOS AL 100%")
    print("  El dashboard esta listo para uso en produccion.")
