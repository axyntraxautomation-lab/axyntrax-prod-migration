// axyntrax_node_mvp/src/modules/logistica/logistica.controller.js
const { MODULES } = require('../../config/modulesConfig');

exports.dashboard = (req, res) => {
  res.json({ modulo: MODULES.logistica.nombre, status: 'ACTIVO', data: {} });
};

exports.crearEnvio = (req, res) => {
  res.status(201).json({ mensaje: 'Envío registrado', envio: req.body });
};

exports.estadoEnvio = (req, res) => {
  const { envioId } = req.params;
  res.json({ envioId, estado: 'EN_RUTA', ubicacion: null });
};
