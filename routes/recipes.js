const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const { scrapeNutritionInfo, searchRecipes, saveRecipe } = require('../services/service_recipes.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], function (req, res) {
    res.render('recipes', { user: req.user });
});

router.get('/recipe-info', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await scrapeNutritionInfo(req.query.recipe);
        res.status(500); // just for now to prevent redirect TODO remove
    } catch (err) {
        next(err);
    }
});

router.get('/search-recipes', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await searchRecipes(req.query.recipeSite, req.query.keywords);
        res.json(response);
    } catch (err) {
        next(err)
    }
});

router.post('/save-recipe', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await saveRecipe(req.body.recipeUrl, req.user.userId);
        
        res.redirect('/recipes');
    } catch (err) {
        next(err)
    }
});

module.exports = router;