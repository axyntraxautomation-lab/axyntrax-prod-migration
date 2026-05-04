require('dotenv').config();
const express = require('express');
const app = express();

// Routes
app.use('/api/whatsapp', express.raw({ type: 'application/json' }), require('./routes/whatsapp'));
app.use('/api/facebook', express.raw({ type: 'application/json' }), require('./routes/facebook'));
app.use('/api/instagram', express.raw({ type: 'application/json' }), require('./routes/instagram'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registration endpoint (matching the landing page)
app.post('/api/registro-demo', async (req, res) => {
  const { nombre, whatsapp, email, empresa, rubro } = req.body;
  console.log(`[Registro] Nueva solicitud: ${nombre} de ${empresa} (${rubro})`);
  // Simulación exitosa para el test masivo
  res.status(200).json({ status: 'ok', message: 'Cuenta creada + email de bienvenida enviado (Simulado)' });
});

app.get('/', (req, res) => res.json({ 
  app: 'AXYNTRAX CECILIA v3', 
  status: 'ONLINE', 
  rawBody: 'express.raw ACTIVO', 
  verify_token: process.env.META_VERIFY_TOKEN, 
  secrets: { 
    META_ACCESS_TOKEN: !!process.env.META_ACCESS_TOKEN, 
    META_VERIFY_TOKEN: !!process.env.META_VERIFY_TOKEN, 
    META_APP_SECRET: !!process.env.META_APP_SECRET, 
    WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID, 
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY 
  } 
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { 
  console.log('AXYNTRAX CECILIA PORT=' + PORT); 
});

module.exports = app;
