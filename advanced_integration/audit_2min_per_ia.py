#!/usr/bin/env python3
"""
audit_2min_per_ia.py - Auditoría 2min/IA: Cecilia, Atlas, AXIA, Jarvis, Matrix, WhatsApp
"""
import argparse, json, os, time, uuid
from datetime import datetime, timezone
from pathlib import Path
from time import monotonic
from typing import Any, Dict, List, Optional

try:
    import requests
except ImportError:
    raise SystemExit("Falta requests. Ejecuta: pip install requests")

MAX_TURNS, MAX_SECONDS, HTTP_TIMEOUT = 8, 120, 8
SAMPLE_RESP_LEN, BACKOFF_BASE, MAX_RETRIES, IA_COOLDOWN = 1024, 0.5, 2, 0.6

def now_iso(): return datetime.now(timezone.utc).isoformat()
def sample_text(s): return str(s)[:SAMPLE_RESP_LEN] if s else ""
def safe_json(resp):
    try: return resp.json()
    except: return None
def redact(text):
    for key in ("WHATSAPP_TOKEN",):
        val = os.getenv(key, "")
        if val and val in text: text = text.replace(val, "[REDACTED]")
    return text
def do_request(session, method, url, retries=MAX_RETRIES, **kwargs):
    last_error, latency = "", 0
    for attempt in range(retries + 1):
        start = monotonic()
        try:
            r = session.request(method, url, timeout=HTTP_TIMEOUT, **kwargs)
            latency = int((monotonic() - start) * 1000)
            return {"ok": True, "status_code": r.status_code, "latency_ms": latency,
                    "response_sample": sample_text(r.text), "response_json": safe_json(r)}
        except Exception as e:
            latency = int((monotonic() - start) * 1000)
            last_error = str(e)
        if attempt < retries: time.sleep(BACKOFF_BASE * (2 ** attempt))
    return {"ok": False, "error": redact(last_error), "latency_ms": latency,
            "response_sample": "", "response_json": None}
def outcome(res):
    if not res.get("ok"): return "error"
    return "ok" if str(res.get("status_code","")).startswith("2") else "error"
def build_entry(name, res, **extra):
    e = {"test_name": name, "outcome": outcome(res), "latency_ms": res.get("latency_ms"),
         "details": res.get("response_json") or res.get("error") or res.get("response_sample")}
    e.update(extra); return e
def write_report(out_dir, ia_name, report):
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    fname = out_dir / f"report_{ia_name.lower()}_{ts}.json"
    fname.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(fname)
def can_continue(start, turns): return turns < MAX_TURNS and (monotonic()-start) < MAX_SECONDS
def compute_status(tests):
    if not tests: return "UNKNOWN"
    for t in tests:
        d = str(t.get("details",""))
        if any(c in d for c in ("401","403","500","502","503")): return "CRITICAL"
    return "WARN" if any(t.get("outcome")=="error" for t in tests) else "OK"
def compute_confidence(tests):
    if not tests: return 0
    return max(0, 100 - sum(1 for t in tests if t.get("outcome")=="error") * 15)
def suggested_steps(tests, ia):
    steps = []
    for t in tests:
        d = str(t.get("details",""))
        if "401" in d or "403" in d: steps.append(f"[{ia}] Rotar token. Verificar variable de entorno.")
        if "ConnectionError" in d or "Timeout" in d: steps.append(f"[{ia}] Verificar que el servicio esté activo y el puerto sea correcto.")
        if any(c in d for c in ("500","502","503")): steps.append(f"[{ia}] Error interno — revisar logs del worker.")
    if not steps and any(t.get("outcome")=="error" for t in tests):
        steps.append(f"[{ia}] Revisar logs del servicio.")
    return list(dict.fromkeys(steps))
def test_cecilia(session, url, report):
    prompts = [
        "Hola Cecilia, dime en 1 línea cómo ayudarías a un cliente que pide paquete PYME.",
        "Qué planes tienen y cuál recomiendas para una PyME de 5 empleados?",
        "Consulta cliente TEST-0001, tienes ficha? (prueba integración Atlas).",
        "Resume esta conversación en una línea.",
        "Texto largo: " + ("A"*300) + " lo recibiste completo?",
        "Payload inesperado: cómo manejas un body no estándar?",
    ]
    start, turns, tests = monotonic(), 0, []
    for i, p in enumerate(prompts, 1):
        if not can_continue(start, turns): break
        res = do_request(session, "POST", url, json={"text": p})
        turns += 1; tests.append(build_entry(f"turn_{i}", res, prompt=sample_text(p)))
    report.update({"tests_executed": tests, "turns_count": turns}); return report
def test_atlas(session, url, report):
    payloads = [
        {"action":"get_client","client_id":"TEST-0001"},
        {"action":"suggested_reply","intent":"interes_paquete_pyme","context":{}},
        {"action":"compare_entity","entity":"email","value":"test@example.com"},
    ]
    start, turns, tests = monotonic(), 0, []
    for i, p in enumerate(payloads, 1):
        if not can_continue(start, turns): break
        res = do_request(session, "GET", url, params=p)
        turns += 1; tests.append(build_entry(f"atlas_test_{i}", res, payload=p))
    report.update({"tests_executed": tests, "turns_count": turns}); return report
def test_axia(session, url, report, c_reply=None, atlas_ctx=None):
    start, turns, tests = monotonic(), 0, []
    payload = {"cecilia_reply": c_reply or "prueba reply",
               "atlas_context": atlas_ctx or {"client_id":"TEST-0001"}, "source":"automated_audit"}
    res = do_request(session, "POST", url, json=payload)
    turns += 1; tests.append(build_entry("sync_check", res, payload=payload))
    if can_continue(start, turns):
        health = url.rstrip("/") + "/health"
        res2 = do_request(session, "GET", health)
        turns += 1; tests.append(build_entry("health_check", res2, url=health))
    report.update({"tests_executed": tests, "turns_count": turns}); return report
def test_jarvis(session, url, report):
    start, turns, tests = monotonic(), 0, []
    event = {"type":"health.check","source":"automated_audit",
             "timestamp":now_iso(),"payload":{"ref":str(uuid.uuid4())}}
    res = do_request(session, "POST", url, json=event)
    turns += 1; tests.append(build_entry("log_insert", res, payload={"type":"health.check"}))
    if can_continue(start, turns):
        q = url.replace("notificar", "inbox") + "?limit=5"
        res2 = do_request(session, "GET", q)
        turns += 1; tests.append(build_entry("query_recent_events", res2, url=q))
    report.update({"tests_executed": tests, "turns_count": turns}); return report
def test_matrix(session, url, report):
    prompts = [
        "Hola Matrix, confirma versión y sincronía con Cecilia y Atlas.",
        "Dame en 1 frase cualquier inconsistencia detectada.",
        "Simula remediación: si hay inconsistencia devuelve suggested_action.",
    ]
    token_admin = os.getenv("X_AUTH_TOKEN", "MOCK_TOKEN")
    start, turns, tests = monotonic(), 0, []
    for i, p in enumerate(prompts, 1):
        if not can_continue(start, turns): break
        res = do_request(session, "POST", url, json={"text": p}, headers={"X-Auth-Token": token_admin})
        turns += 1; tests.append(build_entry(f"matrix_turn_{i}", res, prompt=sample_text(p)))
    report.update({"tests_executed": tests, "turns_count": turns}); return report
def test_whatsapp(session, phone_id, report, send_test=False, dest_phone=None, graph_version="v17.0"):
    token = os.getenv("WHATSAPP_TOKEN","")
    token_present = bool(token)
    turns, tests = 0, []
    if phone_id and token_present:
        url = f"https://graph.facebook.com/{graph_version}/{phone_id}"
        res = do_request(session, "GET", url, params={"fields":"id","access_token":token})
        turns += 1; tests.append(build_entry("wsp_token_validate", res, url=url))
    else:
        tests.append({"test_name":"wsp_token_validate","outcome":"skipped",
                      "details":"Sin WHATSAPP_TOKEN" if not token_present else "Sin WHATSAPP_PHONE_ID"})
    if send_test:
        if not token_present or not phone_id or not dest_phone:
            tests.append({"test_name":"wsp_send_test","outcome":"error",
                          "details":"Faltan WHATSAPP_TOKEN, --wsp-phone o --wsp-dest."})
        else:
            send_url = f"https://graph.facebook.com/{graph_version}/{phone_id}/messages"
            payload = {"messaging_product":"whatsapp","to":dest_phone,"type":"text",
                       "text":{"body":"TEST: Mensaje desde auditoría automática (no responder)."}}
            res2 = do_request(session,"POST",send_url,json=payload,
                              headers={"Authorization":f"Bearer {token}"})
            turns += 1; tests.append(build_entry("wsp_send_test", res2, url=send_url))
    report.update({"tests_executed":tests,"turns_count":turns,"token_info":{"token_present":token_present}})
    return report
def _try_cecilia(session, url):
    if not url: return None
    try:
        r = do_request(session,"POST",url,json={"text":"ping"},retries=0)
        return r.get("response_json") if r.get("ok") else None
    except: return None
def run_audit(args):
    out_dir = Path(args.output)
    session = requests.Session()
    session.headers.update({"User-Agent":"Axyntrax-Audit/1.0"})
    ia_map = {"CECILIA":args.cecilia,"ATLAS":args.atlas,"AXIA":args.axia,
              "JARVIS":args.jarvis,"MATRIX":args.matrix}
    runners = {
        "CECILIA": lambda s,u,r: test_cecilia(s,u,r),
        "ATLAS":   lambda s,u,r: test_atlas(s,u,r),
        "AXIA":    lambda s,u,r: test_axia(s,u,r,_try_cecilia(s,ia_map.get("CECILIA")),{"client_id":"TEST-0001"}),
        "JARVIS":  lambda s,u,r: test_jarvis(s,u,r),
        "MATRIX":  lambda s,u,r: test_matrix(s,u,r),
    }
    summary_rows = []
    for ia, endpoint in ia_map.items():
        print(f"\n── {ia} {'('+endpoint+')' if endpoint else '(sin endpoint)'} ──")
        rep = {"ia_name":ia,"start_timestamp":now_iso(),"status":"UNKNOWN",
               "end_timestamp":None,"duration_seconds":None,"turns_count":0,
               "tests_executed":[],"unresolved_issues":[],"suggested_next_steps":[],"confidence_score":0}
        if not endpoint:
            rep.update({"status":"SKIPPED","end_timestamp":now_iso(),"duration_seconds":0,
                        "unresolved_issues":[{"issue_type":"missing_endpoint","severity":"high",
                        "description":"Sin endpoint.","manual_action_required":"Configurar URL."}],
                        "suggested_next_steps":["Configurar URL del endpoint."]})
            path = write_report(out_dir, ia, rep)
            summary_rows.append({"ia":ia,"status":"SKIPPED","report_path":path}); continue
        t0 = monotonic()
        try:
            rep = runners[ia](session, endpoint, rep)
            tests = rep.get("tests_executed",[])
            rep["status"] = compute_status(tests)
            rep["confidence_score"] = compute_confidence(tests)
            rep["suggested_next_steps"] = suggested_steps(tests, ia)
        except Exception as exc:
            import traceback; traceback.print_exc()
            rep["status"] = "CRITICAL"
            rep["unresolved_issues"].append({"issue_type":"exception","description":str(exc),"severity":"high"})
        finally:
            rep["end_timestamp"] = now_iso()
            rep["duration_seconds"] = round(monotonic()-t0, 2)
        errs = sum(1 for t in rep.get("tests_executed",[]) if t.get("outcome")=="error")
        print(f"   Estado: {rep['status']} | Turnos: {rep['turns_count']} | Errores: {errs}")
        path = write_report(out_dir, ia, rep)
        summary_rows.append({"ia":ia,"status":rep["status"],"report_path":path})
        time.sleep(IA_COOLDOWN)
    print(f"\n── WHATSAPP ──")
    wrep = {"ia_name":"WHATSAPP","start_timestamp":now_iso(),"status":"UNKNOWN",
            "tests_executed":[],"token_info":{},"confidence_score":0}
    wt0 = monotonic()
    try:
        wrep = test_whatsapp(session,args.wsp_phone,wrep,args.wsp_send,args.wsp_dest,args.wsp_graph)
        tests = wrep.get("tests_executed",[])
        wrep["status"] = compute_status(tests)
        wrep["confidence_score"] = compute_confidence(tests)
        wrep["suggested_next_steps"] = suggested_steps(tests,"WHATSAPP")
    except Exception as exc:
        wrep["status"] = "CRITICAL"
        wrep["unresolved_issues"] = [{"issue_type":"exception","description":str(exc),"severity":"high"}]
    finally:
        wrep["end_timestamp"] = now_iso()
        wrep["duration_seconds"] = round(monotonic()-wt0,2)
    print(f"   Estado: {wrep['status']}")
    wp = write_report(out_dir,"WHATSAPP",wrep)
    summary_rows.append({"ia":"WHATSAPP","status":wrep["status"],"report_path":wp})
    summary = {"generated_at":now_iso(),"results":{r["ia"]:r["status"] for r in summary_rows},"reports":summary_rows}
    sp = out_dir / f"summary_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    sp.write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print("\n" + "="*50)
    for r in summary_rows: print(f"  {r['ia']:10s}  {r['status']:8s}  {r['report_path']}")
    print(f"\nResumen: {sp}\n" + "="*50)
    return str(sp)
def parse_args():
    p = argparse.ArgumentParser(description="Auditoría 2min/IA — Axyntrax")
    p.add_argument("--cecilia", default=os.getenv("CECILIA_URL"))
    p.add_argument("--atlas",   default=os.getenv("ATLAS_URL"))
    p.add_argument("--axia",    default=os.getenv("AXIA_SUPERVISOR_URL"))
    p.add_argument("--jarvis",  default=os.getenv("JARVIS_AUDIT_URL"))
    p.add_argument("--matrix",  default=os.getenv("MATRIX_URL"))
    p.add_argument("--output",  default=os.getenv("AUDIT_OUTPUT","./audit_reports"))
    p.add_argument("--wsp-phone",  default=os.getenv("WHATSAPP_PHONE_ID"))
    p.add_argument("--wsp-send",   action="store_true")
    p.add_argument("--wsp-dest",   default=None)
    p.add_argument("--wsp-graph",  default="v17.0")
    return p.parse_args()
if __name__ == "__main__":
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    args = parse_args()
    print(f"Iniciando auditoría — salida: {args.output}")
    run_audit(args)
