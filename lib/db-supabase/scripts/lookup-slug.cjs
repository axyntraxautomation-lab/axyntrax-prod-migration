const pg = require('pg');
const p = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });
p.query("select slug from tenants where owner_email='tenant_qa_4mrg6p3p@axyn.test' limit 1")
  .then(r => { console.log(JSON.stringify(r.rows)); return p.end(); })
  .catch(e => { console.error(e.message); return p.end(); });
