# AXYNTRAX — Guía de Deploy 24/7 en Railway
# Ejecutar este script solo si tienes Git instalado y GitHub configurado.
# Alternativa: sigue el METODO B (manual) explicado abajo.

# ══════════════════════════════════════════════════════════
# METODO A: Con Git (recomendado si tienes Git instalado)
# ══════════════════════════════════════════════════════════

# Instalar Git primero si no lo tienes:
# https://git-scm.com/download/win → siguiente, siguiente, instalar

# Luego ejecutar estos comandos en CMD o PowerShell:
# cd C:\Users\YARVIS\Desktop\AXYNTRAX_AUTOMATION_Suite
# git init
# git add axia_api.py axia_logic.py axia_followup.py cecilia_modules.py requirements.txt Procfile railway.json db_master/ suite_diamante/ data/
# git commit -m "AXIA API v3.0 - deploy inicial"
# railway login
# railway link
# railway up

# ══════════════════════════════════════════════════════════
# METODO B: Desde Railway web (sin instalar nada)
# ══════════════════════════════════════════════════════════

# 1. Ir a: https://railway.com/project/d5bdf2f0-0054-485d-8f24-feaf4ace2e08
# 2. Clic en el servicio "satisfied-alignment"
# 3. Clic en pestaña "Settings"
# 4. En "Source Repo" → clic en "Connect Repo"
# 5. Conectar con GitHub (autorizar)
# 6. Crear repo en GitHub: axyntrax-api
# 7. Subir archivos al repo desde GitHub.com
# 8. Railway detecta el Procfile y hace deploy automático

print("Ver instrucciones en el archivo COMO_DEPLOY_24H.py")
