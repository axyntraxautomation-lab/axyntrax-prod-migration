import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLogs() {
    console.log('--- REVISANDO LOGS DE INTERACCIÓN (NOCHE) ---');
    
    // Check registrations
    const { data: regs, error: errRegs } = await supabase
        .from('demo_registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
    if (errRegs) {
        console.error('Error al leer registros:', errRegs);
    } else {
        console.log('Últimos registros de demo:', regs.length);
        regs.forEach(r => console.log(`- ${r.full_name} (${r.rubro}) [${r.created_at}]`));
    }

    // Check audit logs if exists
    const { data: audit, error: errAudit } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

    if (errAudit) {
        // Table might not exist or be different
        console.log('Tabla audit_logs no encontrada o vacía.');
    } else {
        console.log('Últimos eventos JARVIS:', audit.length);
        audit.forEach(a => console.log(`- [${a.event_type}] ${a.description} [${a.timestamp}]`));
    }
}

checkLogs();
