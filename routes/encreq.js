var express = require('express');
var router = express.Router();

var ProxyServer = require('../controllers/proxy');

let request = require('request');

/**
 * All requests from Internet clients will be proxyed through function bellow.
 */
router.post('/', function (req, res, next) {
    const proxyServer = new ProxyServer();
    proxyServer.proxyEncryptRequest(req, res);
})

module.exports = router;