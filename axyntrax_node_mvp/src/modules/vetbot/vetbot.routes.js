// axyntrax_node_mvp/src/modules/vetbot/vetbot.routes.js
const { Router } = require('express');
const ctrl = require('./vetbot.controller');
const router = Router();

router.get('/',                       ctrl.dashboard);
router.post('/citas',                 ctrl.crearCita);
router.get('/animales/:animalId',     ctrl.historialAnimal);

module.exports = router;
