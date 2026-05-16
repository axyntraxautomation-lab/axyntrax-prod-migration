/**
 * META INTEGRATION LAYER (v1.0)
 * Unified delivery methods for WhatsApp, Messenger, and Instagram.
 */

const META_VERSION = 'v19.0';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

async function callMetaApi(endpoint: string, payload: any) {
  const url = `https://graph.facebook.com/${META_VERSION}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(`[META_API_ERROR] ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Envía un mensaje vía Facebook Messenger
 */
export async function sendMessengerMessage(recipientId: string, text: string) {
  const payload = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: "RESPONSE"
  };
  return callMetaApi('me/messages', payload);
}

/**
 * Envía un mensaje vía Instagram Business
 */
export async function sendInstagramMessage(recipientId: string, text: string) {
  const payload = {
    recipient: { id: recipientId },
    message: { text }
  };
  return callMetaApi('me/messages', payload);
}

/**
 * Envía un mensaje vía WhatsApp Business
 */
export async function sendWhatsAppMessage(phoneId: string, to: string, text: string) {
  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: text }
  };
  return callMetaApi(`${phoneId}/messages`, payload);
}
