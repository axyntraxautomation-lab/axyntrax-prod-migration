import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTable() {
  console.log('Verificando/Creando tabla demo_registrations...');
  
  // Nota: exec_sql debe existir como una función RPC en Supabase que ejecute SQL.
  // Si no existe, este paso fallará.
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS public.demo_registrations (
        id SERIAL PRIMARY KEY,
        nombre TEXT,
        whatsapp TEXT,
        email TEXT,
        empresa TEXT,
        rubro TEXT,
        acepta_terminos BOOLEAN,
        acepta_marketing BOOLEAN,
        timestamp_consentimiento TIMESTAMPTZ,
        version_terminos TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Habilitar RLS
      ALTER TABLE public.demo_registrations ENABLE ROW LEVEL SECURITY;
      
      -- Política para que el service role pueda hacer todo
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'demo_registrations' AND policyname = 'Service role full access'
        ) THEN
          CREATE POLICY "Service role full access" ON public.demo_registrations
            FOR ALL TO service_role
            USING (true);
        END IF;
      END
      $$;
    `
  });

  if (error) {
    console.error('Error al crear tabla (RPC exec_sql):', error.message);
    console.log('Asegúrate de que la función RPC "exec_sql" esté configurada en Supabase.');
  } else {
    console.log('Tabla demo_registrations verificada/creada. ✅');
  }
}

createTable();
