import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function createKeygensTable() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno.');
    process.exit(1);
  }

  const connStr = process.env.DATABASE_URL.split('?')[0]; // Remove query params
  console.log('Conectando a la base de datos PostgreSQL de Supabase...');
  
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida.');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.keygens (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        rubro TEXT NOT NULL,
        plan TEXT NOT NULL,
        submodulos TEXT,
        empresa TEXT DEFAULT 'Sin registrar',
        contacto TEXT DEFAULT '',
        estado TEXT DEFAULT 'ACTIVO',
        expiry_date TIMESTAMP WITH TIME ZONE,
        activaciones INTEGER DEFAULT 0,
        max_activaciones INTEGER DEFAULT 1,
        last_machine TEXT,
        last_activation TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ Tabla "keygens" creada o ya existente de manera exitosa.');

    // Verificar estructura
    const res = await client.query("SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.columns WHERE table_name = 'keygens';");
    console.log('Estructura de la tabla "keygens":');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

  } catch (err) {
    console.error('❌ Error ejecutando la operación:', err.message);
  } finally {
    await client.end();
    console.log('Conexión cerrada.');
  }
}

createKeygensTable();
