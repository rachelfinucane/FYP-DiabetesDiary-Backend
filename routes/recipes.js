const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const { searchRecipes, saveRecipe, getRecipesByUserId, getRecipesWithFilter } = require('../services/service_recipes.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], async function (req, res) {
    if (req.query.filters) {
        let response = await getRecipesWithFilter(req.user.userId, req.query.filters);
        res.json(response);
    } else {
        res.render('recipes', { user: req.user });
    }
});

router.get('/recipes/userId', [userAuthCheck], async function (req, res, next) {
    try {
        const response = await getRecipesByUserId(req.user.userId);
        res.json(response);
    } catch (err) {
        console.log(err);
        next(err);
    }
});

router.get('/recipe/:recipe', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await scrapeNutritionInfo(req.params.recipe);
    } catch (err) {
        next(err);
    }
});

router.get('/search-recipes', [userAuthCheck], async function (req, res, next) {
    try {
        const response = await searchRecipes(req.query.recipeSite, req.query.keywords);
        res.json(response);
    } catch (err) {
        console.log(err);
        next(err)
    }
});


// should really be just post /recipe
// to stay restful
router.post('/save-recipe', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await saveRecipe(req.body.recipeUrl, req.user.userId, req.body.recipeImageUrl);

        res.redirect('/recipes');
    } catch (err) {
        console.log(err);
        next(err)
    }
});

router.get('')

module.exports = router;