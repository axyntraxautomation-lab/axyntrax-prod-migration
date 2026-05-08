// axyntrax_node_mvp/src/modules/finanzas/finanzas.routes.js
const { Router } = require('express');
const ctrl = require('./finanzas.controller');
const router = Router();

router.get('/',         ctrl.dashboard);
router.get('/reporte',  ctrl.reporte);
router.post('/sunat',   ctrl.declaracionSunat);

module.exports = router;
