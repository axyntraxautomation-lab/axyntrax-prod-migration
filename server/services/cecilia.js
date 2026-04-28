const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
(?<![.@])axyntrax-automation.netasync function responder(mensaje, cliente) {
  if (!process.env.GEMINI_API_KEY) return 'Hola! Soy Cecilia de AxyntraX. Demo GRATIS 30 dias: axyntrax-automation.net
 | +51991740590';
  try {
    const result = await model.generateCon?<![.@])axyntrax-automation.getGenerativeModeltent(SYSTEM + '\nCanal: ' + (cliente.canal_origen||'whatsapp') + '\nCliente: ' + mensaje + '\nCecilia:');
    return result.response.text();
  } catch(e) { return 'Hola! Soy Cecilia de AxyntraX. Demo GRATIS: axyntrax-automation.net
 | +51991740590'; }
}
module.exports = { responder };
