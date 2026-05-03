// axyntrax_node_mvp/src/modules/dentbot/dentbot.routes.js
const { Router } = require('express');
const ctrl = require('./dentbot.controller');
const router = Router();

router.get('/',                               ctrl.dashboard);
router.post('/citas',                         ctrl.crearCita);
router.get('/pacientes/:pacienteId/tratamientos', ctrl.tratamientos);

module.exports = router;
