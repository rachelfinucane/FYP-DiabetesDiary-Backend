const express = require('express');
const { NText } = require('mssql');
const { userAuthCheck } = require('../helpers/helpers.js');
const { scrapeNutritionInfo, searchRecipes } = require('../services/service_recipes.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], function (req, res) {
    res.render('recipes', { user: req.user });
});

router.get('/recipe-info', [userAuthCheck], async function (req, res, next) {
    console.log(req.query.recipe);
    try {
        let response = await scrapeNutritionInfo(req.query.recipe);
        res.json({ data: response });
    } catch (err) {
        next(err);
    }
});

router.get('/search-recipes', [userAuthCheck], async function (req, res, next) {
    try{
    let response = await searchRecipes(req.query.recipeSite, req.query.keywords);
    res.json(response);
    } catch (err) {
        next(err)
    }
});

module.exports = router;