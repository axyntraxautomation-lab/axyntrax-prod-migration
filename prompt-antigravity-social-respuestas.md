# Prompt para Antigravity — Automatización de Respuestas en WhatsApp, Facebook e Instagram

---

## Contexto general

Necesito que configures un sistema de respuestas automáticas o semiautomáticas para los mensajes entrantes en los siguientes canales:

- **WhatsApp** (ya sea WhatsApp Business API o WhatsApp Business App)
- **Facebook Messenger** (mensajes directos de una Página de Facebook)
- **Instagram Direct** (mensajes directos de una cuenta de Instagram profesional)

El objetivo es que ningún mensaje quede sin respuesta, reducir los tiempos de atención y centralizar la gestión.

---

## Información que necesito que determines / investigues

Por favor averigua y documenta lo siguiente para cada canal:

### 1. Credenciales y accesos necesarios

- ¿Qué cuentas, páginas o perfiles están involucrados?
- ¿Cuáles son los números de teléfono, IDs de página, o IDs de cuenta de Instagram que se usarán?
- ¿Tenemos acceso de administrador a la Página de Facebook y a la cuenta de Instagram vinculada?
- ¿Existe una cuenta de Meta Business Suite activa?
- ¿Tenemos acceso a WhatsApp Business App o a la WhatsApp Business API (a través de un proveedor como Twilio, 360dialog, Meta directamente, etc.)?

### 2. Estado actual de las integraciones

- ¿Facebook e Instagram ya están conectados en Meta Business Suite?
- ¿Hay algún CRM, helpdesk o herramienta (ManyChat, Zendesk, HubSpot, Respond.io, Tidio, etc.) ya instalado o en uso?
- ¿Se están usando respuestas automáticas nativas de Meta (Instant Reply, Away Messages)?
- ¿Existe algún bot activo o flujo de automatización previo?

### 3. Volumen y tipo de mensajes

- ¿Cuántos mensajes aproximados se reciben por día/semana en cada canal?
- ¿Qué tipo de consultas son las más frecuentes? (precios, horarios, soporte, pedidos, etc.)
- ¿Se requiere atención humana en algún punto del flujo, o puede ser 100% automático?
- ¿Se necesita soporte en un solo idioma o en varios?

### 4. Requisitos de la solución

- ¿Se necesita una bandeja unificada para ver todos los mensajes en un solo lugar?
- ¿Debe existir un paso de escalado a un agente humano cuando el bot no pueda responder?
- ¿Se requiere registro/historial de conversaciones?
- ¿Se necesita integración con algún sistema externo (base de datos de clientes, inventario, sistema de reservas, etc.)?

---

## Solución a implementar (una vez recopilada la información)

Con los datos anteriores, configura o propón una de las siguientes opciones según lo que aplique:

### Opción A — Respuestas automáticas nativas de Meta (sin costo, configuración básica)
- Activar **Instant Reply** en Facebook Messenger e Instagram Direct desde Meta Business Suite.
- Configurar mensajes de bienvenida y mensajes fuera de horario.
- Activar preguntas frecuentes (FAQs) en el menú de Messenger.

### Opción B — Bot conversacional con herramienta de terceros (ManyChat, Respond.io, etc.)
- Conectar la Página de Facebook y la cuenta de Instagram a la herramienta elegida.
- Construir un flujo básico de respuesta automática con derivación a humano.
- Integrar WhatsApp Business si la herramienta lo soporta.

### Opción C — WhatsApp Business API + integración personalizada
- Solicitar acceso a la WhatsApp Business API a través de un proveedor (Twilio, 360dialog, Meta Cloud API).
- Configurar webhooks para recibir mensajes entrantes.
- Conectar a un backend o CRM para gestionar las respuestas.

---

## Pasos específicos que debo pedirte que ejecutes

1. **Audita el estado actual** de las cuentas de Facebook, Instagram y WhatsApp.
2. **Identifica los bloqueos**: ¿hay algo que impida conectar los canales? (verificación pendiente, permisos faltantes, cuenta no profesional, etc.)
3. **Configura la solución más adecuada** según el volumen, presupuesto y requisitos técnicos.
4. **Prueba el flujo** enviando un mensaje de prueba en cada canal y verificando que la respuesta automática funcione.
5. **Documenta** los pasos realizados, las credenciales usadas (de forma segura) y cómo hacer cambios futuros.

---

## Resultado esperado

Al finalizar, quiero tener:

- [ ] WhatsApp respondiendo automáticamente a mensajes entrantes (al menos con un mensaje de bienvenida y menú de opciones).
- [ ] Facebook Messenger con respuesta automática activa y flujo básico de atención.
- [ ] Instagram Direct con respuesta automática activa.
- [ ] Una bandeja unificada (o instrucciones para acceder a los mensajes desde un solo lugar).
- [ ] Documentación de qué se configuró y cómo modificarlo en el futuro.

---

## Notas adicionales

- Si algún canal no puede automatizarse sin costo adicional, indícalo claramente con las opciones disponibles y sus precios aproximados.
- Si se necesita verificación de negocio en Meta, explica el proceso paso a paso.
- Prioriza soluciones que no requieran código si el equipo es no técnico.
