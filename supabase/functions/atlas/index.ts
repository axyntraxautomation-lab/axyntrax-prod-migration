// supabase/functions/atlas/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

serve(async (req) => {
  const { alert } = await req.json(); 
  
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${DEEPSEEK_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "Eres Atlas, administrador de sistemas de Axyntrax. Resuelves incidencias de red, despliegues y actualizaciones de módulos. Responde con acciones concretas." },
        { role: "user", content: alert }
      ]
    })
  });

  const data = await res.json();
  const action = data.choices?.[0]?.message?.content || "Sin respuesta automatizada del núcleo Atlas.";

  return new Response(JSON.stringify({ action }), {
    headers: { "Content-Type": "application/json" }
  });
});
