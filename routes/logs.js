var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

var ensureLoggedIn = ensureLogIn();

var router = express.Router();

/* GET add-logs page. */
router.get('/add-logs', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, function(req, res, next) {
  res.locals.filter = null;
  res.render('add-logs', { user: req.user });
});

/* GET logs page. */
router.get('/logs', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, function(req, res, next) {
  res.locals.filter = null;
  res.render('logs', { user: req.user });
});


module.exports = router;
