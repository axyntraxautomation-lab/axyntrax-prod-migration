const crypto = require('crypto');
module.exports = function verifyMeta(req, res, next) {
  if (Buffer.isBuffer(req.body)) { try { req.parsedBody = JSON.parse(req.body.toString()); } catch(e) { req.parsedBody = {}; } }
  else { req.parsedBody = req.body || {}; }
  if (!process.env.META_APP_SECRET) { req.body = req.parsedBody; return next(); }
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return res.sendStatus(403);
  const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET).update(rawBuf).digest('hex');
  if (sig !== expected) return res.sendStatus(403);
  req.body = req.parsedBody;
  next();
};
