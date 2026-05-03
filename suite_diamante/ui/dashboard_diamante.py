import customtkinter as ctk
from PIL import Image
import os, sys, datetime, threading, time

IF_FROZEN = getattr(sys, 'frozen', False)
APP_PATH = sys._MEIPASS if IF_FROZEN else os.path.abspath(".")

C = {
    "bg":      "#070A0F",
    "sidebar": "#0D1117",
    "panel":   "#111827",
    "card":    "#1A2235",
    "accent":  "#00E5FF",
    "accent2": "#7C3AED",
    "green":   "#10B981",
    "red":     "#EF4444",
    "text":    "#F1F5F9",
    "muted":   "#64748B",
    "border":  "#1E293B",
}

from db_master.models import get_kpi_summary
from suite_diamante.logic.axia.brain import get_brain


class DiamanteDashboard(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("AxyntraX Automation | Suite Diamante v2.0")
        self.geometry("1600x950")
        self.minsize(1400, 800)
        self.configure(fg_color=C["bg"])
        self.brain = get_brain()
        self._axia_system_logs = []
        self._build_layout()
        self._start_clock()
        self._start_axia_system_daemon()
        self.show_stats()

    # ── LAYOUT ────────────────────────────────────────────────
    def _build_layout(self):
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(2, weight=0)

        self._build_topbar()    # row 0, span 3
        self._build_sidebar()   # col 0
        self._build_main()      # col 1
        self._build_axia()      # col 2

    def _build_topbar(self):
        bar = ctk.CTkFrame(self, fg_color=C["sidebar"], height=52, corner_radius=0)
        bar.grid(row=0, column=0, columnspan=3, sticky="ew")
        bar.grid_propagate(False)

        ctk.CTkLabel(bar, text="◈ AxyntraX Automation  |  Suite Diamante v2.0",
                     font=("Orbitron", 13, "bold"), text_color=C["accent"]).pack(side="left", padx=24)

        self.lbl_clock = ctk.CTkLabel(bar, text="", font=("Outfit", 13), text_color=C["muted"])
        self.lbl_clock.pack(side="right", padx=24)

        ctk.CTkLabel(bar, text="● SISTEMA OPERATIVO", font=("Outfit", 11),
                     text_color=C["green"]).pack(side="right", padx=16)

    def _build_sidebar(self):
        sb = ctk.CTkFrame(self, fg_color=C["sidebar"], width=220, corner_radius=0)
        sb.grid(row=1, column=0, sticky="nsew")
        sb.grid_propagate(False)

        ctk.CTkLabel(sb, text="NAVEGACIÓN", font=("Orbitron", 9), text_color=C["muted"]).pack(pady=(28, 8), padx=20, anchor="w")

        nav = [
            ("⬡  Dashboard Maestro",  self.show_stats),
            ("⬡  Centro Ejecutivo",   self.show_executive),
            ("⬡  Keygen / Licencias", self.show_keygen),
            ("⬡  AXIA SYSTEM",        self.show_axia_system),
            ("⬡  Email Corporativo",  self.show_email),
            ("⬡  Marketing IA",       self.show_marketing),
            ("⬡  Auditoría Sentinel", self.show_audit),
            ("⬡  Configuración",      self.show_config),
        ]
        self._nav_btns = []
        for txt, cmd in nav:
            b = ctk.CTkButton(sb, text=txt, fg_color="transparent",
                              text_color=C["muted"], hover_color=C["panel"],
                              anchor="w", font=("Outfit", 13),
                              border_spacing=14, corner_radius=8,
                              command=lambda c=cmd, b2=None: self._nav_click(c))
            b.pack(fill="x", padx=10, pady=2)
            self._nav_btns.append((b, cmd))

        # health dots
        ctk.CTkFrame(sb, fg_color=C["border"], height=1).pack(fill="x", padx=16, pady=20)
        ctk.CTkLabel(sb, text="MICROSERVICIOS", font=("Orbitron", 8), text_color=C["muted"]).pack(padx=20, anchor="w")
        for svc in ["CFO", "CRM", "HUNTER", "AGD"]:
            f = ctk.CTkFrame(sb, fg_color="transparent")
            f.pack(fill="x", padx=20, pady=3)
            ctk.CTkLabel(f, text="●", text_color=C["green"], font=("Arial", 10)).pack(side="left")
            ctk.CTkLabel(f, text=f"  {svc}  ONLINE", font=("Outfit", 10), text_color=C["muted"]).pack(side="left")

    def _nav_click(self, cmd):
        cmd()

    def _build_main(self):
        self.main = ctk.CTkFrame(self, fg_color="transparent")
        self.main.grid(row=1, column=1, sticky="nsew", padx=0, pady=0)

    def _build_axia(self):
        panel = ctk.CTkFrame(self, fg_color=C["sidebar"], width=320, corner_radius=0,
                             border_color=C["accent"], border_width=0)
        panel.grid(row=1, column=2, sticky="nsew")
        panel.grid_propagate(False)

        # Header AXIA
        hdr = ctk.CTkFrame(panel, fg_color=C["panel"], height=52, corner_radius=0)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="⬡ AXIA", font=("Orbitron", 13, "bold"),
                     text_color=C["accent"]).pack(side="left", padx=16, pady=14)
        ctk.CTkLabel(hdr, text="● EN LÍNEA", font=("Outfit", 10),
                     text_color=C["green"]).pack(side="right", padx=16)

        # Chat output
        self.axia_out = ctk.CTkTextbox(panel, fg_color=C["card"], text_color=C["text"],
                                        font=("Consolas", 11), wrap="word",
                                        border_color=C["border"], border_width=1)
        self.axia_out.pack(fill="both", expand=True, padx=12, pady=(12, 0))
        greeting = self.brain.get_greeting()
        self.axia_out.insert("end", f"AXIA › {greeting}\nEstoy aquí para lo que necesites, Miguel.\n\n")
        self.axia_out.configure(state="disabled")

        # Input
        inp_frame = ctk.CTkFrame(panel, fg_color="transparent")
        inp_frame.pack(fill="x", padx=12, pady=12)
        self.axia_in = ctk.CTkEntry(inp_frame, placeholder_text="Consulta a AXIA...",
                                     fg_color=C["card"], border_color=C["accent"],
                                     text_color=C["text"], font=("Outfit", 12))
        self.axia_in.pack(fill="x", pady=(0, 6))
        self.axia_in.bind("<Return>", self._send_axia)
        ctk.CTkButton(inp_frame, text="Enviar  ↵", fg_color=C["accent2"],
                      hover_color="#6D28D9", font=("Outfit", 12, "bold"),
                      command=self._send_axia).pack(fill="x")

    def _send_axia(self, event=None):
        q = self.axia_in.get().strip()
        if not q:
            return
        self.axia_in.delete(0, "end")
        self.axia_out.configure(state="normal")
        self.axia_out.insert("end", f"\nMiguel › {q}\n")
        self.axia_out.configure(state="disabled")
        self.update()

        def respond():
            r = self.brain.process_event("USER_QUERY", q)
            self.axia_out.configure(state="normal")
            self.axia_out.insert("end", f"AXIA › {r}\n")
            self.axia_out.see("end")
            self.axia_out.configure(state="disabled")

        threading.Thread(target=respond, daemon=True).start()

    # ── CLOCK ────────────────────────────────────────────────
    def _start_clock(self):
        def tick():
            while True:
                now = datetime.datetime.now().strftime("%A, %d %b %Y  |  %H:%M:%S")
                try:
                    self.lbl_clock.configure(text=now)
                except:
                    break
                time.sleep(1)
        threading.Thread(target=tick, daemon=True).start()

    # ── CONTENT HELPERS ──────────────────────────────────────
    def _clear(self):
        for w in self.main.winfo_children():
            w.destroy()

    def _header(self, title, subtitle=""):
        ctk.CTkLabel(self.main, text=title, font=("Orbitron", 24, "bold"),
                     text_color=C["accent"]).pack(anchor="w", padx=40, pady=(36, 2))
        if subtitle:
            ctk.CTkLabel(self.main, text=subtitle, font=("Outfit", 12),
                         text_color=C["muted"]).pack(anchor="w", padx=40, pady=(0, 20))

    def _card(self, parent, title, value, color=None, w=220, h=130):
        color = color or C["accent"]
        f = ctk.CTkFrame(parent, fg_color=C["card"], corner_radius=14,
                         border_color=C["border"], border_width=1, width=w, height=h)
        f.pack(side="left", padx=(0, 16))
        f.pack_propagate(False)
        ctk.CTkLabel(f, text=title, font=("Outfit", 10), text_color=C["muted"]).pack(pady=(22, 4))
        ctk.CTkLabel(f, text=value, font=("Orbitron", 20, "bold"), text_color=color).pack()
        return f

    # ── SECTIONS ─────────────────────────────────────────────
    def show_stats(self):
        self._clear()
        self._header("DASHBOARD MAESTRO", "Resumen ejecutivo en tiempo real")
        data = get_kpi_summary()

        # KPI row
        row = ctk.CTkFrame(self.main, fg_color="transparent")
        row.pack(fill="x", padx=40)
        self._card(row, "INGRESOS TOTALES",   f"S/. {data['ingresos']:,.2f}", C["accent"])
        self._card(row, "CUENTAS PENDIENTES", f"S/. {data['pendientes']:,.2f}", C["red"])
        self._card(row, "PROSPECTOS",         str(data["prospectos"]), C["text"])
        self._card(row, "LICENCIAS ACTIVAS",  str(data["licencias"]), C["green"])

        # Separator
        ctk.CTkFrame(self.main, fg_color=C["border"], height=1).pack(fill="x", padx=40, pady=24)

        # Licencias recientes
        ctk.CTkLabel(self.main, text="LICENCIAS RECIENTES", font=("Orbitron", 13),
                     text_color=C["muted"]).pack(anchor="w", padx=40, pady=(0, 10))
        scroll = ctk.CTkScrollableFrame(self.main, fg_color=C["card"],
                                         corner_radius=10, height=200)
        scroll.pack(fill="x", padx=40)
        try:
            from db_master.connection import get_db as _gdb
            conn = _gdb()
            conn.row_factory = None
            c = conn.cursor()
            c.execute("SELECT clave, tipo, rubro, estado, fecha_fin FROM licencias ORDER BY id DESC LIMIT 10")
            lics = c.fetchall()
            conn.close()
            if lics:
                for clave, tipo, rubro, estado, fin in lics:
                    rf = ctk.CTkFrame(scroll, fg_color=C["panel"], corner_radius=6)
                    rf.pack(fill="x", pady=3, padx=6)
                    ctk.CTkLabel(rf, text=f"  {clave}", font=("Consolas", 11),
                                 text_color=C["accent"], width=220).pack(side="left", pady=8)
                    ctk.CTkLabel(rf, text=f"{tipo} | {rubro}",
                                 text_color=C["text"], font=("Outfit", 11)).pack(side="left", padx=10)
                    col = C["green"] if estado == "Activa" else C["muted"]
                    ctk.CTkLabel(rf, text=estado, text_color=col,
                                 font=("Outfit", 11, "bold")).pack(side="right", padx=20)
            else:
                ctk.CTkLabel(scroll, text="Sin licencias aún.",
                             text_color=C["muted"]).pack(pady=16)
        except Exception as ex:
            ctk.CTkLabel(scroll, text=f"Error: {ex}",
                         text_color=C["red"]).pack(pady=16)

    # ── KEYGEN ──────────────────────────────────────────────
    def show_keygen(self):
        import uuid, hashlib, datetime as dt
        self._clear()
        self._header("GENERADOR DE LICENCIAS", "Emite y administra claves AXIA")

        form = ctk.CTkFrame(self.main, fg_color=C["card"], corner_radius=12)
        form.pack(fill="x", padx=40, pady=(0, 16))

        # Fila 1
        r1 = ctk.CTkFrame(form, fg_color="transparent")
        r1.pack(fill="x", padx=24, pady=(16, 6))
        ctk.CTkLabel(r1, text="Cliente / Empresa", text_color=C["muted"],
                     font=("Outfit", 12), width=140).pack(side="left")
        self._kg_cliente = ctk.CTkEntry(r1, width=300, placeholder_text="Nombre del cliente",
                                         fg_color=C["panel"], border_color=C["border"],
                                         text_color=C["text"])
        self._kg_cliente.pack(side="left", padx=12)

        # Fila 2
        r2 = ctk.CTkFrame(form, fg_color="transparent")
        r2.pack(fill="x", padx=24, pady=6)
        ctk.CTkLabel(r2, text="Tipo de Plan", text_color=C["muted"],
                     font=("Outfit", 12), width=140).pack(side="left")
        self._kg_tipo = ctk.CTkOptionMenu(r2, values=["Bronce","Plata","Gold","Diamante"],
                                           fg_color=C["panel"], button_color=C["accent2"],
                                           text_color=C["text"])
        self._kg_tipo.pack(side="left", padx=12)
        self._kg_tipo.set("Gold")

        # Fila 3
        r3 = ctk.CTkFrame(form, fg_color="transparent")
        r3.pack(fill="x", padx=24, pady=6)
        ctk.CTkLabel(r3, text="Módulo / Rubro", text_color=C["muted"],
                     font=("Outfit", 12), width=140).pack(side="left")
        self._kg_rubro = ctk.CTkOptionMenu(r3,
                                            values=["MediBot","VetBot","DentBot","LexBot",
                                                    "LogiBot","CondoBot","Todos"],
                                            fg_color=C["panel"], button_color=C["accent2"],
                                            text_color=C["text"])
        self._kg_rubro.pack(side="left", padx=12)

        # Fila 4 - días
        r4 = ctk.CTkFrame(form, fg_color="transparent")
        r4.pack(fill="x", padx=24, pady=6)
        ctk.CTkLabel(r4, text="Días de validez", text_color=C["muted"],
                     font=("Outfit", 12), width=140).pack(side="left")
        self._kg_dias = ctk.CTkOptionMenu(r4, values=["30","60","90","180","365"],
                                           fg_color=C["panel"], button_color=C["accent2"],
                                           text_color=C["text"])
        self._kg_dias.pack(side="left", padx=12)
        self._kg_dias.set("30")

        # Preview key
        r5 = ctk.CTkFrame(form, fg_color="transparent")
        r5.pack(fill="x", padx=24, pady=(10, 16))
        ctk.CTkLabel(r5, text="Clave Generada", text_color=C["muted"],
                     font=("Outfit", 12), width=140).pack(side="left")
        self._kg_preview = ctk.CTkEntry(r5, width=420, font=("Consolas", 12),
                                         fg_color=C["bg"], border_color=C["accent"],
                                         text_color=C["accent"], state="disabled")
        self._kg_preview.pack(side="left", padx=12)

        # Botones
        btn_row = ctk.CTkFrame(form, fg_color="transparent")
        btn_row.pack(padx=24, pady=(0, 16))
        self._kg_status = ctk.CTkLabel(btn_row, text="", text_color=C["green"],
                                        font=("Outfit", 12))
        self._kg_status.pack(pady=(0,8))
        ctk.CTkButton(btn_row, text="⚡  GENERAR LICENCIA",
                      fg_color=C["accent2"], hover_color="#6D28D9",
                      font=("Outfit", 13, "bold"), width=220,
                      command=self._generate_key).pack(side="left", padx=(0, 12))
        ctk.CTkButton(btn_row, text="💾  GUARDAR EN DB",
                      fg_color=C["green"], hover_color="#059669",
                      font=("Outfit", 13, "bold"), width=180,
                      command=self._save_key).pack(side="left")

        # Lista licencias
        ctk.CTkLabel(self.main, text="LICENCIAS EMITIDAS", font=("Orbitron", 12),
                     text_color=C["muted"]).pack(anchor="w", padx=40, pady=(16, 8))
        self._lic_scroll = ctk.CTkScrollableFrame(self.main, fg_color=C["card"],
                                                    corner_radius=10, height=220)
        self._lic_scroll.pack(fill="x", padx=40)
        self._refresh_lic_list()

    def _generate_key(self):
        import uuid, hashlib, datetime as dt
        tipo  = self._kg_tipo.get()
        rubro = self._kg_rubro.get()
        dias  = self._kg_dias.get()
        rand  = uuid.uuid4().hex[:8].upper()
        key   = f"AXIA-{tipo[:2].upper()}{rubro[:3].upper()}-{rand}-{dias}D"
        self._last_key = key
        self._last_dias = int(dias)
        self._kg_preview.configure(state="normal")
        self._kg_preview.delete(0, "end")
        self._kg_preview.insert(0, key)
        self._kg_preview.configure(state="disabled")
        self._kg_status.configure(text="Clave generada. Presiona GUARDAR para registrar.",
                                   text_color=C["accent"])

    def _save_key(self):
        import datetime as dt
        if not hasattr(self, '_last_key') or not self._last_key:
            self._kg_status.configure(text="Genera una clave primero.", text_color=C["red"])
            return
        tipo  = self._kg_tipo.get()
        rubro = self._kg_rubro.get()
        hoy   = dt.datetime.now().strftime("%Y-%m-%d")
        fin   = (dt.datetime.now() + dt.timedelta(days=self._last_dias)).strftime("%Y-%m-%d")
        try:
            from db_master.connection import get_db as _gdb
            conn = _gdb()
            c = conn.cursor()
            c.execute("INSERT INTO licencias (clave, tipo, dias, rubro, estado, fecha_inicio, fecha_fin) "
                      "VALUES (?, ?, ?, ?, 'Emitida', ?, ?)",
                      (self._last_key, tipo, self._last_dias, rubro, hoy, fin))
            conn.commit()
            conn.close()
            self._kg_status.configure(text=f"✓ Licencia guardada: {self._last_key}",
                                       text_color=C["green"])
            self._last_key = ""
            self._refresh_lic_list()
        except Exception as ex:
            self._kg_status.configure(text=f"Error: {ex}", text_color=C["red"])

    def _refresh_lic_list(self):
        for w in self._lic_scroll.winfo_children():
            w.destroy()
        try:
            from db_master.connection import get_db as _gdb
            conn = _gdb()
            conn.row_factory = None
            c = conn.cursor()
            c.execute("SELECT clave, tipo, rubro, estado, fecha_fin FROM licencias ORDER BY id DESC LIMIT 20")
            lics = c.fetchall()
            conn.close()
            if lics:
                for clave, tipo, rubro, estado, fin in lics:
                    rf = ctk.CTkFrame(self._lic_scroll, fg_color=C["panel"], corner_radius=6)
                    rf.pack(fill="x", pady=3, padx=6)
                    ctk.CTkLabel(rf, text=f"  {clave}", font=("Consolas", 11),
                                 text_color=C["accent"], width=280).pack(side="left", pady=8)
                    ctk.CTkLabel(rf, text=f"{tipo} | {rubro}",
                                 text_color=C["text"], font=("Outfit", 11)).pack(side="left", padx=8)
                    col = C["green"] if estado == "Activa" else C["muted"]
                    ctk.CTkLabel(rf, text=f"{estado}  exp:{fin}",
                                 text_color=col, font=("Outfit", 10)).pack(side="right", padx=16)
            else:
                ctk.CTkLabel(self._lic_scroll, text="Sin licencias registradas.",
                             text_color=C["muted"]).pack(pady=16)
        except Exception as ex:
            ctk.CTkLabel(self._lic_scroll, text=f"Error: {ex}",
                         text_color=C["red"]).pack(pady=16)

    def show_executive(self):
        self._clear()
        self._header("CENTRO EJECUTIVO", "Inteligencia de mando y decisión")
        from suite_diamante.logic.axia.executive import get_executive
        ex = get_executive()
        adv = ex.get_proactive_advice()
        box = ctk.CTkFrame(self.main, fg_color=C["card"], corner_radius=12,
                           border_color=C["accent"], border_width=1)
        box.pack(fill="x", padx=40, pady=(0, 20))
        ctk.CTkLabel(box, text=f"⬡  {adv}", font=("Outfit", 13, "italic"),
                     text_color=C["text"], wraplength=900).pack(pady=18, padx=20)

        cols = ctk.CTkFrame(self.main, fg_color="transparent")
        cols.pack(fill="both", expand=True, padx=40)
        cols.columnconfigure(0, weight=1)
        cols.columnconfigure(1, weight=1)

        # Agenda
        ag = ctk.CTkFrame(cols, fg_color=C["card"], corner_radius=12)
        ag.grid(row=0, column=0, sticky="nsew", padx=(0, 10), pady=0)
        ctk.CTkLabel(ag, text="AGENDA HOY", font=("Orbitron", 14),
                     text_color=C["accent"]).pack(pady=16)
        try:
            from db_master.connection import get_db
            conn = get_db()
            c = conn.cursor()
            hoy = datetime.datetime.now().strftime("%Y-%m-%d")
            c.execute("SELECT asunto, fecha_cita FROM citas WHERE fecha_cita LIKE ? ORDER BY fecha_cita",
                      (f"{hoy}%",))
            citas = c.fetchall()
            conn.close()
            if citas:
                for asunto, fecha in citas:
                    ctk.CTkLabel(ag, text=f"  {fecha[11:16]}  {asunto}",
                                 text_color=C["text"], font=("Outfit", 12),
                                 anchor="w").pack(fill="x", padx=20, pady=3)
            else:
                ctk.CTkLabel(ag, text="Sin citas programadas hoy.",
                             text_color=C["muted"]).pack(pady=20)
        except:
            ctk.CTkLabel(ag, text="Sin citas programadas hoy.",
                         text_color=C["muted"]).pack(pady=20)

        # KPIs express
        kf = ctk.CTkFrame(cols, fg_color=C["card"], corner_radius=12)
        kf.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        ctk.CTkLabel(kf, text="CFO EXPRESS", font=("Orbitron", 14),
                     text_color=C["accent"]).pack(pady=16)
        kpi = get_kpi_summary()
        try:
            from db_master.connection import get_db
            conn = get_db()
            c2 = conn.cursor()
            ayer = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
            c2.execute("SELECT SUM(monto) FROM ventas WHERE estado='Completada' AND creado_en LIKE ?",
                       (f"{ayer}%",))
            vy = c2.fetchone()[0] or 0.0
            conn.close()
        except:
            vy = 0.0
        for label, val in [("Ventas Ayer", f"S/. {vy:,.2f}"),
                           ("Ingresos Totales", f"S/. {kpi['ingresos']:,.2f}"),
                           ("Morosidad", f"S/. {kpi['pendientes']:,.2f}")]:
            rf = ctk.CTkFrame(kf, fg_color="transparent")
            rf.pack(fill="x", padx=24, pady=6)
            ctk.CTkLabel(rf, text=label, text_color=C["muted"],
                         font=("Outfit", 12)).pack(side="left")
            ctk.CTkLabel(rf, text=val, text_color=C["text"],
                         font=("Outfit", 13, "bold")).pack(side="right")

    def show_marketing(self):
        self._clear()
        self._header("MARKETING IA AUTÓNOMO", "Calendario de campañas AXIA")
        scroll = ctk.CTkScrollableFrame(self.main, fg_color=C["card"],
                                         corner_radius=12, height=500)
        scroll.pack(fill="both", expand=True, padx=40)
        actions = []
        try:
            from db_master.connection import get_db
            conn = get_db()
            c = conn.cursor()
            hoy = datetime.datetime.now().strftime("%Y-%m-%d")
            c.execute("SELECT fecha_programada, segmento, mensaje_raw FROM axia_campaigns "
                      "WHERE estado='Pendiente' AND fecha_programada >= ? ORDER BY fecha_programada LIMIT 20",
                      (hoy,))
            actions = c.fetchall()
            conn.close()
        except:
            pass
        if not actions:
            hdt = datetime.datetime.now()
            actions = [
                ((hdt + datetime.timedelta(days=2)).strftime("%Y-%m-%d"), "FIELES", "Seguimiento de fidelización"),
                ((hdt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"), "NUEVOS", "Bienvenida a nuevos clientes"),
                ((hdt + datetime.timedelta(days=7)).strftime("%Y-%m-%d"), "EN_RIESGO", "Recuperación empática"),
            ]
        for date, seg, desc in actions:
            row = ctk.CTkFrame(scroll, fg_color=C["panel"], corner_radius=8)
            row.pack(fill="x", pady=4, padx=8)
            ctk.CTkLabel(row, text=f"  {date}", width=110, font=("Consolas", 11),
                         text_color=C["accent"]).pack(side="left", pady=10)
            ctk.CTkLabel(row, text=f" {seg} ", fg_color=C["accent2"],
                         corner_radius=6, font=("Outfit", 10, "bold")).pack(side="left", padx=10)
            ctk.CTkLabel(row, text=desc, text_color=C["text"],
                         font=("Outfit", 12)).pack(side="left")

    def show_audit(self):
        self._clear()
        self._header("AUDITORÍA SENTINEL", "Cadena inmutable de acciones AXIA")
        scroll = ctk.CTkScrollableFrame(self.main, fg_color=C["card"],
                                         corner_radius=12, height=550)
        scroll.pack(fill="both", expand=True, padx=40)
        try:
            from db_master.connection import get_db
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT timestamp, action_type, result, hash_signature FROM bot_audit ORDER BY id DESC")
            logs = c.fetchall()
            conn.close()
            if logs:
                for ts, action, res, sig in logs:
                    row = ctk.CTkFrame(scroll, fg_color=C["panel"], corner_radius=8)
                    row.pack(fill="x", pady=3, padx=8)
                    ctk.CTkLabel(row, text=f"  {ts}", width=160, font=("Consolas", 10),
                                 text_color=C["muted"]).pack(side="left", pady=8)
                    ctk.CTkLabel(row, text=f"{action} | {res}",
                                 text_color=C["text"], font=("Outfit", 11)).pack(side="left", padx=10)
                    ctk.CTkLabel(row, text=f"{str(sig)[:16]}…", font=("Consolas", 9),
                                 text_color=C["muted"]).pack(side="right", padx=12)
            else:
                ctk.CTkLabel(scroll, text="No hay registros aún.",
                             text_color=C["muted"]).pack(pady=30)
        except:
            ctk.CTkLabel(scroll, text="No hay registros aún.",
                         text_color=C["muted"]).pack(pady=30)

    def show_config(self):
        self._clear()
        self._header("CONFIGURACIÓN DIAMANTE", "Parámetros del sistema")
        form = ctk.CTkFrame(self.main, fg_color=C["card"], corner_radius=12)
        form.pack(fill="x", padx=40, pady=0)
        import dotenv
        env_path = os.path.join(os.path.abspath("."), ".env")
        ev = {}
        try:
            ev = dotenv.dotenv_values(env_path)
        except:
            pass
        phone = ev.get("ADMIN_PHONE_NUMBER", "")
        did   = ev.get("AUTHORIZED_DIAMOND_ID", "")
        masked_phone = f"+51 ***{phone[-4:]}" if len(phone) >= 4 else "No configurado"
        masked_did   = f"{did[:8]}...{did[-4:]}" if len(did) >= 12 else "No configurado"
        for label, val in [("Propietario", "Miguel Montero"),
                           ("Número Admin", masked_phone),
                           ("Diamond ID",  masked_did)]:
            rf = ctk.CTkFrame(form, fg_color="transparent")
            rf.pack(fill="x", padx=40, pady=12)
            ctk.CTkLabel(rf, text=label, text_color=C["muted"],
                         width=180, anchor="w", font=("Outfit", 13)).pack(side="left")
            e = ctk.CTkEntry(rf, width=400, font=("Outfit", 13))
            e.insert(0, val)
            e.configure(state="disabled")
            e.pack(side="left", padx=16)

    # ── AXIA SYSTEM DAEMON ───────────────────────────────────
    def _start_axia_system_daemon(self):
        from suite_diamante.logic.axia.axia_system import get_axia_system
        sys_mgr = get_axia_system()
        def on_log(level, line):
            self._axia_system_logs.append((level, line))
            if len(self._axia_system_logs) > 200:
                self._axia_system_logs.pop(0)
            if hasattr(self, "_axia_feed"):
                try:
                    self._axia_feed.configure(state="normal")
                    color_map = {"OK": C["green"], "WARN": "#F59E0B",
                                 "ALERTA": C["red"], "EXITO": C["accent"], "ERROR": C["red"]}
                    self._axia_feed.insert("end", line + "\n")
                    self._axia_feed.see("end")
                    self._axia_feed.configure(state="disabled")
                except Exception:
                    pass
        sys_mgr["add_callback"](on_log)
        sys_mgr["start"]()

    def show_axia_system(self):
        self._clear()
        self._header("AXIA SYSTEM — VIGILANCIA 24/7",
                     "Monitoreo de sistema, web, DNS y SSL en tiempo real")

        # Status bar
        status_row = ctk.CTkFrame(self.main, fg_color=C["card"], corner_radius=10, height=54)
        status_row.pack(fill="x", padx=40, pady=(0, 16))
        status_row.pack_propagate(False)
        ctk.CTkLabel(status_row, text="● AXIA SYSTEM ACTIVO", font=("Orbitron", 12),
                     text_color=C["green"]).pack(side="left", padx=20, pady=15)
        ctk.CTkLabel(status_row, text=f"Dominio: axyntrax-automation.com",
                     font=("Outfit", 11), text_color=C["muted"]).pack(side="left", padx=20)

        # Botones de verificacion manual
        btn_row = ctk.CTkFrame(self.main, fg_color="transparent")
        btn_row.pack(fill="x", padx=40, pady=(0, 16))
        from suite_diamante.logic.axia.axia_system import (
            check_dns_propagation, check_ssl, check_netlify_app, check_system_health)

        for label, fn in [("⚡ Check DNS", check_dns_propagation),
                           ("🔒 Check SSL", check_ssl),
                           ("🌐 Check Web", check_netlify_app),
                           ("💻 Check Sistema", check_system_health)]:
            ctk.CTkButton(btn_row, text=label, fg_color=C["panel"],
                          border_color=C["accent"], border_width=1,
                          text_color=C["accent"], font=("Outfit", 11),
                          hover_color=C["card"], width=160,
                          command=lambda f=fn: threading.Thread(target=f, daemon=True).start()
                          ).pack(side="left", padx=(0, 10))

        # Feed en vivo
        ctk.CTkLabel(self.main, text="FEED EN VIVO", font=("Orbitron", 11),
                     text_color=C["muted"]).pack(anchor="w", padx=40, pady=(0, 8))
        self._axia_feed = ctk.CTkTextbox(self.main, fg_color=C["card"], text_color=C["text"],
                                          font=("Consolas", 11), wrap="word",
                                          border_color=C["border"], border_width=1)
        self._axia_feed.pack(fill="both", expand=True, padx=40, pady=(0, 20))
        # Cargar logs previos
        self._axia_feed.configure(state="normal")
        if self._axia_system_logs:
            for _, line in self._axia_system_logs[-50:]:
                self._axia_feed.insert("end", line + "\n")
        else:
            self._axia_feed.insert("end", "AXIA SYSTEM iniciando... Ejecuta un check manual arriba.\n")
        self._axia_feed.see("end")
        self._axia_feed.configure(state="disabled")

    def show_email(self):
        self._clear()
        self._header("EMAIL CORPORATIVO — AXIA CENTRAL",
                     "axyntraxautomation@gmail.com")
        from suite_diamante.logic.axia.email_manager import (
            get_daily_summary, get_unread_emails, send_email)

        # Resumen
        summary = get_daily_summary()
        box = ctk.CTkFrame(self.main, fg_color=C["card"], corner_radius=10, height=54)
        box.pack(fill="x", padx=40, pady=(0, 16))
        box.pack_propagate(False)
        ctk.CTkLabel(box, text=summary, font=("Outfit", 12),
                     text_color=C["accent"]).pack(side="left", padx=20, pady=15)

        # Panel de envio rapido
        send_frame = ctk.CTkFrame(self.main, fg_color=C["card"], corner_radius=10)
        send_frame.pack(fill="x", padx=40, pady=(0, 16))
        ctk.CTkLabel(send_frame, text="ENVIO RAPIDO", font=("Orbitron", 12),
                     text_color=C["muted"]).pack(anchor="w", padx=20, pady=(14, 6))
        r1 = ctk.CTkFrame(send_frame, fg_color="transparent")
        r1.pack(fill="x", padx=20, pady=4)
        ctk.CTkLabel(r1, text="Para:", width=60, text_color=C["muted"],
                     font=("Outfit", 12)).pack(side="left")
        self._email_to = ctk.CTkEntry(r1, width=300, fg_color=C["panel"],
                                       border_color=C["border"], text_color=C["text"])
        self._email_to.pack(side="left", padx=8)

        r2 = ctk.CTkFrame(send_frame, fg_color="transparent")
        r2.pack(fill="x", padx=20, pady=4)
        ctk.CTkLabel(r2, text="Asunto:", width=60, text_color=C["muted"],
                     font=("Outfit", 12)).pack(side="left")
        self._email_subj = ctk.CTkEntry(r2, width=400, fg_color=C["panel"],
                                         border_color=C["border"], text_color=C["text"])
        self._email_subj.pack(side="left", padx=8)

        r3 = ctk.CTkFrame(send_frame, fg_color="transparent")
        r3.pack(fill="x", padx=20, pady=4)
        ctk.CTkLabel(r3, text="Mensaje:", width=60, text_color=C["muted"],
                     font=("Outfit", 12)).pack(side="left", anchor="n")
        self._email_body = ctk.CTkTextbox(r3, height=80, fg_color=C["panel"],
                                           border_color=C["border"], text_color=C["text"],
                                           font=("Outfit", 12))
        self._email_body.pack(side="left", padx=8, fill="x", expand=True)

        self._email_status = ctk.CTkLabel(send_frame, text="", font=("Outfit", 12),
                                           text_color=C["green"])
        self._email_status.pack(pady=6)
        ctk.CTkButton(send_frame, text="✉  ENVIAR CORREO", fg_color=C["accent2"],
                      hover_color="#6D28D9", font=("Outfit", 12, "bold"),
                      command=self._do_send_email).pack(pady=(0, 16))

        # Correos no leidos
        ctk.CTkLabel(self.main, text="BANDEJA — CORREOS NO LEIDOS", font=("Orbitron", 11),
                     text_color=C["muted"]).pack(anchor="w", padx=40, pady=(8, 6))
        scroll = ctk.CTkScrollableFrame(self.main, fg_color=C["card"],
                                         corner_radius=10, height=200)
        scroll.pack(fill="x", padx=40)

        def load_inbox():
            emails, status = get_unread_emails(limit=8)
            self.after(0, lambda: self._render_inbox(scroll, emails, status))
        threading.Thread(target=load_inbox, daemon=True).start()
        ctk.CTkLabel(scroll, text="Cargando bandeja...",
                     text_color=C["muted"]).pack(pady=12)

    def _render_inbox(self, scroll, emails, status):
        for w in scroll.winfo_children():
            w.destroy()
        if not emails:
            ctk.CTkLabel(scroll, text=f"Sin correos no leidos. ({status})",
                         text_color=C["muted"]).pack(pady=12)
            return
        for em in emails:
            rf = ctk.CTkFrame(scroll, fg_color=C["panel"], corner_radius=6)
            rf.pack(fill="x", pady=3, padx=6)
            ctk.CTkLabel(rf, text=f"  {em['subject'][:50]}", font=("Outfit", 12),
                         text_color=C["text"]).pack(side="left", pady=8)
            ctk.CTkLabel(rf, text=em["from"][:30], font=("Outfit", 10),
                         text_color=C["muted"]).pack(side="right", padx=12)

    def _do_send_email(self):
        to   = self._email_to.get().strip()
        subj = self._email_subj.get().strip()
        body = self._email_body.get("1.0", "end").strip()
        if not to or not subj:
            self._email_status.configure(text="Completa Para y Asunto.", text_color=C["red"])
            return
        from suite_diamante.logic.axia.email_manager import send_email
        body_html = f"<p>{body.replace(chr(10), '<br>')}</p>"
        def do_send():
            ok, msg = send_email(to, subj, body_html, body)
            col = C["green"] if ok else C["red"]
            self.after(0, lambda: self._email_status.configure(text=msg, text_color=col))
        self._email_status.configure(text="Enviando...", text_color=C["muted"])
        threading.Thread(target=do_send, daemon=True).start()


if __name__ == "__main__":
    app = DiamanteDashboard()
    app.mainloop()
