// axyntrax_node_mvp/src/modules/index.js
// ─────────────────────────────────────────────────────────
// REGISTRO DINÁMICO DE MÓDULOS
// Conecta todos los routers al app de Express + aplica
// el Guardián ANTES de cada grupo de rutas.
// IMPORTANTE: No toca rutas de Auth / Webhooks existentes.
// ─────────────────────────────────────────────────────────
const verificarModuloActivo = require('../middleware/verificarModuloActivo');

const modulesMap = [
  { prefix: '/api/medibot',   router: require('./medibot/medibot.routes') },
  { prefix: '/api/vetbot',    router: require('./vetbot/vetbot.routes') },
  { prefix: '/api/dentbot',   router: require('./dentbot/dentbot.routes') },
  { prefix: '/api/logistica', router: require('./logistica/logistica.routes') },
  { prefix: '/api/finanzas',  router: require('./finanzas/finanzas.routes') },
];

/**
 * Registra todos los módulos en la app Express.
 * Llamar DESPUÉS de los middleware globales y ANTES de las rutas de error.
 * @param {import('express').Application} app
 */
function registerModules(app) {
  modulesMap.forEach(({ prefix, router }) => {
    // El Guardián protege CADA módulo de forma independiente
    app.use(prefix, verificarModuloActivo, router);
    console.log(`[AXYNTRAX] ✓ Módulo registrado: ${prefix}`);
  });
}

module.exports = { registerModules };
