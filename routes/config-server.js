var express = require('express');
var router = express.Router();

var ConfigServer = require('../controllers/config-server');

/* Check connection. */
router.get('/connection', function (req, res, next) {
  ConfigServer.establishConnection(req, res);
});

// Get Servers
router.get('/servers', function (req, res, next) {
  ConfigServer.getServers(req, res);
})

// Add new server
router.post('/servers', function (req, res, next) {
  ConfigServer.setNewServer(req, res);
})

// Update server
router.put('/servers/', function (req, res, next) {
  ConfigServer.updateServer(req, res);
})

// Delete server
router.delete('/servers/:hostname', function (req, res, next) {
  ConfigServer.removeServer(req, res);
})

// Add new target
router.post('/targets', function (req, res, next) {
  ConfigServer.addNewtarget(req, res);
})

// Update target
router.put('/targets', function (req, res, next) {
  ConfigServer.updateTarget(req, res);
})

// Delete target
router.delete('/targets/:proxy/:target', function (req, res, next) {
  ConfigServer.removeTarget(req, res);
})

// Add new internal host
router.post('/internal', function (req, res, next) {
  ConfigServer.addNewInternalHost(req, res);
})

// Update internal host
router.put('/internal', function (req, res, next) {
  ConfigServer.updateInternalHost(req, res);
})

// Delete internal host
router.delete('/internal/:host', function (req, res, next) {
  ConfigServer.removeInternalHost(req, res);
})

module.exports = router;