import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('Conectando a Supabase:', SUPABASE_URL);
  const { data, error } = await supabase.from('tenant_clientes_finales').select('id').limit(1);
  if (error) {
    console.error('Error al acceder a tenant_clientes_finales:', error.message);
  } else {
    console.log('Conexión exitosa a tenant_clientes_finales. Filas encontradas:', data.length);
  }

  const { data: tables, error: tablesErr } = await supabase.rpc('get_tables_count'); // Custom RPC if exists
  // Or just try to select from a few critical tables
  const criticalTables = ['tenants', 'tenant_whatsapp_messages', 'users'];
  for (const table of criticalTables) {
    const { error: err } = await supabase.from(table).select('id').limit(1);
    console.log(`Tabla ${table}:`, err ? 'ERROR: ' + err.message : 'OK');
  }
}

checkTables();
