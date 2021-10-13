var express = require('express');
var router = express.Router();

// Require controller modules
const platform_controller = require('../controllers/platformController')
const profile_controller = require('../controllers/profileController');

router.get('/platforms/:platform_number/:format?', platform_controller.platform_detail);
router.get('/profiles/:_id/:format?', profile_controller.profile_detail);

module.exports = router;