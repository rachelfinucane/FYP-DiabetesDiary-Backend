/**
 * This file handles all index routing.
 */

const express = require('express');
const router = express.Router();

/**
 * Renders the home page.
 * If the user is logged in, they are shown the main page.
 * If they are not, they are shown the view of a logged
 * out home page.
 */
router.get('/', function (req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, function (req, res, next) {
    res.locals.filter = null;
    res.render('index', { user: req.user });
});


module.exports = router;
