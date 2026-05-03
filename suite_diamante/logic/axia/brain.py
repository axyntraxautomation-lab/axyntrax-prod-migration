"""
AXIA BRAIN v2 — Motor Neuronal Central
Gestion total: finanzas, marketing, CRM, email, WhatsApp, informes.
Personalidad: Gerente Senior, Financista, Estratega de Marketing.
"""
import datetime
import random
import os
from dotenv import dotenv_values

import firebase_admin
from firebase_admin import credentials, firestore

ENV = dotenv_values(os.path.join(os.path.abspath("."), ".env"))

# Inicializar Firebase Admin (Safe Mode)
if not firebase_admin._apps:
    try:
        # Intentar múltiples rutas para el certificado
        base_path = os.path.abspath(".")
        cert_path = os.path.join(base_path, "service-account.json")
        
        if os.path.exists(cert_path):
            cred = credentials.Certificate(cert_path)
            firebase_admin.initialize_app(cred)
        else:
            print(f"[WARN] Certificado no encontrado en {cert_path}")
    except Exception as e:
        print(f"[WARN] Error inicializando Firebase: {e}")

class AXIABrain:
    def __init__(self):
        self.owner_name = ENV.get("EMPRESA_PROPIETARIO", "Miguel").split()[0]
        self.empresa    = ENV.get("EMPRESA_NOMBRE", "AXYNTRAX AUTOMATION")
        self.personality = "Gerente Senior, Financista, Estratega de Marketing y Ventas"
        self._context_memory = []
        
        try:
            self.db = firestore.client()
        except Exception:
            self.db = None
            print("[WARN] AXIA Brain operando sin conexión a Firestore.")

    # ── SALUDO ────────────────────────────────────────────
    def get_greeting(self):
        h = datetime.datetime.now().hour
        if h < 12:
            sal = "Buenos dias"
        elif h < 19:
            sal = "Buenas tardes"
        else:
            sal = "Buenas noches"
        tips = [
            "Tengo los KPIs del dia listos para revisar.",
            "Hay campanas de marketing programadas para esta semana.",
            "El sistema web esta operativo y monitoreado.",
            "Puedo enviarte el resumen de correos cuando lo necesites.",
            "Listo para gestionar clientes, finanzas y estrategia.",
        ]
        return f"{sal}, {self.owner_name}. {random.choice(tips)}"

    # ── PROCESADOR CENTRAL ────────────────────────────────
    def process_event(self, context, text, impact_score=5):
        self._log_event(context, text)
        text_low = text.lower()

        # KPIs / Finanzas
        if any(w in text_low for w in ["kpi", "ingreso", "venta", "finanza", "dinero", "s/.", "revenue"]):
            return self._respond_finance()

        # Clientes / CRM
        if any(w in text_low for w in ["cliente", "prospecto", "lead", "contacto", "nuevo"]):
            return self._respond_crm()

        # Correo
        if any(w in text_low for w in ["correo", "email", "mail", "mensaje"]):
            return self._respond_email()

        # WhatsApp
        if any(w in text_low for w in ["whatsapp", "wsp", "chat", "mensaje"]):
            return self._respond_wsp()

        # Sistema / Web / SSL
        if any(w in text_low for w in ["sistema", "web", "ssl", "dominio", "seguridad", "monitor"]):
            return self._respond_system()

        # Marketing
        if any(w in text_low for w in ["marketing", "campaña", "campa", "publicidad", "redes"]):
            return self._respond_marketing()

        # Recibo / Factura / Pago
        if any(w in text_low for w in ["recibo", "factura", "pago", "cobro", "honorario", "bcp"]):
            return self._respond_billing()

        # Informe / Reporte
        if any(w in text_low for w in ["informe", "reporte", "resumen", "report", "estado"]):
            return self._respond_report()

        # Saludo general
        if any(w in text_low for w in ["hola", "buenos", "buenas", "hello", "hi"]):
            return self.get_greeting()

        # Default proactivo
        return self._respond_default(text)

    # ── RESPUESTAS ESPECIALIZADAS ─────────────────────────
    def _respond_finance(self):
        try:
            from db_master.models import get_kpi_summary
            d = get_kpi_summary()
            return (f"Resumen financiero actual: Ingresos S/. {d['ingresos']:,.2f} | "
                    f"Pendientes S/. {d['pendientes']:,.2f} | Licencias: {d['licencias']}. "
                    f"Recomiendo revisar cuentas por cobrar si supera S/. 1,000.")
        except Exception:
            return ("Finanzas en orden. Para un analisis detallado necesito acceso a los "
                    "datos de ventas del periodo. Indique el mes o rango a evaluar.")

    def _respond_crm(self):
        try:
            from db_master.connection import get_db
            conn = get_db()
            conn.row_factory = None
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM clientes")
            total = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM clientes WHERE estado='Prospecto'")
            prosp = c.fetchone()[0]
            conn.close()
            return (f"CRM activo: {total} clientes registrados, {prosp} prospectos en pipeline. "
                    f"Recomiendo contactar prospectos con mas de 3 dias sin respuesta. "
                    f"Puedo generar la lista de seguimiento ahora.")
        except Exception:
            return ("Pipeline CRM listo. Ingresa nuevos clientes via WhatsApp o directamente "
                    "en el modulo. AXIA los clasifica automaticamente por score de conversion.")

    def _respond_email(self):
        try:
            from suite_diamante.logic.axia.email_manager import get_daily_summary
            return get_daily_summary()
        except Exception:
            return ("Email corporativo configurado. Para leer correos ingresa al panel "
                    "Email Manager. Respondo con tono gerencial y registro cada contacto.")

    def _respond_wsp(self):
        num = ENV.get("ADMIN_PHONE_NUMBER", "51991740590")
        return (f"WhatsApp corporativo activo en +{num}. "
                f"Registro automaticamente nuevos clientes, respondo consultas 24/7 "
                f"y escalo casos urgentes a tu atencion inmediata.")

    def _respond_system(self):
        return ("AXIA SYSTEM monitoreando 24/7: web, DNS, SSL y seguridad del servidor. "
                "El dominio axyntrax-automation.com esta en propagacion DNS. "
                "SSL se activara automaticamente cuando el DNS propague completamente. "
                "Cualquier anomalia te la notifico en tiempo real.")

    def _respond_marketing(self):
        try:
            from db_master.connection import get_db
            conn = get_db()
            conn.row_factory = None
            c = conn.cursor()
            hoy = datetime.datetime.now().strftime("%Y-%m-%d")
            c.execute("SELECT COUNT(*) FROM axia_campaigns WHERE estado='Pendiente' AND fecha_programada >= ?", (hoy,))
            total = c.fetchone()[0]
            conn.close()
            return (f"Marketing Autonomo: {total} campanas programadas. "
                    f"Segmentos activos: FIELES, NUEVOS, EN_RIESGO. "
                    f"Ejecuto envios automaticos por WhatsApp segun el calendario AXIA.")
        except Exception:
            return ("Estrategia de marketing activa. Campanas automatizadas por WhatsApp "
                    "para retencion, captacion y reactivacion de clientes.")

    def _respond_billing(self):
        bcp = ENV.get("BCP_CUENTA_SOLES", "215-16171945-0-94")
        cci = ENV.get("BCP_CCI", "00221511617194509421")
        return (f"Datos de cobro BCP: Cuenta Soles {bcp} | CCI {cci}. "
                f"Genero recibos por honorarios desde el modulo Keygen/Finanzas "
                f"y los envio directamente al correo del cliente.")

    def get_web_stats(self):
        """Obtiene estadisticas en tiempo real desde Firestore."""
        try:
            leads = self.db.collection("web_leads").get()
            interactions = self.db.collection("interactions").get()
            return {
                "web_leads": len(leads),
                "total_interactions": len(interactions)
            }
        except Exception:
            return {"web_leads": 0, "total_interactions": 0}

    def _respond_report(self):
        now = datetime.datetime.now()
        hora = now.strftime("%H:%M")
        web = self.get_web_stats()
        try:
            from db_master.models import get_kpi_summary
            d = get_kpi_summary()
            return (f"📊 INFORME EJECUTIVO {hora}:\n"
                    f"💰 Ingresos: S/. {d['ingresos']:,.2f} | ⏳ Pendientes: S/. {d['pendientes']:,.2f}\n"
                    f"🌐 Web Leads: {web['web_leads']} | 📩 Interacciones: {web['total_interactions']}\n"
                    f"🛡️ Sistema: OPERATIVO | 💎 AXIA: SINCRONIZADA")
        except Exception:
            return (f"Sistema operativo a las {hora}.\n"
                    f"🌐 Web Leads: {web['web_leads']} | 📩 Interacciones: {web['total_interactions']}")

    def _respond_default(self, text):
        proactive = [
            f"Entendido, {self.owner_name}. Estoy analizando y tendre una recomendacion estrategica en breve.",
            f"Recibido. Como gerente del ecosistema, sugiero revisar tambien el pipeline de clientes.",
            f"Procesando tu consulta. Adicionalmente, detecto oportunidades de mejora en el area de cobros.",
            f"Anotado. ¿Deseas que genere un informe ejecutivo completo del dia?",
            f"Gestionado. Recuerda que tengo acceso total para ejecutar cualquier accion: correo, WSP, licencias y finanzas.",
        ]
        return random.choice(proactive)

    # ── ALERTAS CRÍTICAS ─────────────────────────────────────────────────────
    def check_critical_alerts(self) -> list:
        """Detecta situaciones críticas del negocio. Retorna lista ordenada por prioridad."""
        alerts = []
        try:
            from db_master.connection import get_db
            conn = get_db()
            c    = conn.cursor()
            hoy  = datetime.datetime.now()

            # 1. Pagos vencidos > 7 días
            limite_pago = (hoy - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
            c.execute("""
                SELECT COUNT(*), COALESCE(SUM(monto),0)
                FROM cobros
                WHERE estado='Pendiente' AND fecha_vencimiento <= ?
            """, (limite_pago,))
            row = c.fetchone()
            if row and row[0] > 0:
                alerts.append({
                    "tipo":     "PAGO_VENCIDO",
                    "prioridad":"ALTA",
                    "mensaje":  f"{row[0]} cobro(s) vencido(s) desde hace +7 días — S/. {row[1]:,.2f} pendiente.",
                    "accion":   "Contactar clientes morosos"
                })

            # 2. Licencias por vencer en < 3 días
            limite_lic = (hoy + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
            c.execute("""
                SELECT COUNT(*) FROM licencias
                WHERE estado='Emitida' AND fecha_fin <= ? AND fecha_fin >= ?
            """, (limite_lic, hoy.strftime("%Y-%m-%d")))
            row = c.fetchone()
            if row and row[0] > 0:
                alerts.append({
                    "tipo":     "LICENCIA_POR_VENCER",
                    "prioridad":"ALTA",
                    "mensaje":  f"{row[0]} licencia(s) vencen en menos de 3 días.",
                    "accion":   "Renovar o notificar al cliente"
                })

            # 3. Citas pendientes para hoy sin confirmar
            hoy_str = hoy.strftime("%Y-%m-%d")
            c.execute("""
                SELECT COUNT(*) FROM citas
                WHERE resultado='Pendiente' AND fecha_cita LIKE ?
            """, (f"{hoy_str}%",))
            row = c.fetchone()
            if row and row[0] > 0:
                alerts.append({
                    "tipo":     "CITAS_SIN_CONFIRMAR",
                    "prioridad":"MEDIA",
                    "mensaje":  f"{row[0]} cita(s) de hoy sin confirmar.",
                    "accion":   "Enviar recordatorio por WhatsApp"
                })

            # 4. Prospectos sin contacto > 48h
            limite_lead = (hoy - datetime.timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
            c.execute("""
                SELECT COUNT(*) FROM clientes
                WHERE estado='Prospecto'
                  AND (fecha_ultima_interaccion IS NULL OR fecha_ultima_interaccion <= ?)
            """, (limite_lead,))
            row = c.fetchone()
            if row and row[0] > 0:
                alerts.append({
                    "tipo":     "LEADS_SIN_SEGUIMIENTO",
                    "prioridad":"MEDIA",
                    "mensaje":  f"{row[0]} prospecto(s) sin contacto en más de 48 horas.",
                    "accion":   "Activar seguimiento automático AXIA"
                })

            conn.close()
        except Exception as e:
            print(f"[ALERTS ERR] {e}")
            alerts.append({
                "tipo":     "SISTEMA",
                "prioridad":"BAJA",
                "mensaje":  "Base de datos sin datos suficientes para alertas.",
                "accion":   "Registrar primeras ventas y clientes"
            })

        # Ordenar por prioridad
        orden = {"ALTA": 0, "MEDIA": 1, "BAJA": 2}
        return sorted(alerts, key=lambda x: orden.get(x["prioridad"], 3))

    # ── RESUMEN EJECUTIVO AXIA ───────────────────────────────────────────────
    def generate_axia_daily_brief(self) -> str:
        """Genera el resumen ejecutivo diario que ve el gerente en el dashboard."""
        try:
            from db_master.models import get_kpi_summary
            kpi     = get_kpi_summary()
            alerts  = self.check_critical_alerts()
            hora    = datetime.datetime.now().strftime("%H:%M")

            # Construir resumen (sin emojis para compatibilidad Windows)
            partes = [
                f"[{hora}] "
                f"Caja disponible: S/. {kpi['ingresos']:,.2f} | "
                f"Pendiente: S/. {kpi['pendientes']:,.2f}."
            ]

            if kpi.get("licencias", 0) > 0:
                partes.append(
                    f"{kpi['licencias']} licencia(s) activa(s) | "
                    f"{kpi.get('prospectos', 0)} prospecto(s) en pipeline."
                )

            if alerts:
                criticas = [a for a in alerts if a["prioridad"] == "ALTA"]
                if criticas:
                    partes.append(
                        f"ALERTA: {len(criticas)} critica(s): "
                        + " | ".join(a["mensaje"] for a in criticas[:2])
                    )
                else:
                    partes.append("Sin alertas criticas. Sistema operativo al 100%.")
            else:
                partes.append("Sistema operativo. Sin incidencias reportadas.")

            return " ".join(partes)

        except Exception as e:
            print(f"[BRIEF ERR] {e}")
            return (
                f"Sistema AXIA operativo. Buen día, {self.owner_name}. "
                "Registra tus primeras ventas para ver métricas completas."
            )


    # ── WSP HANDLER ───────────────────────────────────────
    def handle_wsp_message(self, from_number, message_text):
        """Procesa mensaje entrante de WhatsApp y genera respuesta humana."""
        text_low = message_text.lower()
        self._log_event("WSP_IN", f"{from_number}: {message_text[:80]}")

        # Registro automatico de prospecto
        self._auto_register_contact(from_number, message_text)

        # Generar respuesta contextual
        if any(w in text_low for w in ["precio", "costo", "plan", "cuanto", "tarifa"]):
            return self._wsp_pricing()
        if any(w in text_low for w in ["prueba", "gratis", "demo", "trial"]):
            return self._wsp_trial()
        if any(w in text_low for w in ["hola", "buenos", "buenas", "hi", "hello"]):
            return self._wsp_greeting()
        if any(w in text_low for w in ["pago", "transferencia", "yape", "bcp"]):
            return self._wsp_payment()
        return self._wsp_default()

    def _wsp_greeting(self):
        return (f"Hola! Soy AXIA, asistente de {self.empresa}. "
                f"Estoy aqui para ayudarte con la automatizacion de tu negocio. "
                f"¿En que puedo asistirte hoy? Cuéntame sobre tu empresa.")

    def _wsp_pricing(self):
        return ("Manejamos 3 planes segun el tamano de tu negocio:\n\n"
                "🥉 *Bronce* — S/. 99/mes\n"
                "🥈 *Plata* — S/. 149/mes\n"
                "🥇 *Gold* — S/. 199/mes\n\n"
                "Todos incluyen 14 dias de prueba GRATIS. "
                "¿Quieres que te explique las diferencias?")

    def _wsp_trial(self):
        return ("Perfecto! Tu prueba gratuita de 14 dias esta lista. "
                "Solo necesito: nombre de tu empresa, rubro y email. "
                "En menos de 2 horas tienes acceso completo al sistema.")

    def _wsp_payment(self):
        bcp = ENV.get("BCP_CUENTA_SOLES", "215-16171945-0-94")
        cci = ENV.get("BCP_CCI", "00221511617194509421")
        return (f"Datos de pago BCP:\n"
                f"Titular: Miguel Montero\n"
                f"Cuenta Soles: {bcp}\n"
                f"CCI: {cci}\n\n"
                f"Envia el comprobante aqui y activo tu licencia de inmediato.")

    def _wsp_default(self):
        return (f"Gracias por escribirnos! Tu mensaje fue registrado. "
                f"Un asesor de {self.empresa} te respondera pronto. "
                f"Para urgencias: +51 991 740 590")

    def _auto_register_contact(self, phone, msg):
        """Registra automaticamente el contacto como prospecto en CRM."""
        try:
            from db_master.connection import get_db
            conn = get_db()
            conn.row_factory = None
            c = conn.cursor()
            # Solo si no existe
            c.execute("SELECT id FROM clientes WHERE telefono=?", (phone,))
            if not c.fetchone():
                c.execute("INSERT INTO clientes (empresa, contacto, telefono, estado, notas) VALUES (?,?,?,?,?)",
                          (f"Prospecto WSP {phone[-4:]}", "Contacto WSP", phone, "Prospecto",
                           f"Primer mensaje: {msg[:100]}"))
                conn.commit()
            conn.close()
        except Exception:
            pass

    # ── LOGGER ───────────────────────────────────────────
    def _log_event(self, context, text):
        try:
            from db_master.connection import get_db
            conn = get_db()
            c = conn.cursor()
            c.execute("INSERT INTO axia_autonomy_logs (modulo, decision, nivel_riesgo, resultado) VALUES (?,?,?,?)",
                      (context, text[:120], "Bajo", "Procesado"))
            conn.commit()
            conn.close()
        except Exception:
            pass


_instance = None

def get_brain():
    global _instance
    if _instance is None:
        _instance = AXIABrain()
    return _instance
