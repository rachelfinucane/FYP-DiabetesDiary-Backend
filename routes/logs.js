var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

var ensureLoggedIn = ensureLogIn();

var router = express.Router();

let userAuthCheck = function (req, res, next) {
    if (!req.user) {
        console.log("Auth check failed. Redirecting to home.");
        return res.render('home');
    }
    next();
}

/* GET add-logs page. */
// router.get('/add-logs', function(req, res, next) {
//   if (!req.user) { return res.render('home'); }
//   next();
// }, function(req, res, next) {
//   res.locals.filter = null;
//   res.render('add-logs', { user: req.user });
// });

router.get('/add-logs', [userAuthCheck], function (req, res, next) {
    res.locals.filter = null;
    res.render('add-logs', { user: req.user });
});

/* GET logs page. */
router.get('/logs', function (req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, function (req, res, next) {
    res.locals.filter = null;
    res.render('logs', { user: req.user });
});

/* GET logs page. */
router.post('/logs', function (req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, function (req, res, next) {
    console.log(req);
    res.render('logs');
});

/* POST logs */
router.post('/logs', ensureLoggedIn, function (req, res, next) {
    console.log(req);
});

module.exports = router;
