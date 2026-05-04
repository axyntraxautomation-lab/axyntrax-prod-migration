const express = require('express');
const app = express();
app.use(express.json());

// Webhook endpoint
app.all('/api/webhook', (req, res) => {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === 'robotcito') {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }
  if (req.method === 'POST') {
    console.log('Webhook received:', req.body);
    return res.status(200).send('OK');
  }
  res.status(405).send('Method Not Allowed');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', system: 'Axyntrax API' });
});

// Root handler
app.get('/api', (req, res) => {
  res.send('Axyntrax API is running');
});

module.exports = app;
