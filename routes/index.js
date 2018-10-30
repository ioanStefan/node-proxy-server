var express = require('express');
var router = express.Router();

var ProxyServer = require('../controllers/proxy');

/* Proxy request */
/**
 * All request will be proxyed through function bellow.
 */
router.post('/preq', function (req, res, next) {
  let request = require('request');

  // Request get with JSON

  request.get('http://localhost:3001', function (err, response, body) {
    let jsonBody = JSON.parse(body);
    return res.json({
      msg: jsonBody.msg
    })
  })


  // Request post with JSON

  // request.post('http://localhost:3001', {
  //   form: {
  //     msg: req.body.msg
  //   }
  // }, function (err, response, body) {
  //   let jsonResponse = JSON.parse(response.body);
  //   jsonResponse.msg = jsonResponse.msg + " AM adaugat aici ceva in plus dupa ce am primit mesajul";

  //   return res.json({
  //     msg: jsonResponse.msg
  //   })
  // })
  // ProxyServer.proxy(req, res, next);
});

module.exports = router;