const { createClient } = require('@supabase/supabase-js');
let db = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}
async function upsertClient(data) {
  if (!db) return { id:'local', ...data };
  const campo = data.telefono ? 'telefono' : data.psid_fb ? 'psid_fb' : 'igsid';
  const { data:ex } = await db.from('clients').select('*').eq(campo, data[campo]).maybeSingle();
  if (ex) return ex;
  const { data:nuevo } = await db.from('clients').insert({ [campo]:data[campo], canal_origen:data.canal }).select().single();
  return nuevo || { id:'error', ...data };
}
async function saveMsg(data) { if (db) await db.from('conversations').insert(data); }
module.exports = { upsertClient, saveMsg };
