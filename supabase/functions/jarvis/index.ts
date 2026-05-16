// supabase/functions/jarvis/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const tools = [
  {
    type: "function",
    function: {
      name: "get_today_metrics",
      description: "Devuelve ingresos y órdenes del día para el reporte.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "assign_task",
      description: "Asigna una tarea a un agente (matrix, neo, atlas).",
      parameters: {
        type: "object",
        properties: {
          agent: { type: "string", enum: ["matrix", "neo", "atlas"] },
          task: { type: "string" }
        },
        required: ["agent", "task"]
      }
    }
  }
];

serve(async (req) => {
  const { prompt } = await req.json();

  const today = new Date().toISOString().split("T")[0];
  const { data: orders } = await supabase
    .from("orders")
    .select("total")
    .gte("created_at", today)
    .eq("status", "paid");
  const revenue = orders?.reduce((s, o) => s + o.total, 0) || 0;

  const messages = [
    {
      role: "system",
      content: "Eres Jarvis, CEO autónomo de Axyntrax Automation. Tienes herramientas para obtener métricas y delegar. Reportas con cifras y hechos. Sé breve."
    },
    {
      role: "user",
      content: `${prompt}\n\n[Datos del día: ingresos=S/${revenue.toFixed(2)}, órdenes=${orders?.length || 0}]`
    }
  ];

  const aiRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-reasoner",
      messages,
      tools,
      tool_choice: "auto"
    })
  });

  const { choices } = await aiRes.json();
  const msg = choices[0].message;

  if (msg.tool_calls) {
    for (const call of msg.tool_calls) {
      if (call.function.name === "get_today_metrics") {
        return new Response(
          JSON.stringify({ metrics: { revenue, orders: orders?.length } }),
          { headers: { "Content-Type": "application/json" } }
        );
      } else if (call.function.name === "assign_task") {
        const args = JSON.parse(call.function.arguments);
        console.log(`Tarea delegada a ${args.agent}: ${args.task}`);
        return new Response(
          JSON.stringify({ status: "assigned", agent: args.agent, task: args.task }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return new Response(
    JSON.stringify({ reply: msg.content }),
    { headers: { "Content-Type": "application/json" } }
  );
});
