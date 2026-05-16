import socket
import time
from datetime import datetime

TARGET_DOMAIN = "axyntrax-automation.net"
TARGET_IP = "216.198.79.1"

print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando radar de monitoreo DNS para {TARGET_DOMAIN}...", flush=True)
print(f"Esperando resolucion hacia IP de Vercel: {TARGET_IP}", flush=True)

while True:
    try:
        current_ip = socket.gethostbyname(TARGET_DOMAIN)
        if current_ip == TARGET_IP:
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🔥 ¡EXITO TOTAL! Propagacion DNS detectada.", flush=True)
            print(f"El dominio {TARGET_DOMAIN} ahora apunta correctamente a {current_ip}", flush=True)
            with open("DNS_READY_SIGNAL.txt", "w") as f:
                f.write(f"SUCCESS: Domain propagated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            break
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Radar activo. IP actual detectada: {current_ip} (Aun no coincide)", flush=True)
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Esperando respuesta del dominio... ({e})", flush=True)
    
    time.sleep(30)
