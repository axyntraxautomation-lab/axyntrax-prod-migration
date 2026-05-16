// supabase/functions/neo/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

serve(async (req) => {
  const { requirements } = await req.json();
  const prompt = `Eres Neo, diseñador UX/UI y arquitecto visual de Axyntrax Automation. 
Necesito que propongas una solución de diseño para: ${requirements}. 
Incluye paleta de colores, tipografía, estructura de componentes, y si es necesario, descripción para generación de imágenes. 
Responde como un brief de diseño.`;

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    })
  });
  const data = await res.json();
  const output = data.choices[0].message.content;
  return new Response(JSON.stringify({ design_brief: output }), {
    headers: { "Content-Type": "application/json" }
  });
});
