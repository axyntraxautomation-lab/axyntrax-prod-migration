# 👥 PROPIETARIOS, PERMISOS Y ACCESOS — AXYNTRAX AUTOMATION SUITE

Este documento detalla el control de accesos, roles de usuario, permisos e integraciones críticas de la organización **AXYNTRAX Automation Suite** para asegurar la gobernanza y mantenimiento de la infraestructura.

---

## 🔑 1. Directorio de Propietarios y Roles de Dominio

| Rol / Dominio | Nombre / Identificador | Contacto / Enlace | Permisos / Responsabilidad |
|---|---|---|---|
| **CEO / Orquestador Central** | **JARVIS** | `jarvis_orchestrator.py` | Toma de decisiones automáticas, emisión de licencias MATRIX, monitoreo general. |
| **Administrador de Sistemas** | **YARVIS** | Tel: `+51 991 740 590` | Acceso root total, configuración de variables de entorno y base de datos SQLite. |
| **Propietario de Negocio / Admin** | **Miguel Montero** | `axyntraxautomation@gmail.com` | Propietario legal del dominio y facturación. |
| **Agente de Automatización** | **ANTIGRAVITY** | Ecosistema Gemini | Ejecución de tareas de infraestructura, refactorización y despliegue técnico. |

---

## 🌐 2. Infraestructura Web y Control de Repositorios

### Repositorio Principal en GitHub
* **URL:** `https://github.com/axyntrax-automation/axyntrax-suite`
* **Dueño del Repositorio:** Miguel Montero / YARVIS
* **Políticas de Acceso:**
  * Rama `main` protegida. Requiere al menos **1 aprobación técnica** y pasar los tests de CI/CD para integrarse.
  * Ramas de desarrollo: `feature/*`, `fix/*`, `antigravity/reorg-*`.

### Plataforma de Despliegues (Vercel)
* **Equipo Vercel:** `Axyntrax Suite Team` (Propietario: Miguel Montero)
* **Proyectos Desplegados:**
  * **Front-end / Dashboard:** `suite-diamante-dashboard` (Ramas enlazadas: `main` -> Producción, `develop` -> Staging/Puesta en escena).
  * **Funciones Serverless:** `api-unificada-serverless`.

---

## 🔒 3. Gestión de Secretos y Variables de Entorno

Todas las credenciales y llaves de API se almacenan en el archivo `.env` en producción local y en la **Bóveda de Secretos** en Vercel (Environment Variables). 

### Ubicación del Backup Cifrado de Secretos:
* **Ruta de Backup:** `C:\Users\YARVIS\.gemini\antigravity\scratch\AXYNTRAX_AUTOMATION_Suite\backups\secrets_encrypted.env.gpg`
* **Contraseña de Descifrado:** Almacenada en la bóveda física segura de YARVIS.

---

## 📊 4. Monitoreo e Integraciones de Terceros

* **WhatsApp Business API (Meta):**
  * **ID del Número de WhatsApp:** Gestionado en el Business Manager de Meta bajo la propiedad de `axyntraxautomation@gmail.com`.
  * **Webhook de Entrada:** Conectado al puerto `5000` redirigido a producción vía túnel seguro.
* **Inteligencia Artificial (Google Gemini API):**
  * **Key de API:** Vinculada en `.env` (Variable: `GEMINI_API_KEY`).
* **Monitoreo de Errores (Sentry/LogRocket):**
  * **Consola de Logs:** Vinculada al dashboard administrativo.
