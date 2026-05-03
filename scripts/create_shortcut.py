import os
import winshell
from win32com.client import Dispatch

def create_shortcut():
    desktop = winshell.desktop()
    path = os.path.join(desktop, "AXIA_MAESTRO_PROD.lnk")
    target = os.path.join(os.getcwd(), "AXIA_MAESTRO.py")
    wDir = os.getcwd()
    icon = os.path.join(os.getcwd(), "assets", "branding", "logo.ico") # Assuming there is an icon

    shell = Dispatch('WScript.Shell')
    shortcut = shell.CreateShortCut(path)
    shortcut.Targetpath = "python.exe"
    shortcut.Arguments = f'"{target}"'
    shortcut.WorkingDirectory = wDir
    if os.path.exists(icon):
        shortcut.IconLocation = icon
    shortcut.save()
    print(f"✅ Acceso directo creado en el escritorio: {path}")

if __name__ == "__main__":
    try:
        create_shortcut()
    except Exception as e:
        print(f"❌ Error al crear acceso directo: {e}")
