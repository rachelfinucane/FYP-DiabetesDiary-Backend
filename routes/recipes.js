const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const { scrapeNutritionInfo } = require('../services/service_recipes.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], function (req, res) {
    res.render('recipes', { user: req.user });
});

router.get('/recipe-info', [userAuthCheck], async function (req, res) {
    console.log(req.query.recipe);
    let response = await scrapeNutritionInfo(req.query.service, req.query.recipe);
    res.json({ data: response });
});

module.exports = router;