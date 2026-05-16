import customtkinter as ctk

class DiagnosticWidget(ctk.CTkFrame):
    """
    Componente de Diagnóstico de Salud AXIA.
    Muestra el estado operativo de los microservicios de la Suite.
    """
    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="#1a222d", corner_radius=10, border_color="#66FCF1", border_width=1, **kwargs)
        
        self.lbl_title = ctk.CTkLabel(self, text="SAFE > AXIA SENTINEL HEALTH", font=("Orbitron", 10, "bold"), text_color="#45A29E")
        self.lbl_title.pack(pady=(10, 5), padx=20)
        
        self.status_container = ctk.CTkFrame(self, fg_color="transparent")
        self.status_container.pack(fill="x", padx=15, pady=5)
        
        self.services = {
            "CFO": "green",
            "HUNTER": "green",
            "CRM": "green",
            "AGD": "green"
        }
        
        self.indicators = {}
        for service, color in self.services.items():
            f = ctk.CTkFrame(self.status_container, fg_color="transparent")
            f.pack(side="left", expand=True)
            
            dot = ctk.CTkLabel(f, text="●", font=("Arial", 14), text_color=color)
            dot.pack()
            
            lbl = ctk.CTkLabel(f, text=service, font=("Outfit", 8), text_color="#C5C6C7")
            lbl.pack()
            
            self.indicators[service] = dot

    def update_status(self, service, status):
        """Actualiza el color del indicador (green, orange, red)."""
        if service in self.indicators:
            self.indicators[service].configure(text_color=status)
