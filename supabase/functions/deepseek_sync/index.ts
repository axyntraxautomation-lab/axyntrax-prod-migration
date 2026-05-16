import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const payload = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Guardar en tabla local deepseek_sync
    const { error } = await supabase
      .from("deepseek_sync")
      .insert({
        agent: payload.agent || "UNKNOWN",
        event_type: payload.event_type || "GENERAL_EVENT",
        payload: payload
      });
      
    if (error) {
      console.error("Error inserting log:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    
    // 2. Loguear en consola de la nube para auditoría viva
    console.log(`[DEEPSEEK_BRAIN] Sincronizado evento ${payload.event_type} desde Agente: ${payload.agent}`);
    
    return new Response(
      JSON.stringify({ success: true, message: "Brain Sync Completed" }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
});
