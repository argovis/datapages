var express = require('express');
var router = express.Router();

const profile_controller = require('../controllers/profileController');

router.get('/profiles/:format?', profile_controller.selected_profile_list);

module.exports = router;