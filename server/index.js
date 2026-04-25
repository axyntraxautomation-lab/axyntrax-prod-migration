require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/facebook', require('./routes/facebook'));
app.use('/api/instagram', require('./routes/instagram'));

app.get('/', (req, res) => {
  res.json({ app: 'AXYNTRAX CECILIA v3', status: 'ONLINE', ts: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('AXYNTRAX CECILIA PORT=' + PORT);
  console.log('rawBody fix: ACTIVO');
});
module.exports = app;
