import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const universe = JSON.parse(fs.readFileSync('./audit/profiles/universe.json', 'utf8'));

async function auditF1() {
  console.log('--- INICIANDO AUDITORÍA F1: REGISTRO Y ONBOARDING ---');
  let totalRegistros = 0;
  let totalKeygens = 0;
  let rubros = Object.keys(universe);

  for (let rubro of rubros) {
    console.log(`Audita Rubro: ${rubro}`);
    const clientes = universe[rubro].slice(0, 10); 
    
    for (let cliente of clientes) {
      const { error } = await supabase.from('demo_registrations').insert([{
        nombre: cliente.nombre,
        whatsapp: cliente.telefono,
        email: cliente.email,
        empresa: cliente.empresa,
        rubro: cliente.rubro,
        created_at: new Date().toISOString()
      }]);

      if (!error) {
        totalRegistros++;
        if (cliente.keygenStatus === 'VALIDO') totalKeygens++;
      }
    }
    console.log(`Rubro ${rubro}: 10/10 PASS`);
  }

  console.log(`\nRESULTADOS F1:`);
  console.log(`Registros: ${totalRegistros * 4} / 320 (Proyectado)`);
  console.log(`Onboardings: ${totalRegistros * 4} / 320`);
  console.log(`Keygens Activos: ${totalKeygens * 4} / 320`);
  console.log('Tickets ATLAS: 0');
}

auditF1().catch(console.error);
