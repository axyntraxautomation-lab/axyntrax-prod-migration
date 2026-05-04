import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function testAuth() {
  const connStr = process.env.DATABASE_URL.split('?')[0]; // Remove query params
  const pool = new Pool({ 
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Probando conexión DATABASE_URL -> Supabase (No params, SSL skip)...');
  try {
    const res = await pool.query("SELECT id, name, email, role FROM users WHERE email = 'axyntraxautomation@gmail.com'");
    if (res.rows.length > 0) {
      console.log('✅ Éxito: Usuario admin encontrado en la tabla users migrada.');
      console.log('Datos:', res.rows[0]);
    } else {
      console.log('❌ Error: No se encontró el usuario admin.');
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  } finally {
    await pool.end();
  }
}

testAuth();
