# wa-worker — Deploy en Reserved VM

El `wa-worker` mantiene sesiones WebSocket persistentes con WhatsApp (Baileys).
Esto **incompatibiliza** un deploy autoscale (que apaga instancias y rota
contenedores). Por eso `wa-worker` se publica por separado en una **Reserved VM**.

> El bloque `[deployment]` en el `.replit` raíz corresponde al `api-server`
> (autoscale), no a este worker. No editar ese bloque para cambiar el target
> global del repo.

## Por qué Reserved VM

- Sesiones Baileys se basan en un WebSocket **continuo**. Si el contenedor se
  apaga, WhatsApp marca el dispositivo como desconectado y exige re-vincular.
- Los archivos cifrados de auth-state se cachean en disco local (`/tmp`) y se
  sincronizan a Supabase Storage; un autoscale con disco efímero pierde la
  caché entre warm/cold starts.
- El watcher de alertas críticas (`startAlertasWatcher`) hace polling cada 5s
  y debe quedar siempre activo.

## Costo estimado

- **Reserved VM 0.5 vCPU / 1 GB RAM** ≈ **USD 6/mes** (suficiente para varios
  cientos de tenants en mock; con Baileys real estimar 1 GB / 100 sesiones
  concurrentes).
- Storage Supabase para credenciales: <100 KB por tenant, despreciable.

## Pasos de publicación

1. En el panel **Deployments** de Replit, crear un nuevo Reserved VM
   apuntando al directorio `artifacts/wa-worker`.
2. Build command:
   ```
   pnpm install --frozen-lockfile && pnpm --filter @workspace/wa-worker run build
   ```
3. Run command:
   ```
   pnpm --filter @workspace/wa-worker run start
   ```
4. Variables de entorno mínimas en producción:
   - `PORT` (Replit lo inyecta)
   - `SESSION_SECRET` (compartido con api-server, deriva el internal token)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (acceso a Storage + tablas)
   - `WA_WORKER_MOCK=false` (en prod usa Baileys real)
   - `API_SERVER_INTERNAL_URL=https://<api-server-domain>` (URL pública del
     api-server publicado)
5. Healthcheck path: `GET /healthz`.
6. Habilitar **Always On**.

## Boot-time rehydration

`src/index.ts` invoca `restoreActiveSessions()` después de `listen`. Lee
`tenant_whatsapp_sessions` con `status in ('conectado','qr_pendiente')` y
re-arranca cada sesión, descargando credenciales cifradas desde Storage.
Una caída de la VM se recupera sola al levantar.

## Internal token

El `api-server` y el `wa-worker` derivan el mismo token con
`sha256(SESSION_SECRET || 'wa-worker')`. Ambos servicios deben tener idéntico
`SESSION_SECRET`. No subir el token en variables explícitas; usar
`WA_WORKER_INTERNAL_TOKEN` sólo si quieres rotarlo manualmente.
