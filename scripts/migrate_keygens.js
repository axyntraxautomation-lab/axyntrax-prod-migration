import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function migrateKeygens() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL no está definida.');
    process.exit(1);
  }

  const connStr = process.env.DATABASE_URL.split('?')[0];
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL.');

    // 1. Obtener todas las llaves existentes
    const res = await client.query('SELECT id, key FROM public.keygens;');
    console.log(`Encontradas ${res.rows.length} licencias en la tabla.`);

    let migradas = 0;
    for (const row of res.rows) {
      const originalKey = row.key;
      
      // Comprobar si ya es un hash SHA-256 (64 caracteres hexadecimales)
      const isHashed = /^[0-9a-fA-F]{64}$/.test(originalKey);
      
      if (!isHashed) {
        const hashedKey = crypto.createHash('sha256').update(originalKey).digest('hex');
        console.log(`Migrando key ID ${row.id}: [${originalKey}] -> [${hashedKey}]`);
        
        await client.query('UPDATE public.keygens SET key = $1 WHERE id = $2;', [hashedKey, row.id]);
        migradas++;
      } else {
        console.log(`ID ${row.id} ya se encuentra hasheado [SHA-256].`);
      }
    }

    console.log(`✅ Migración completada de forma exitosa. Total de claves actualizadas: ${migradas}`);

  } catch (err) {
    console.error('❌ Error durante la migración:', err.message);
  } finally {
    await client.end();
    console.log('Conexión cerrada.');
  }
}

migrateKeygens();
