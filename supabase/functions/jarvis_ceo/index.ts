import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.12";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain/agents";
import { DynamicTool } from "https://esm.sh/langchain/tools";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { goal } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const model = new ChatOpenAI({
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
      temperature: 0.2,
      modelName: 'gpt-4o'
    });

    // TOOL 1: Log Decision to War Room
    const decisionTool = new DynamicTool({
      name: "persist_decision",
      description: "Guarda una decisión del agente en la base de datos para revisión humana. Entrada: un objeto JSON con 'phase', 'decision_text', 'rationale', 'impact_score'.",
      func: async (input) => {
        const { phase, decision_text, rationale, impact_score } = JSON.parse(input);
        const { error } = await supabase.from('jarvis_decisions').insert([{
          agent_phase: phase,
          decision_text: decision_text,
          rationale: rationale,
          impact_score: impact_score || 50,
          status: 'PENDING_APPROVAL'
        }]);
        return error ? `Error guardando: ${error.message}` : "Decisión enviada exitosamente al War Room.";
      }
    });

    const tools = [decisionTool];

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions",
      verbose: true
    });

    const result = await executor.invoke({ input: `Eres JARVIS, el CEO AI Autónomo. Tu objetivo actual es: ${goal}. Evalúa, toma decisiones y envíalas a persistencia.` });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
