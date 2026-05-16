# 📝 REGISTRO DE CAMBIOS (CHANGELOG) — AXYNTRAX AUTOMATION SUITE

Todos los cambios notables realizados en este proyecto de endurecimiento y resiliencia del sistema se documentan en este archivo de conformidad con los estándares de control de versiones semántico.

---

## [v3.1.0] - 2026-05-08

### 🛡️ Características de Resiliencia y Endurecimiento
*   **Base de Datos SQLite Antifrágil**:
    *   Soporte para **modo de diario WAL (Write-Ahead Logging)** integrado por defecto para permitir lecturas y escrituras simultáneas y sin interferencias.
    *   Sistema integrado de **reintentos exponenciales automáticos** (hasta 5 intentos) con incremento de retardo para interceptar y recuperarse de errores de bloqueo de base de datos (`database is locked` / `busy`).
*   **Robustez de API REST**:
    *   Manejo seguro de excepciones en el endpoint `/api/dashboard/kpis`. Ante un bloqueo persistente, la API devuelve ahora valores precalculados de contingencia en lugar de interrumpir el servicio con un código 500.
*   **Tolerancia a Fallos en Frontend (React)**:
    *   Añadido un bucle de **hasta 3 reintentos automáticos progresivos** en la función de chat de `AxiaCentralPage.jsx` ante fallas de red, latencias o cortes breves de conexión.
    *   **Fallback silencioso** automático hacia el modelo inteligente fuera de línea en caso de fallas de conexión persistentes, asegurando una experiencia continua para el usuario.
*   **Lanzador de Sistema Reubicable**:
    *   Rediseño del script de arranque `INICIAR_SISTEMA.bat` utilizando variables de entorno de Windows (`%~dp0`) para admitir la ejecución de servicios y bases de datos desde cualquier directorio de manera reubicable.
    *   Eliminación de caracteres especiales no-ASCII para prevenir errores de parsing de CMD/PowerShell en sistemas Windows.
    *   Volcado automatizado de registros históricos en la carpeta `/logs` (`backend_api.log`, `backend_webhook.log`, `frontend.log`).
*   **Copias de Seguridad Automatizadas**:
    *   Implementación de [db_backup.ps1](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/db_backup.ps1), un script en PowerShell para respaldar de forma segura la base de datos en caliente.
    *   **Rotación automática**: Limpieza programada de respaldos que excedan los **15 días** de antigüedad para optimizar el almacenamiento.

### 🧪 Automatización de Pruebas e Integración Continua (CI)
*   **Suite de Pruebas Unitarias** (`tests/test_axyntrax.py`): Pruebas automatizadas para certificar las conexiones robustas a SQLite, obtención correcta de KPIs y respuestas del endpoint de salud.
*   **Pipeline de CI con GitHub Actions** (`.github/workflows/ci.yml`): Pipeline automatizado que valida la sintaxis con `flake8`, levanta el backend de prueba y ejecuta los tests unitarios e integrados antes de cada fusión.

---

### 📂 Archivos Modificados e Introducidos:
*   ➕ [db_backup.ps1](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/db_backup.ps1) *(Nuevo script de respaldo automatizado)*
*   ➕ [tests/test_axyntrax.py](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/tests/test_axyntrax.py) *(Nueva suite de pruebas unitarias)*
*   ➕ [README_HARDENING.md](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/README_HARDENING.md) *(Nuevo manual de arquitectura de resiliencia)*
*   ➕ [.github/workflows/ci.yml](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/.github/workflows/ci.yml) *(Nuevo pipeline de integración continua)*
*   📝 [db_master/_sqlite_backend.py](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/db_master/_sqlite_backend.py) *(Capa de conexión blindada)*
*   📝 [axia_api.py](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/axia_api.py) *(Endpoints con tolerancia a fallos)*
*   📝 [axia-core/src/modules/axia/AxiaCentralPage.jsx](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/axia-core/src/modules/axia/AxiaCentralPage.jsx) *(Frontend con reintentos y fallback)*
*   📝 [INICIAR_SISTEMA.bat](file:///C:/Users/YARVIS/.gemini/antigravity/scratch/AXYNTRAX_AUTOMATION_Suite/INICIAR_SISTEMA.bat) *(Lanzador reubicable y libre de errores de parsing)*
