// supabase/functions/matrix/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

serve(async (req) => {
  const { task, context } = await req.json(); 
  const prompt = `Eres Matrix, experto desarrollador y generador de nuevas ideas de módulos para Axyntrax Automation. 
Tarea: ${task}. 
Contexto adicional: ${context || "ninguno"}. 
Devuelve SOLO el código limpio o la propuesta técnica.`;

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-coder",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000
    })
  });
  const data = await res.json();
  const output = data.choices[0].message.content;
  return new Response(JSON.stringify({ result: output }), {
    headers: { "Content-Type": "application/json" }
  });
});
