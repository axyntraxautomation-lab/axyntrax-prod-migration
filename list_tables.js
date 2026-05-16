import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables_names'); // If exists
  if (error) {
    // Fallback: Query pg_catalog via SQL RPC
    const { data: sqlData, error: sqlErr } = await supabase.rpc('exec_sql', { 
      query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" 
    });
    if (sqlErr) {
      console.error('No se pudo listar tablas:', sqlErr.message);
    } else {
      console.log('Tablas en public:', sqlData);
    }
  } else {
    console.log('Tablas:', data);
  }
}

listTables();
