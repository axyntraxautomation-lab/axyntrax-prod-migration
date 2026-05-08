// axyntrax_node_mvp/src/modules/medibot/medibot.controller.js
const { MODULES } = require('../../config/modulesConfig');

exports.dashboard = (req, res) => {
  res.json({ modulo: MODULES.medibot.nombre, status: 'ACTIVO', data: {} });
};

exports.crearCita = (req, res) => {
  // TODO: integrar con agenda de clínica
  res.status(201).json({ mensaje: 'Cita creada exitosamente', cita: req.body });
};

exports.triaje = (req, res) => {
  res.json({ evaluacion: 'NORMAL', prioridad: 'BAJA', mensaje: 'Triaje IA procesado.' });
};
