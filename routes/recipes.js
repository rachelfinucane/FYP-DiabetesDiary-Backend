const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const { scrapeNutritionInfo, searchRecipes } = require('../services/service_recipes.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], function (req, res) {
    res.render('recipes', { user: req.user });
});

router.get('/recipe-info', [userAuthCheck], async function (req, res) {
    console.log(req.query.recipe);
    let response = await scrapeNutritionInfo(req.query.recipe);
    res.json({ data: response });
});

router.get('/search-recipes', [userAuthCheck], async function (req, res) {
    console.log(req.query.recipeSite, req.query.keywords);
    let response = await searchRecipes(req.query.recipeSite, req.query.keywords);
    res.json(response);
});

module.exports = router;