/**
 * This file handles all recipes routing.
 */

const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const { searchRecipes, saveRecipe, getRecipesByUserId, getRecipesWithFilter, deleteRecipe } = require('../services/service_recipes.js');
const router = express.Router();

/**
 * Get /recipes view or get /recipes (JSON) 
 */
router.get('/recipes', [userAuthCheck], async function (req, res) {
    if (req.query.filters) {
        let response = await getRecipesWithFilter(req.user.userId, req.query.filters);
        res.json(response);
    } else {
        res.render('recipes', { user: req.user });
    }
});

/**
 * Gets recipes for a specific userId
 */
router.get('/recipes/userId', [userAuthCheck], async function (req, res, next) {
    try {
        const response = await getRecipesByUserId(req.user.userId);
        res.json(response);
    } catch (err) {
        console.log(err);
        next(err);
    }
});

/**
 * Gets recipe info for a specified recipe
 */
router.get('/recipe/:recipe', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await scrapeNutritionInfo(req.params.recipe);
    } catch (err) {
        next(err);
    }
});

/**
 * Searches google for keywords on a specified site.
 */
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
/**
 * Saves a recipe
 */
router.post('/save-recipe', [userAuthCheck], async function (req, res, next) {
    try {
        await saveRecipe(req.body.recipeUrl, req.user.userId, req.body.recipeImageUrl);

        res.redirect('/recipes');
    } catch (err) {
        console.log(err);
        next(err)
    }
});

/**
 * Deletes a recipe
 */
 router.delete('/recipes/:recipeId', [userAuthCheck], async function (req, res, next) {
    console.log("delete");
    try {
        await deleteRecipe(req.params.recipeId, req.user.userId);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        next(err)
    }
});


module.exports = router;