import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createVoiceTable() {
  console.log('--- CREANDO TABLA VOICE_CALLS ---');
  
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS voice_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointmentId TEXT,
        phone TEXT,
        clientName TEXT,
        script TEXT,
        status TEXT,
        timestamp TIMESTAMPTZ DEFAULT now()
      );
    `
  });

  if (error) {
    // If RPC fails (not enabled), we assume table should be created manually or via dashboard.
    // But usually we can just insert and Supabase might handle it if it's auto-schema, 
    // but better to try a direct SQL or just notify.
    console.log('Nota: No se pudo ejecutar SQL vía RPC. Asegúrate de que la tabla voice_calls exista.');
    console.error(error);
  } else {
    console.log('Tabla voice_calls verificada/creada con éxito.');
  }
}

createVoiceTable();
