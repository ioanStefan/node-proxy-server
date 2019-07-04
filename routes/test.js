var express = require('express');
var router = express.Router();

var Test = require('../controllers/test');

let request = require('request');

router.post('/', function (req, res, next) {

    Test.testRequest(req, res);
});


router.post('/resolve', function (req, res, next) {
    Test.resolveTestRequest(req, res);
});

module.exports = router;