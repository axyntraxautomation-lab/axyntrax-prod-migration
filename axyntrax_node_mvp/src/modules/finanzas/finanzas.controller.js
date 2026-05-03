// axyntrax_node_mvp/src/modules/finanzas/finanzas.controller.js
const { MODULES } = require('../../config/modulesConfig');

exports.dashboard = (req, res) => {
  res.json({ modulo: MODULES.finanzas.nombre, status: 'ACTIVO', data: {} });
};

exports.reporte = (req, res) => {
  const { mes, año } = req.query;
  res.json({ periodo: `${mes}/${año}`, ingresos: 0, egresos: 0, utilidad: 0 });
};

exports.declaracionSunat = (req, res) => {
  res.json({ mensaje: 'Declaración SUNAT preparada para revisión.', estado: 'BORRADOR' });
};
