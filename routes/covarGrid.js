var express = require('express');
var router = express.Router();

// Require controller modules
var covar_controller = require('../controllers/covarController')

router.get('/:lat/:lon/:forcast?', covar_controller.radius_selection);

module.exports = router;