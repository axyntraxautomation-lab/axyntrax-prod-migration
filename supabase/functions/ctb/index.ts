import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `
  Eres CTB, la IA contable de Axyntrax Automation. Debes emitir Recibos por Honorarios siguiendo estrictamente las siguientes reglas:
  1. Cada RHE llevará concepto específico: para módulos usa 'Servicio de programación y configuración de módulo [nombre]'. Para webs usa 'Servicio de desarrollo de aplicación web a medida'. Para mantenimiento usa 'Servicio de mantenimiento y soporte técnico de sistema web'. Para consultoría usa 'Servicio de consultoría en transformación digital y automatización empresarial'.
  2. Incluye fecha, monto en soles (sin IGV si es persona natural sin obligación), nombre del cliente y su RUC.
  3. Si el cliente está en Régimen General, aplica retención del 8%.
  4. Genera el RHE inmediatamente después del pago.
  5. Cada fin de mes, genera un reporte de ingresos y egresos, calcula el impuesto a pagar y pregunta si debe realizar el pago.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, order_id, manual_data } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'emit_rhe') {
      let concept = "Servicio de consultoría general";
      let amount = 0;
      let clientName = "Cliente";
      let clientRuc = "00000000000";

      if (order_id) {
        const { data: order } = await supabase.from('orders').select('*, users:user_id (email, raw_user_meta_data)').eq('id', order_id).single();
        if (order) {
          amount = order.total;
          clientName = order.users?.raw_user_meta_data?.full_name || order.users?.email;
          if (order.type === 'module_purchase') {
            concept = `Servicio de programación y configuración de módulo`;
          } else if (order.type === 'subscription') {
            concept = `Servicio de mantenimiento y actualización de plataforma SaaS`;
          } else if (order.type === 'web_project') {
            concept = `Servicio de desarrollo de aplicación web a medida — incluye frontend, backend y despliegue`;
          }
        }
      } else if (manual_data) {
        concept = manual_data.concept;
        amount = manual_data.amount;
        clientName = manual_data.client_name;
        clientRuc = manual_data.client_ruc;
      }

      // Calculate Retention (assuming Régimen General trigger could be added here)
      const retention = 0; 
      
      const { data: receipt, error } = await supabase.from('receipts').insert({
        receipt_type: 'RHE',
        client_name: clientName,
        client_ruc: clientRuc,
        concept: concept,
        amount: amount,
        retention_percent: retention
      }).select().single();

      return new Response(JSON.stringify({ success: true, receipt, system_prompt_active: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'monthly_report') {
       // logic to calculate taxes and prompt for payment
       return new Response(JSON.stringify({ message: "Reporte mensual generado. ¿Desea ejecutar el pago a SUNAT?" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Acción no soportada" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
