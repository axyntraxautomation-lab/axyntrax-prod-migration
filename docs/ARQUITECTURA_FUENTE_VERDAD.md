# AXYNTRAX — Fuente de verdad deploy (2026-05-16)

## Superficie Vercel (única)

Definida en `vercel.json` + `.vercelignore` (legacy excluido del upload).

| Archivo / carpeta | Rol |
|-------------------|-----|
| `index.html` | Landing |
| `registro.html` | Activación / demo |
| `faq.html`, `nosotros.html`, `politicas-de-privacidad.html` | Páginas satélite |
| `assets/**` | Estáticos + `axyntrax-config.json` |
| `cecilia-widget.js` | Chat web |
| `api/webhook.py` | Cecilia chat + WhatsApp |
| `requirements.txt` | Deps Python |

**Legacy en disco (no deploy):** `axyntrax-home/`, `artifacts/`, `studio/`, `suite_diamante/`, `frontend/`, `cecilia/`, `backups/`, etc.

## Verdad comercial

| Campo | Valor |
|-------|--------|
| Demo | 45 días |
| Starter | S/199 |
| Pro Cloud | S/399 |
| Diamante | S/799 |
| CTA | **SOLICITAR ACTIVACIÓN** |

JSON: `assets/axyntrax-config.json` · Constantes: `api/webhook.py`

## Cecilia

- `POST /api/cecilia/chat` · timeout 10 s · fallback comercial (sin errores técnicos al usuario).

## Variables Vercel

`DEEPSEEK_API_KEY`, `WSP_ACCESS_TOKEN` / `WHATSAPP_TOKEN`, `WSP_PHONE_NUMBER_ID`, `META_VERIFY_TOKEN` (default `Axyntrax_2026_Secure`).

## Build local

```bash
python -m py_compile api/webhook.py
```

## Validación producción (pendiente visual)

- [ ] Solo 5 HTML públicos + assets
- [ ] `#planes` → 199 / 399 / 799
- [ ] CTAs → SOLICITAR ACTIVACIÓN
- [ ] Chat Cecilia sin mensajes técnicos
