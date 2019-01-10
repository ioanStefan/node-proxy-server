var express = require('express');
var router = express.Router();

var ProxyServer = require('../controllers/proxy');

let request = require('request');

/**
 * All requests from Internet clients will be proxyed through function bellow.
 */
router.post('/', function (req, res, next) {
    console.log("aici");
    ProxyServer.proxyEncryptRequest(req, res);
})

module.exports = router;