const axios = require('axios');
const GRAPH = 'https://graph.facebook.com/v19.0';
async function sendWhatsApp(to, text) {
  await axios.post(GRAPH+'/'+process.env.WHATSAPP_PHONE_NUMBER_ID+'/messages',
    { messaging_product:'whatsapp', to, type:'text', text:{body:text} },
    { headers:{ Authorization:'Bearer '+process.env.META_ACCESS_TOKEN, 'Content-Type':'application/json' } });
}
async function sendMetaMsg(recipientId, text) {
  await axios.post(GRAPH+'/me/messages',
    { recipient:{id:recipientId}, message:{text} },
    { headers:{ Authorization:'Bearer '+process.env.META_PAGE_ACCESS_TOKEN, 'Content-Type':'application/json' } });
}
module.exports = { sendWhatsApp, sendMetaMsg };
