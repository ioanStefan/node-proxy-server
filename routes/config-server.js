var express = require('express');
var router = express.Router();

var ConfigServer = require('../controllers/config-server');

/* GET users listing. */
router.get('/connection', function (req, res, next) {
  ConfigServer.establishConnection(req, res);
});

module.exports = router;