import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY no está definida en .env');
    return;
  }
  console.log('🔑 Usando API Key:', apiKey.substring(0, 8) + '...');

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'];

  for (const modelName of models) {
    console.log(`🤖 Probando modelo: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hola, responde brevemente con la palabra "OK" si estás funcionando.');
      console.log(`✅ ¡ÉXITO con ${modelName}!:`, result.response.text().trim());
    } catch (err) {
      console.error(`❌ FALLÓ ${modelName}:`, err.message);
    }
  }
}

testGemini();
