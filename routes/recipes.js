const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], function (req, res) {
    res.render('recipes', { user: req.user });
});

router.get('/recipe-info', [userAuthCheck], function (req, res) {
    console.log(req.query.recipe);
    res.json({ user: req.user });
});

module.exports = router;