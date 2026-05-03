module.exports = (req, res) => {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  if (req.method === 'POST') {
    console.log('Mensaje:', JSON.stringify(req.body));
    return res.sendStatus(200);
  }
  res.sendStatus(405);
};
