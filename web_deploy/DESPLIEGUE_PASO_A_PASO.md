# Guía de Despliegue — AxyntraX Automation

Sigue estos pasos para activar la captura de leads en tu nueva web.

## Paso 1: Configurar Supabase (Base de Datos)
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra en tu proyecto y ve a la sección **SQL Editor** (icono `>_`).
3. Haz clic en **"New Query"**.
4. Copia y pega el contenido de `web_deploy/supabase_setup.sql`.
5. Dale a **Run**. Esto creará la tabla `leads`.
6. Ve a **Project Settings** (engranaje) -> **API**.
7. Copia estos dos valores:
    - `Project URL`
    - `anon public` (la clave API)

## Paso 2: Configurar Netlify (Servidor)
1. Ve a tu panel de [Netlify](https://app.netlify.com/).
2. Selecciona tu sitio `axyntrax-automation`.
3. Ve a **Site configuration** -> **Environment variables**.
4. Agrega estas dos variables:
    - **Key:** `SUPABASE_URL` | **Value:** (Pega la Project URL de Supabase)
    - **Key:** `SUPABASE_ANON_KEY` | **Value:** (Pega la clave anon de Supabase)
5. Haz un nuevo deploy de tu sitio (o simplemente guarda las variables y Netlify las tomará en el próximo cambio).

## Paso 3: Verificación
1. Abre tu web en vivo.
2. Llena el formulario de contacto.
3. Verifica en Supabase -> **Table Editor** -> `leads` que el dato aparezca.
4. Verifica que se abra WhatsApp con el mensaje correcto.

---
**¿Problemas?** Si al enviar el formulario recibes un error, asegúrate de que las variables en Netlify se llamen EXACTAMENTE `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
