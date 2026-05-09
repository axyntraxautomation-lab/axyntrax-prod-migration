# 📦 INVENTARIO, DIAGNÓSTICO Y ARCHIVADO CONTROLADO — AXYNTRAX

Este documento contiene el inventario completo del ecosistema **AXYNTRAX Automation Suite**, el diagnóstico de la infraestructura y el registro de elementos obsoletos archivados bajo la rama `antigravity/reorg-20260509` para simplificar la mantenibilidad operativa.

---

## 📋 1. Inventario de Componentes Activos y Despliegues

| Componente | Tipo | Ubicación Local | Despliegue / Estado |
|---|---|---|---|
| **API REST Unificada** | Python / Flask | `axia_api_unificada.py` | Puerto 5001 / Activo |
| **WhatsApp Bot (Cecilia)** | Python / Flask | `axia_webhook_v2.py` | Puerto 5000 / Activo |
| **Orquestador JARVIS** | Python | `jarvis_orchestrator.py` | Segundo plano / Activo |
| **Suite Diamante UI** | React / Vite | `suite_diamante/` | Local & Vercel / Activo |
| **Dashboard Web (Core)** | React / Vite | `axia-core/` | Puerto 5173 / Activo |
| **Base de Datos** | SQLite | `data/axyntrax.db` | WAL Mode / Activo |
| **Módulo de Licencias MATRIX**| Python | `keygen/` | Integrado en API / Activo |

---

## 🔍 2. Diagnóstico de Infraestructura y Elementos Obsoletos

Para maximizar la robustez del sistema, se han identificado varios componentes redundantes u obsoletos (herencia de iteraciones de desarrollo anteriores) que complican la administración del repositorio.

### Elementos Obsoletos Identificados:

1. **`axia_api.py` (Archivo de producción antiguo)**
   * *Justificación:* Reemplazado por `axia_api_unificada.py`, que unifica todos los endpoints REST del ecosistema.
   * *Acción:* Archivada con etiqueta `archive/old-api-20260509`.
2. **`axia_webhook.py` (Webhook antiguo)**
   * *Justificación:* Reemplazado por `axia_webhook_v2.py`, que cuenta con blindaje ante reintentos de Meta y modo stub local.
   * *Acción:* Archivada con etiqueta `archive/old-webhook-20260509`.
3. **`axyntrax_node_mvp/` (Directorio Node.js)**
   * *Justificación:* Código legado en Node.js para un MVP anterior. Todo el ecosistema actual corre en Python 3.10+ para IA y React para UI.
   * *Acción:* Archivado con etiqueta `archive/node-mvp-20260509`.
4. **`api/webhook.js`**
   * *Justificación:* Archivo JavaScript de demostración de webhook redundante.
   * *Acción:* Archivado con etiqueta `archive/js-webhook-20260509`.

---

## 🗄️ 3. Registro de Archivado y Tags de Reversión

Antes de remover estos archivos físicamente del repositorio principal, se han creado tags de Git para asegurar la posibilidad de reversión al 100% en menos de 15 minutos:

* **Tag de Archivado:** `archive-reorg-20260509`
* **Comando de Reversión:** `git checkout archive-reorg-20260509 -- <ruta_archivo>`

| Elemento Archivado | Ruta de Origen | Tag de Respaldo | Responsable | Fecha |
|---|---|---|---|---|
| `axia_api.py` | `/axia_api.py` | `archive-reorg-20260509` | ANTIGRAVITY | 2026-05-09 |
| `axia_webhook.py` | `/axia_webhook.py` | `archive-reorg-20260509` | ANTIGRAVITY | 2026-05-09 |
| `axyntrax_node_mvp/` | `/axyntrax_node_mvp` | `archive-reorg-20260509` | ANTIGRAVITY | 2026-05-09 |
| `api/webhook.js` | `/api/webhook.js` | `archive-reorg-20260509` | ANTIGRAVITY | 2026-05-09 |
