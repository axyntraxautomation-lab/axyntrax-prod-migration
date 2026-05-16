// supabase/functions/ready/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { record } = await req.json();
  const { event_type, payload } = record;

  const routing: Record<string, string> = {
    "nuevo_lead": "jarvis",
    "tarea_desarrollo": "matrix",
    "tarea_diseno": "neo",
    "alerta_red": "atlas"
  };
  const agent = routing[event_type] || "jarvis";

  await supabase.from("agent_events").update({ status: "processing", assigned_agent: agent }).eq("id", record.id);

  // Mock triggering the external executor workflow 
  await supabase.from("agent_events").update({ status: "done" }).eq("id", record.id);

  return new Response(JSON.stringify({ success: true, agent }), {
    headers: { "Content-Type": "application/json" }
  });
});
