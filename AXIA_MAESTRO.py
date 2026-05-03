import os
import sys
import traceback
import datetime

# --- BLINDAJE DE CODIFICACION ---
# Prevenir UnicodeEncodeError en terminales Windows antiguas (cp1252)
if sys.stdout.encoding != 'utf-8':
    try:
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())
    except Exception:
        pass

# Asegurar que el directorio raiz este en el path para las importaciones
ROOT_DIR = os.path.abspath(".")
sys.path.append(ROOT_DIR)

def log_error(err_msg):
    """Genera un registro forense en disco en caso de fallo critico."""
    log_dir = os.path.join(ROOT_DIR, "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "STARTUP_ERROR.log")
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"\n--- ERROR DE ARRANQUE [{timestamp}] ---\n")
        f.write(err_msg)
        f.write("\n------------------------------------------\n")

def launch():
    print("[AXYNTRAX] INICIANDO AxyntraX Automation | Suite Diamante v1.0")
    print("[AXIA] Verificando integridad del sistema...")
    
    try:
        # Importacion tardia para asegurar que el path y la codificacion esten listos
        from suite_diamante.main import main
        main()
    except ImportError as e:
        err = f"ERROR DE IMPORTACION: No se han instalado todas las dependencias.\nDetalle: {e}\nTIP: Ejecute SETUP_DIAMANTE.bat"
        print(f"\n[FALTA CRITICA] {err}")
        log_error(err + "\n" + traceback.format_exc())
    except Exception as e:
        err = f"ERROR DE ARRANQUE INESPERADO: {e}"
        print(f"\n[FALTA CRITICA] {err}")
        log_error(err + "\n" + traceback.format_exc())
        print(f"[INFO] Se ha generado un reporte tecnico en logs/STARTUP_ERROR.log")

if __name__ == "__main__":
    launch()
