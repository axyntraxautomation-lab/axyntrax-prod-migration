import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  const { data, error } = await supabase
    .from('demo_registrations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error accediendo a demo_registrations:', error.message);
    // Intentamos listar por rpc si existe
    const { data: tables, error: tableError } = await supabase.rpc('get_tables');
    if (tableError) console.error('Error listando tablas:', tableError.message);
    else console.log('Tablas:', tables);
  } else {
    console.log('Tabla demo_registrations existe. Data:', data);
  }
}

listTables().catch(console.error);
