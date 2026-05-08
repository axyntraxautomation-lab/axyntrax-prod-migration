/* api/test-google.js
   Prueba Gmail + Calendar (OAuth2 refresh token).
   Vercel: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN, JARVIS_KEY
*/
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const key = String(req.query?.key ?? '').trim();
  const JARVIS_KEY = String(process.env.JARVIS_KEY || '').trim();
  if (!JARVIS_KEY || key !== JARVIS_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const CLIENT_ID = process.env.GOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !REDIRECT_URI) {
    console.error('[test-google] Faltan variables de Google en el entorno');
    return res.status(500).json({ ok: false, error: 'config_missing' });
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  try {
    const accessTokenRes = await oauth2Client.getAccessToken();
    const accessToken = accessTokenRes?.token || accessTokenRes;

    const gmailUser = String(process.env.GOOGLE_GMAIL_USER || 'axyntraxautomation@gmail.com').trim();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailUser,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken
      }
    });

    const mailInfo = await transporter.sendMail({
      from: `Axyntrax Automation <${gmailUser}>`,
      to: gmailUser,
      subject: '🤖 JARVIS: SISTEMA ACTIVADO (Prueba)',
      text: 'Capitán, los sistemas de Gmail y Calendar están sincronizados. Quedo a sus órdenes.',
      html:
        '<p>Capitán, los sistemas de <b>Gmail</b> y <b>Calendar</b> están sincronizados. Quedo a sus órdenes.</p>'
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 75 * 60 * 1000).toISOString();

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'JARVIS SYNC TEST',
        description: 'Evento de verificación automática creado por JARVIS',
        start: { dateTime: start },
        end: { dateTime: end }
      }
    });

    return res.status(200).json({
      ok: true,
      mail: { accepted: mailInfo.accepted || [], messageId: mailInfo.messageId },
      event: { id: event.data.id, htmlLink: event.data.htmlLink }
    });
  } catch (err) {
    console.error('[test-google]', err?.response?.data || err.message || err);
    return res.status(502).json({
      ok: false,
      error: 'google_error',
      detail: err?.message || String(err)
    });
  }
};
