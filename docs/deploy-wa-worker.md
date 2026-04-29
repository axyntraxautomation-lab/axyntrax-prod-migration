# Deploy del wa-worker (Reserved VM) — paso a paso clicable

> Este documento es la versión tracked en git de la sección "Deploy
> wa-worker (separado)" del runbook completo de operaciones SaaS, que
> vive en `.local/tasks/runbook-saas-operacion.md` (working memory,
> gitignored). Aquí queda en `docs/` para que el equipo lo encuentre
> fácil y para que aparezca en code review.

El **wa-worker** (Baileys) NO se despliega con el botón "publish" del
workspace porque ese flujo solo cubre el deployment principal autoscale
(api-server + las 4 web apps). Baileys necesita una conexión websocket
persistente con WhatsApp y no puede correr en autoscale: si el proceso
muere, la sesión se pierde y hay que volver a escanear el QR. Por eso
requiere un segundo deployment tipo Reserved VM, siempre prendido. El
setup es manual, una sola vez, y toma ~5 minutos. Sin este paso, el
bot Cecilia NO atiende WhatsApp en producción aunque la web cargue
bien.

## Pasos en el panel de Replit

1. Abrir Replit → menú lateral **Deployments** → botón
   **"+ Create deployment"**.
2. Elegir tipo **Reserved VM**.
3. Tamaño: **0.5 vCPU / 1 GB RAM** (el más chico, ~USD 6/mes).
4. Nombre del deployment: `wa-worker`.
5. Run command (copiar tal cual):
   `pnpm --filter @workspace/wa-worker run start`
   - NO usar `dev`.
   - NO incluir las siguientes variables de entorno (son SOLO para
     desarrollo local; si se setean en producción el bot no conecta
     con WhatsApp real):
     - `WA_WORKER_MOCK`
     - `WA_WORKER_MOCK_CONNECT_DELAY_MS`
6. Variables de entorno (copiar desde el deployment principal autoscale,
   pestaña Settings → Environment, los mismos valores):
   - `SESSION_SECRET` — obligatoria (deriva el internal token).
   - `SUPABASE_URL` — obligatoria.
   - `SUPABASE_SERVICE_ROLE_KEY` — obligatoria.
   - `SUPABASE_DB_URL` — obligatoria (la cadena `postgresql://…`).
   - `API_SERVER_INTERNAL_URL=https://www.axyntrax-automation.net` —
     obligatoria (es la URL pública del api-server; el worker llama
     acá para preguntarle a Cecilia las respuestas).
   - `WA_WORKER_INTERNAL_TOKEN` — opcional (si no se setea, se deriva
     de `SESSION_SECRET`; setear solo si se quiere rotar sin tocar el
     secret).
   - `ENCRYPTION_KEY` — opcional (default cae a `SESSION_SECRET`).
   - `LOG_LEVEL=info` — opcional.
7. Click **Deploy** → esperar ~2 minutos al primer build.
8. Copiar la URL pública que devuelve el panel (algo como
   `https://wa-worker-axyntrax-miguel.replit.app`).
9. Volver al deployment principal (autoscale, el que tiene el dominio
   `www.axyntrax-automation.net`).
10. Settings → Environment → **agregar** una nueva variable:
    `WA_WORKER_BASE_URL=<URL del paso 8>`
    (es UNA sola variable, no dos — antes había `WA_WORKER_URL` y
    `WA_WORKER_BASE_URL` por separado, ya están unificadas en una
    sola desde la task #62).
11. Click **Redeploy** del deployment principal para que tome la nueva
    env.
12. Verificar que quedó OK:
    - En **logs** del deployment principal deben dejar de aparecer las
      líneas `[health-watcher] probe falló service="wa-worker"`.
    - Entrar a `https://www.axyntrax-automation.net/tenant/whatsapp`
      con una cuenta tenant. Debería aparecer el QR (si el tenant
      nunca escaneó) o el estado "Conectado" (si ya tenía sesión).
    - El banner amarillo "El servicio de WhatsApp está temporalmente
      offline…" NO debe aparecer.

## Notas

- Health check del Reserved VM: `GET /healthz` en puerto 8099 (el
  archivo `artifacts/wa-worker/.replit-artifact/artifact.toml` ya lo
  declara).
- El wa-worker NO se monta en el shared proxy público: el api-server
  lo llama directo vía `WA_WORKER_BASE_URL`. Por eso no necesita un
  dominio custom y la URL `*.replit.app` que da el panel está bien.
- Si la integración Drive todavía no está conectada, eso es
  independiente y se resuelve aparte (ver task #58 en el panel de
  tasks). Sin Drive el backup nightly se queda en estado
  `drive_not_configured` pero el bot WhatsApp funciona igual.

## Lectura rápida del estado en producción

- Endpoint público (cliente tenant logueado):
  `GET /api/tenant/whatsapp/estado` — incluye `workerOnline: bool`.
- Si `workerOnline === false` el frontend en `/tenant/whatsapp`
  renderiza un banner amarillo con `data-testid="wa-worker-offline"`.
- Si el cliente intenta `POST /api/tenant/whatsapp/sesion/iniciar`
  mientras el worker está offline, recibe HTTP 503 con body
  `{ error: "...", code: "wa_worker_offline" }`.
- Logs del api-server: `wa-worker call returned 5xx` y
  `wa-worker call failed` incluyen el `baseUrl` para diagnóstico
  rápido de URL mal apuntada.
