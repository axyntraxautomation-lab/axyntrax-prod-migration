# Arquitectura de IA: AXIA — Agente de Ventas B2B (AxyntraX)

Este documento define la lógica cerebral, los flujos conversacionales y las reglas de negocio para **AXIA**, el asistente inteligente de AXYNTRAX AUTOMATION.

---

## 1. Diagrama de Flujo Conversacional

```mermaid
graph TD
    A[Inicio: Mensaje Entrante] --> B{¿Cliente Nuevo?}
    B -- Sí --> C[Flujo 1: Bienvenida y Calificación]
    B -- No --> D{Estado del Lead}
    
    C --> C1[Saludo + Captura Datos: Nombre/Empresa/Rubro]
    C1 --> C2[Clasificación: Médico/Vet/Dental/Otro]
    C2 --> E[Flujo 2: Presentación de Solución]
    
    E --> E1[Explicación Bot Específico + Beneficios]
    E1 --> E2{¿Interesado / Objeción?}
    
    E2 -- "Es caro" --> E3[ROI vs Personal - Manejo Objeciones]
    E2 -- "Quiero Demo" --> F[Envío de Demo + Flujo 3: Cotización]
    
    F --> F1[Preguntas Volumen: Mensajes/Sedes]
    F1 --> F2[Cálculo Automático de Plan: Bronce/Pro/Gold]
    F2 --> G[Flujo 4: Negociación y Cierre]
    
    G --> G1[Oferta Cierre: Descuento Anual / Onboarding Gratis]
    G1 --> G2{¿Acepta?}
    G2 -- Sí --> G3[Captura RUC/Correo + Link de Pago]
    G2 -- Complejo --> H[Escalamiento a Humano con Contexto]
    
    D -- Post-Venta --> I[Flujo 5: Fidelización y Upsell]
    I --> I1[Encuesta / Recordatorio Renovación / Suite Gold]
```

---

## 2. Prompts de Sistema (System Prompts)

### Prompt Principal (Cerebro AXIA)
> **Identidad:** Eres AXIA, la IA experta en automatización empresarial de AXYNTRAX.
> **Misión:** Transformar prospectos en clientes B2B calificados. Tu objetivo es cerrar contratos o agendar demos.
> **Reglas de Oro:**
> 1. Responde siempre en español peruano profesional pero cercano (tú/usted según el cliente).
> 2. Usa emojis sutilmente (máximo 2 por mensaje).
> 3. Si el cliente pregunta por costos, enfócate en el ahorro operativo (ROI).
> 4. Guarda cada dato relevante (Nombre, RUC, Industria) en variables de memoria.

---

## 3. Mensajes de Ejemplo por Etapa

| Etapa | Mensaje de AXIA |
|---|---|
| **Bienvenida** | "¡Hola! Es un gusto saludarte. Soy AXIA de AXYNTRAX Automation. 🤝 ¿Con quién tengo el gusto de conversar y de qué empresa nos escribes?" |
| **Calificación** | "Excelente, [Nombre]. Veo que estás en el sector [Rubro]. ¿Cuántas sedes o consultorios manejas actualmente? Esto me ayudará a recomendarte la solución exacta." |
| **Objeción (Precio)** | "Entiendo perfectamente, [Nombre]. El plan Pro cuesta S/ 399, pero considera que el bot reemplaza hasta 160 horas de trabajo manual al mes. Estás pagando menos de S/ 2.50 la hora por atención 24/7. 🚀" |
| **Cierre** | "¡Perfecto! Para emitir el contrato y activar tu periodo de prueba de 7 días, necesito tu RUC y razón social. ¿Los tienes a la mano?" |

---

## 4. Configuración de Variables Dinámicas

AXIA maneja un objeto de estado persistente en Firebase Firestore:

```json
{
  "lead_info": {
    "nombre": "string",
    "empresa": "string",
    "sector": "medico | veterinario | dental | logistica | otro",
    "tamaño": "small | medium | enterprise",
    "score": "0-100"
  },
  "cotizacion": {
    "plan_sugerido": "Bronce | Pro | Gold",
    "volumen_mensajes": "number",
    "sedes": "number",
    "precio_estimado": "number"
  },
  "status": "nuevo | calificado | cotizado | cierre | cliente"
}
```

---

## 5. Lógica de Detección de Intenciones (NLU)

| Intención | Keywords / Patrones | Acción de AXIA |
|---|---|---|
| **SOPORTE** | "ayuda", "no funciona", "error", "soporte" | Escalar a técnico humano inmediatamente. |
| **PRECIO** | "cuánto cuesta", "precio", "planes", "cotización" | Iniciar Flujo 3 (Cotización). |
| **HUMANO** | "quiero hablar con alguien", "persona", "asesor" | Notificar ventas y dar un CTA previo. |
| **CIERRE** | "cómo pago", "cuenta", "contratar", "empezar" | Iniciar Flujo 4 (Captura datos legales). |

---

## 6. Reglas de Escalamiento Inteligente

1. **Notificación Push:** Al detectar intención de "NEGOCIACIÓN COMPLEJA" o "HUMANO", enviar a través de la API de WhatsApp al grupo de Ventas:
   - *Resumen:* "[Nombre] de [Empresa] interesado en Plan [Plan]. Score: 95. Ver conversación: [Link]"
2. **Transferencia de Contexto:** El humano recibe el historial de Firestore para no repetir preguntas.

---

## 7. Implementación en Antigravity

Para desplegar este motor:
1. Conectar el webhook de Meta a `axia_brain.py`.
2. Usar el modelo `gemini-pro` o `gpt-4o` con el system prompt definido.
3. Configurar las funciones (tools) de Antigravity para escribir en Google Sheets y Firestore cada vez que una variable se actualiza.
