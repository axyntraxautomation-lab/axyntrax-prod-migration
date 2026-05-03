// axyntrax_node_mvp/src/modules/dentbot/dentbot.controller.js
const { MODULES } = require('../../config/modulesConfig');

exports.dashboard = (req, res) => {
  res.json({ modulo: MODULES.dentbot.nombre, status: 'ACTIVO', data: {} });
};

exports.crearCita = (req, res) => {
  res.status(201).json({ mensaje: 'Cita dental creada', cita: req.body });
};

exports.tratamientos = (req, res) => {
  const { pacienteId } = req.params;
  res.json({ pacienteId, tratamientos: [] });
};
