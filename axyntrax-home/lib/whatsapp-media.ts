/**
 * WHATSAPP MEDIA UTILITY
 * Handles uploading files to Meta Graph API and sending documents.
 */

export async function uploadToMeta(buffer: Buffer, fileName: string): Promise<string | null> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WSP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.WSP_ACCESS_TOKEN;

  if (!phoneId || !accessToken) return null;

  try {
    const formData = new FormData();
    const blob = new Blob([buffer as any], { type: 'application/pdf' });
    formData.append('file', blob, fileName);
    formData.append('type', 'application/pdf');
    formData.append('messaging_product', 'whatsapp');

    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error('Error uploading to Meta:', error);
    return null;
  }
}

export async function sendWhatsAppDocument(to: string, mediaId: string, fileName: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WSP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.WSP_ACCESS_TOKEN;

  if (!phoneId || !accessToken) return;

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'document',
        document: {
          id: mediaId,
          filename: fileName,
        },
      }),
    });
  } catch (error) {
    console.error('Error sending WhatsApp document:', error);
  }
}
export async function sendWhatsAppMessage(to: string, message: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WSP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.WSP_ACCESS_TOKEN;

  if (!phoneId || !accessToken) return;

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      }),
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}
