// axyntrax_node_mvp/src/modules/vetbot/vetbot.controller.js
const { MODULES } = require('../../config/modulesConfig');

exports.dashboard = (req, res) => {
  res.json({ modulo: MODULES.vetbot.nombre, status: 'ACTIVO', data: {} });
};

exports.crearCita = (req, res) => {
  res.status(201).json({ mensaje: 'Cita veterinaria creada', cita: req.body });
};

exports.historialAnimal = (req, res) => {
  const { animalId } = req.params;
  res.json({ animalId, historial: [] });
};
