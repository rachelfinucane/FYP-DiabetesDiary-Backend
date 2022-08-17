var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

const { addLog, getLogs } = require('../services/service_logs.js')

var ensureLoggedIn = ensureLogIn();

var router = express.Router();

let userAuthCheck = function (req, res, next) {
    if (!req.user) {
        console.log("Auth check failed. Redirecting to login.");
        return res.render('login');
    }
    next();
}

router.get('/add-logs', [userAuthCheck], function (req, res, next) {
    res.locals.filter = null;
    res.render('add-logs', { user: req.user });
});

/* GET logs page. */
router.get('/view-logs', [userAuthCheck], function (req, res, next) {
    res.locals.filter = null;
    res.render('view-logs', { user: req.user });
});

/* GET logs */
router.get('/logs', [userAuthCheck], async function(req, res, next) {
    res.locals.filter = null;
    let logs = await getLogs(req.user.userId);
    res.json(logs);
});

/* POST logs */
router.post('/logs', [userAuthCheck], function (req, res, next) {
    console.log(req.body);
    let newLog = req.body;
    delete newLog._csrf;
    newLog.userId = req.user.userId;

    addLog(newLog);

    res.redirect('/view-logs');
});

module.exports = router;
