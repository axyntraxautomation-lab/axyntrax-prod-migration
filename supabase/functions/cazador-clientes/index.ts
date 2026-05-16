import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

const RUBROS = [
  "carwash Lima",
  "veterinaria Lima",
  "dentista Lima",
  "taller mecánico Lima",
  "restaurante Lima",
  "consultorio médico Lima",
];

async function buscarNegocios(rubro: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(rubro)}&key=${GOOGLE_MAPS_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).map((p: any) => ({
    negocio: p.name,
    direccion: p.formatted_address,
    telefono: "Sin teléfono", // Se obtiene con Places Details si se requiere
    rubro: rubro.replace(" Lima", ""),
  }));
}

serve(async (req: Request) => {
  try {
    let nuevos = 0;
    for (const rubro of RUBROS) {
      const negocios = await buscarNegocios(rubro);
      for (const neg of negocios) {
        const { error } = await supabase.from("leads").insert(neg);
        if (!error) nuevos++;
      }
    }
    return new Response(JSON.stringify({ success: true, nuevos_leads: nuevos }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
