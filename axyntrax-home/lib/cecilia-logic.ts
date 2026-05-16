import { CECILIA_CORPORATE_CONTEXT } from './cecilia-context';

/**
 * CECILIA NEURAL ENGINE v2.0
 * Con Calificación de Leads y Cross-selling Estratégico.
 */

export async function askCecilia(message: string, channel: 'wsp' | 'fb' | 'ig' | 'web' = 'web') {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: `${CECILIA_CORPORATE_CONTEXT}\n\n` +
              `*REGLAS DE ORO (ESTRICTAS):* \n` +
              `- PRIMER MENSAJE: Saluda y pregunta el nombre. NADA MÁS.\n` +
              `- SIGUIENTES MENSAJES: Máximo 2 párrafos cortos.\n` +
              `- Siempre menciona los 3 submódulos GRATIS.\n` +
              `- Precios con 18% IGV siempre.\n` +
              `- Deriva a www.axyntrax-automation.net.\n\n` +
              `*METADATA:* JSON_METADATA: {"temp": "HOT|WARM|COLD", "intent": "COMPRA|INFO|QUEJA", "cross_sell": "Sugerido", "resumen": "Breve"}`
          },
          { role: 'user', content: `[Canal: ${channel}] ${message}` }
        ],
        temperature: 0.6,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[DeepSeek Error] Status: ${response.status} ${response.statusText}`, errText);
      throw new Error(`DeepSeek API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) throw new Error('No response from DeepSeek');
    
    let fullContent = data.choices[0].message.content;

    // Extraer metadata estratégica
    const metadataMatch = fullContent.match(/JSON_METADATA: (.*)/);
    let metadata = null;
    let cleanContent = fullContent;

    if (metadataMatch) {
      try {
        metadata = JSON.parse(metadataMatch[1]);
        cleanContent = fullContent.replace(metadataMatch[0], '').trim();
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }

    return {
      reply: cleanContent,
      metadata: metadata
    };
  } catch (error) {
    console.error('Cecilia Neural Error:', error);
    return {
      reply: "Lo siento, mi conexión neural está experimentando una breve latencia. Por favor, intenta de nuevo en unos segundos.",
      metadata: null
    };
  }
}
