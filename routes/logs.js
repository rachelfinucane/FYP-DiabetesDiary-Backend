const express = require('express');
const { addLog, getLogs } = require('../services/service_logs.js');
const { userAuthCheck } = require('../helpers/helpers.js');
const router = express.Router();

router.get('/add-logs', [userAuthCheck], function (req, res, next) {
    res.render('add-logs', { user: req.user });
});

/* GET logs page. */
router.get('/view-logs', [userAuthCheck], function (req, res, next) {
    res.render('view-logs', { user: req.user });
});

/* GET logs */
router.get('/logs', [userAuthCheck], async function (req, res, next) {
    let logs = await getLogs(req.user.userId);
    res.json(logs);
});

/* POST logs */
router.post('/logs', [userAuthCheck],
    function (req, res) {
        console.log(req.body);
        let newLog = req.body;
        delete newLog._csrf;
        newLog.userId = req.user.userId;

        addLog(newLog);

        res.redirect('/view-logs');
    });

module.exports = router;
