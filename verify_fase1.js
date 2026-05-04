import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

async function verify() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const ads = await client.query('SELECT count(*) FROM public.jarvis_ads');
    const clients = await client.query('SELECT count(*) FROM public.clients');
    const admin = await client.query("SELECT name, email, role FROM public.users WHERE email = 'axyntraxautomation@gmail.com'");
    
    console.log('--- LOGS DE VERIFICACIÓN FASE 1 ---');
    console.log(`[DATA] jarvis_ads: ${ads.rows[0].count}`);
    console.log(`[DATA] clients: ${clients.rows[0].count}`);
    if (admin.rows.length > 0) {
      console.log(`[AUTH] Admin: ${admin.rows[0].name} (${admin.rows[0].email}) - Role: ${admin.rows[0].role}`);
    } else {
      console.log('[AUTH] Admin no encontrado en la base de datos!');
    }
    console.log('-----------------------------------');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

verify();
