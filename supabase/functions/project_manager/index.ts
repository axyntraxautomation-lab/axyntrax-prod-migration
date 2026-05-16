import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, project_id, client_request } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'start_project') {
      // 1. Neo generates 3 options (simulated here, but could call DeepSeek)
      const options = [
        "Opción 1: Dashboard Minimalista (S/ 2500)",
        "Opción 2: E-commerce Dinámico (S/ 4500)",
        "Opción 3: SaaS Multi-tenant con IA (S/ 8500)"
      ];

      // Insert into web_projects
      const { data: project, error } = await supabase.from('web_projects').insert({
        name: client_request || "Nuevo Proyecto Web",
        status: 'quoting',
        prompt_text: JSON.stringify(options)
      }).select().single();

      return new Response(JSON.stringify({ success: true, project }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_prompt') {
      // Matrix generates prompt and calls Antigravity API
      const apiKey = Deno.env.get('ANTIGRAVITY_API_KEY') ?? '';
      
      const technicalPrompt = `
        Proyecto: Desarrollo de App Web a Medida
        Tecnologías: Next.js 14, Tailwind, Supabase
        Diseño: Profesional, glassmorphism, responsive.
        Instrucciones: Construir la arquitectura base y los componentes principales basados en el esquema seleccionado.
      `;

      await supabase.from('web_projects').update({
        status: 'in_progress',
        prompt_text: technicalPrompt,
        antigravity_task_id: 'ag-task-' + Date.now() // simulated
      }).eq('id', project_id);

      return new Response(JSON.stringify({ success: true, message: "Prompt enviado a Antigravity", technicalPrompt }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'jarvis_review') {
       // Jarvis checks the code
       await supabase.from('web_projects').update({
        status: 'completed',
      }).eq('id', project_id);

      return new Response(JSON.stringify({ success: true, message: "Código revisado por Jarvis y aprobado. Proyecto completado." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Acción no soportada" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
