# Flujo de Automatización AxyntraX — IA & WhatsApp

Este documento detalla el flujo lógico desde que un cliente entra a la web hasta que es calificado por la IA.

## 1. Captura en la Web
- **Punto de Entrada:** Formulario en la sección `#leads`.
- **Acción:** El cliente ingresa Nombre, WhatsApp, Sector y Necesidad.
- **Proceso:** 
    1. Datos enviados a `capture-lead.js` (Netlify Function).
    2. Guardado persistente en **Supabase** (Tabla `leads`).
    3. Redirección automática a WhatsApp con mensaje estructurado.

## 2. Recepción en WhatsApp
- El cliente envía el mensaje pre-armado: *"Hola AxyntraX! Mi nombre es [Nombre]..."*.
- **IA (AXIA) toma el control:**
    - Detecta el sector del cliente.
    - Envía mensaje de bienvenida personalizado.
    - Realiza 3 preguntas de calificación:
        1. *"¿Cuál es el volumen actual de clientes que manejas?"*
        2. *"¿Qué proceso te quita más tiempo hoy (citas, cobros, soporte)?"*
        3. *"¿Tienes algún sistema de gestión actual o usas Excel?"*

## 3. Calificación y Cierre
- **Score de Lead:** Según las respuestas, la IA asigna una prioridad.
- **Call to Action:**
    - **Lead Calificado:** IA ofrece link de Calendly para videollamada.
    - **Lead Informativo:** IA envía brochure PDF y video demo.
- **Notificación Admin:** Se envía un resumen al admin via WhatsApp: *"Nuevo lead calificado: [Nombre] - Sector: [Sector] - Dolor: [Dolor]"*.

## 4. Stack Tecnológico Sugerido
- **Frontend:** HTML/CSS/JS (Ya implementado).
- **Backend:** Netlify Functions (Node.js).
- **Base de Datos:** Supabase (PostgreSQL).
- **Orquestación IA:** 
    - **Opción A (Make.com):** Webhook WhatsApp → GPT-4 → WhatsApp.
    - **Opción B (Custom):** Node.js + WhatsApp Business API.

---
*Documentación generada para AxyntraX Automation Suite - 2026*
