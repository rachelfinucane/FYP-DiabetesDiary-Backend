const express = require('express');
const { userAuthCheck } = require('../helpers/helpers.js');
const { searchRecipes, saveRecipe, getRecipesByUserId } = require('../services/service_recipes.js');
const router = express.Router();

router.get('/recipes', [userAuthCheck], function (req, res) {
    res.render('recipes', { user: req.user });
});

router.get('/recipes/userId', [userAuthCheck], async function(req, res) {
    try{
    const response = await getRecipesByUserId(req.user.userId);
    console.log(response);
    res.json(response);
    } catch(err) {
        console.log(err);
        next(err);
    }
});

// router.get('/recipe-info', [userAuthCheck], async function (req, res, next) {
//     try {
//         let response = await scrapeNutritionInfo(req.query.recipe);
//     } catch (err) {
//         next(err);
//     }
// });

router.get('/search-recipes', [userAuthCheck], async function (req, res, next) {
    try {
        const response = await searchRecipes(req.query.recipeSite, req.query.keywords);
        res.json(response);
    } catch (err) {
        console.log(err);
        next(err)
    }
});

router.post('/save-recipe', [userAuthCheck], async function (req, res, next) {
    try {
        let response = await saveRecipe(req.body.recipeUrl, req.user.userId);
        
        res.redirect('/recipes');
    } catch (err) {
        console.log(err);
        next(err)
    }
});

router.get('')

module.exports = router;