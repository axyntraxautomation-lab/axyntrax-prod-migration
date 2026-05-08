// axyntrax_node_mvp/src/services/licenseService.js
// ─────────────────────────────────────────────────────────
// Consulta los módulos activos de un tenant en Supabase.
// El campo `modulos_activos` es un array de IDs (modulesConfig).
// ─────────────────────────────────────────────────────────
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Devuelve la licencia activa de una clínica con sus módulos.
 * @param {string} idClinica
 * @returns {{ keyge: string, modulosActivos: string[], plan: string } | null}
 */
async function getLicenseByClinica(idClinica) {
  const { data, error } = await supabase
    .from('licencias')
    .select('keyge, modulos_activos, plan, estado')
    .eq('id_clinica', idClinica)
    .eq('estado', 'ACTIVA')
    .single();

  if (error || !data) return null;

  return {
    keyge: data.keyge,
    modulosActivos: data.modulos_activos ?? [],
    plan: data.plan,
  };
}

module.exports = { getLicenseByClinica };
