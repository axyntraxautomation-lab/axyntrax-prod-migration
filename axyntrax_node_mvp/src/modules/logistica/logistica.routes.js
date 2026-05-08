// axyntrax_node_mvp/src/modules/logistica/logistica.routes.js
const { Router } = require('express');
const ctrl = require('./logistica.controller');
const router = Router();

router.get('/',                       ctrl.dashboard);
router.post('/envios',                ctrl.crearEnvio);
router.get('/envios/:envioId/estado', ctrl.estadoEnvio);

module.exports = router;
