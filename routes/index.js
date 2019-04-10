var express = require('express');
var router = express.Router();

var ProxyServer = require('../controllers/proxy');

const crypto = require('crypto');

/* Proxy request */

/**
 * All GET request from local clients will pe proxyed through function bellow.
 */
router.get('/', function (req, res, next) {

  console.log(req.baseUrl)

  const proxyServer = new ProxyServer();

  proxyServer.proxyGetRequest(req, res);

})
/**
 * All POST requests from local clients will be proxyed through function bellow.
 */
router.post('/', function (req, res, next) {
  const proxyServer = new ProxyServer();
  proxyServer.proxyPostRequest(req, res);
});

module.exports = router;