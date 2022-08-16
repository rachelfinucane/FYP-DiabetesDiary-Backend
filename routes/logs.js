var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

const { addLog } = require('../services/service_logs.js')

var ensureLoggedIn = ensureLogIn();

var router = express.Router();

let userAuthCheck = function (req, res, next) {
    if (!req.user) {
        console.log("Auth check failed. Redirecting to home.");
        return res.render('home');
    }
    next();
}

router.get('/add-logs', [userAuthCheck], function (req, res, next) {
    res.locals.filter = null;
    res.render('add-logs', { user: req.user });
});

/* GET logs page. */
router.get('/view-logs', function (req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, function (req, res, next) {
    res.locals.filter = null;
    res.render('view-logs', { user: req.user });
});

/* GET logs */
router.get('/logs', [userAuthCheck], function(req, res, next) {
    console.log(req.user.userId);
    res.json({ok:200});
    // getLogs(req.user.userId);
});

/* POST logs */
router.post('/logs', [userAuthCheck], function (req, res, next) {
    console.log(req.body);
    let newLog = req.body;
    delete newLog._csrf;
    newLog.userId = req.user.userId;

    addLog(newLog);

    res.render('view-logs');
});

module.exports = router;
