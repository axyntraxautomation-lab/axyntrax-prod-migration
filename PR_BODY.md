# 🚀 Reorg: Reorganización, Mitigación de Seguridad y Pruebas Visuales

## Resumen de cambios
- 📁 Reorganización y documentación de la arquitectura de la infraestructura en `/docs`.
- 🛑 Eliminación segura de `env_output.txt` y actualización del archivo `.gitignore` para bloquear filtraciones futuras.
- 🧪 Implementación de la suite de pruebas visuales con Playwright + evidencias (capturas de pantalla, video recorded) en `visual-tests/visual_test_results/`.
- 🔧 Corrección de la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` en `.env.prod`.
- 💾 Copias de seguridad completadas en: `backups/env_backup_20260509.env` y `backups/axyntrax_20260509_pre_reorg.db`.
- 🏷️ Tag de archivado inmutable: `archive-reorg-20260509`.
- 🚀 Pruebas de integración del ecosistema: `test_ecosistema.py` -> **100% OK (5/5 tests)**.
- 📸 Pruebas visuales locales de Playwright -> **100% OK (Carga, Chat e Interacción sin errores)**.

## Acciones OBLIGATORIAS previas al merge (no proceder sin confirmar)
- [ ] **Rotación de Secretos Expuestos:** Regenerar el `WHATSAPP_TOKEN` en Meta, el `SUPABASE_SERVICE_ROLE_KEY` en Supabase, y revocar los PATs de GitHub antiguos expuestos.
- [ ] **Configuración en Vercel:** Actualizar las variables de entorno en Vercel (renombrar typo a `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] **Facturación de Google Cloud:** Validar que la cuenta de facturación esté activa y vinculada al proyecto de GCP con APIs habilitadas.
- [ ] **Aprobación de Integración:** CI en verde y Preview Deploy en Vercel con manual de pruebas de humo OK.
- [ ] **Visto Bueno Técnico:** Obtener aprobación de YARVIS/JARVIS.

## Evidencias y Artefactos
- **Resultados de Playwright:** `visual-tests/visual_test_results/` (contiene `summary.json`, pantallazos de carga y el video `.webm`).
- **Guías Operativas:** `/docs/operational_guide.md`, `/docs/archived_items.md`, `/docs/owners.md`.

## Lista de verificación posterior a la fusión
- [ ] Monitoreo activo de logs en tiempo real (`logs/orchestrator.log`) durante 30-60 minutos en producción.
- [ ] Confirmación de que el dashboard de producción responde con latencia mínima y sin errores 5xx.
- [ ] Validación de roles en `/docs/owners.md`.
