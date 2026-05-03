// axyntrax_node_mvp/src/modules/medibot/medibot.routes.js
const { Router } = require('express');
const ctrl = require('./medibot.controller');
const router = Router();

router.get('/',         ctrl.dashboard);
router.post('/citas',   ctrl.crearCita);
router.post('/triaje',  ctrl.triaje);

module.exports = router;
