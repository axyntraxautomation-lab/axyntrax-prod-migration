# JARVIS CORE

Esta carpeta centraliza la lógica del Orquestador CEO del ecosistema AXYNTRAX Automation Suite.

## Componentes

1. **`jarvis_orchestrator.py`**: Orquestador maestro. Inicia servicios, monitorea PIDs, y dispara reinicios en caso de fallo. Integra ahora el sistema de autoreparación Atlas.
2. **`google_connector.py`**: Conector básico de sincronización con Google Calendar y listado de correos.
3. **`jarvis_gmail_maestro.py`**: El gestor inteligente de correos. Clasifica los correos entrantes por urgencia y dispara respuestas/drafts automáticos basados en plantillas.

## Configuración (en .env)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_TOKEN` (Almacenamiento local dinámico)

## Operación
Los procesos corren de forma automatizada invocados por el Orquestador Central.
Los logs maestros residen en `/logs/orchestrator.log`.
