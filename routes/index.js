var express = require('express');
var router = express.Router();

var ProxyServer = require('../controllers/proxy');

let request = require('request');

/* Proxy request */

/**
 * All GET request will pe proxyed through function bellow.
 */
router.get('/', function (req, res, next) {
  ProxyServer.proxyGetRequest(req, res);
})
/**
 * All POST requests will be proxyed through function bellow.
 */
router.post('/', function (req, res, next) {
  ProxyServer.proxyPostRequest(req, res);
});

module.exports = router;