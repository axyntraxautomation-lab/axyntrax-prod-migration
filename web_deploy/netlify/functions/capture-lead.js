const { createClient } = require('@supabase/supabase-js');

// Estas variables deben configurarse en el panel de Netlify
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

exports.handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const lead = JSON.parse(event.body);

        // Validar datos básicos
        if (!lead.nombre || !lead.whatsapp) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Nombre y WhatsApp son requeridos" })
            };
        }

        // Insertar en Supabase
        const { data, error } = await supabase
            .from('leads')
            .insert([
                {
                    nombre: lead.nombre,
                    whatsapp: lead.whatsapp,
                    sector: lead.sector,
                    necesidad: lead.necesidad,
                    origen: 'web_redesign'
                }
            ]);

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Lead capturado con éxito", data })
        };

    } catch (error) {
        console.error("Error en capture-lead:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error interno del servidor" })
        };
    }
};
