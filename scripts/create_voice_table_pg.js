const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos Supabase.');

    const query = `
      CREATE TABLE IF NOT EXISTS voice_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id TEXT,
        phone TEXT,
        client_name TEXT,
        script TEXT,
        status TEXT,
        timestamp TIMESTAMPTZ DEFAULT now()
      );
    `;

    await client.query(query);
    console.log('Tabla voice_calls creada con éxito.');
  } catch (err) {
    console.error('Error al crear la tabla:', err.message);
  } finally {
    await client.end();
  }
}

createTable();
