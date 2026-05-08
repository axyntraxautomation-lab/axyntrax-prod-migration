// axyntrax_node_mvp/src/middleware/verificarModuloActivo.js
// ─────────────────────────────────────────────────────────
// GUARDIÁN DE MÓDULOS  –  AXYNTRAX / KEYGE
// Verifica que el tenant tenga el módulo activo antes
// de dejar pasar la petición al controlador.
// ─────────────────────────────────────────────────────────
const { getModuleByRoute } = require('../config/modulesConfig');
const { getLicenseByClinica } = require('../services/licenseService');

module.exports = async function verificarModuloActivo(req, res, next) {
  const idClinica = req.headers['x-clinica-id'] || req.session?.idClinica;
  if (!idClinica) return res.status(401).json({ error: 'Sesión no identificada. Inicie sesión.' });

  const modulo = getModuleByRoute(req.path);
  if (!modulo) return next(); // ruta sin módulo asignado → dejar pasar

  const licencia = await getLicenseByClinica(idClinica);
  const tieneAcceso = licencia?.modulosActivos?.includes(modulo.id);

  if (!tieneAcceso) {
    return res.status(403).json({
      error: `Módulo no adquirido. Contacte a Gerencia para actualizar su plan.`,
      modulo: modulo.nombre,
      accion: 'UPGRADE_REQUIRED',
    });
  }

  req.moduloActivo = modulo; // inyectar contexto al controlador
  next();
};
