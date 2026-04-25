const crypto = require('crypto');
module.exports = function verifyMeta(req, res, next) {
  if (!process.env.META_APP_SECRET) return next();
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return res.sendStatus(403);
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody).digest('hex');
  if (sig !== expected) return res.sendStatus(403);
  next();
};
