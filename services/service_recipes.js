/**
 * This file handles all business logic for recipes.
 */

const axios = require('axios');
const { parse } = require('node-html-parser')
const { decode } = require('html-entities');
const { removeTabsAndReturns, convertFractionToFloat } = require('../helpers/recipes.js');
const { roundDecimalPlaces } = require('../helpers/helpers.js');
const { getNutritionalInfo } = require('./service_food_api.js');
const { handleGetRecipesByUserId, handleInsertRecipe, handleGetRecipesWithFilter } = require('../models/models_recipes.js');
const { NotFoundError } = require('../errors/NotFound');
const { BadRequestError } = require('../errors/BadRequest');

/**
 * Gets recipes for a given user. Returns only fields from filters.
 * @param {string} userId userId
 * @param {Array} filters array fields to fetch from db 
 * @returns 
 */
async function getRecipesWithFilter(userId, filters) {
    return await handleGetRecipesWithFilter(userId, filters);
}

/**
 * Searches the Google Search API with keywords and a 
 * specific recipe site.
 * @param {string} recipeSite site to pull recipe from
 * @param {Array} keywords array of keywords to search
 * @returns Array of search results
 */
async function searchRecipes(recipeSite, keywords) {
    const googleAPIKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleSearchEngine = process.env.GOOGLE_PROGRAMMABLE_SEARCH_ENGINE;

    const recipeSiteUrl = getRecipeSiteUrl(recipeSite);
    let query = recipeSiteUrl.concat(' ', keywords);

    const googleBaseUrl = new URL('https://www.googleapis.com/customsearch/');
    const googleUrlSubdirectory = `v1?key=${googleAPIKey}&cx=${googleSearchEngine}&q=${query}`;

    const googleUrl = new URL(googleUrlSubdirectory, googleBaseUrl);

    try {
        const response = await axios.get(googleUrl.href);
        const result = response.data;
        if (result.items) {
            return result.items;
        } else {
            throw new NotFoundError("No search results found");
        }
    } catch (err) {
        console.log(err);
        if (err.name === 'NotFoundError') {
            throw err;
        }
        throw new Error("Could not connect to the Google Search API");
    }
}

/**
 * 1. Scrape nutrition information from the recipe.
 * 2. Save the recipe.
 * @param {string} url recipe site URL
 * @param {string} userId userId
 * @param {string} recipeImageUrl url for recipe image
 */
async function saveRecipe(url, userId, recipeImageUrl) {
    result = await scrapeNutritionInfo(url);
    return await handleInsertRecipe(result, userId, recipeImageUrl);
}

/**
 * gets recipes for a given user
 * @param {string} userId userId (GUID)
 * @returns recipes for a given user    
 */
async function getRecipesByUserId(userId) {
    let results = await handleGetRecipesByUserId(userId);
    return JSON.parse(results.recipe);
}

/**
 * Takes a site name, grabs the corresponding URL from a dictionary.
 * @param {string} recipeSite the website name
 * @returns a string to tell Google what site to search for
 */
function getRecipeSiteUrl(recipeSite) {
    let siteDict = {
        'BBC Good Food': 'site:https://www.bbcgoodfood.com/recipes/ -https://www.bbcgoodfood.com/recipes/collection',
        'MyRecipes': 'site:https://www.myrecipes.com/recipe/',
        'AllRecipes': 'site: https://www.allrecipes.com/recipes/',
        'All': '-https://www.bbcgoodfood.com/recipes/collection' // Custom search engine is set up to pull from the above site only
    };

    let recipeSiteUrl = siteDict[recipeSite];
    if (recipeSiteUrl === undefined) {
        throw new Error("Could not search for recipes. Invalid recipeSite provided.");
    }
    return recipeSiteUrl;
}

/**
 * Calls a scrape function depending on which site is required.
 * @param {string} url the recipe url to scrape from
 * @returns Recipe with ingredients that have nutrition info
 */
async function scrapeNutritionInfo(url) {
    let service = new URL(url);
    service = service.hostname.toLowerCase();
    console.log("service is", service);

    if (service.includes('bbc')) {
        return scrapeBBC(url);
    } else if (service.includes('goodhousekeeping')) {
        return scrapeGoodHousekeeping(url);
    } else if (service.includes('myrecipes')) {
        return myRecipes(url);
    } else if (service.includes('allrecipes')) {
        return allRecipes(url);
    } else {
        throw new BadRequestError(`Could not process request to scrape nutritional info: 
        url was not to a supported recipe site`);
    }
}

/**
 * Pulls html info from recipe web page.
 * All info is stored in a JS object called props.
 * Pull the info needed from that object.
 * @param {string} url url of recipe
 * @returns recipe with nutrition info
 */
async function scrapeBBC(url) {

    let response = await axios.get(url);

    const root = parse(response.data.toString());
    const infoNode = root.getElementById('__NEXT_DATA__');
    const infoContent = (JSON.parse(infoNode.innerHTML)).props.pageProps;
    const carbsPerServing = getCarbs(infoContent.nutritionalInfo);
    const yieldsAmount = getYieldsAmount(infoContent.servings);
    const ingredients = getIngredients(); // store ingredients and their amounts together
    const instructions = getInstructions();

    return {
        recipeName: infoContent.title,
        yields: yieldsAmount,
        instructions: instructions.join('\n'),
        ingredients: ingredients,
        carbsPerServing: carbsPerServing,
        type: "included with recipe"
    }

    function getCarbs(nutritionalInfo) {
        let carbsObj = nutritionalInfo.find(nutrient => nutrient.label == 'carbs');
        return carbsObj.value;
    }
    function getInstructions() {
        return infoContent.schema.recipeInstructions.map(instructionWrapper => instructionWrapper.text);
    }

    function getIngredients() {
        return infoContent.ingredients.map(section => {
            return section.ingredients.map(ingredient => {
                return {
                    ingredientName: (ingredient.quantityText ?? "").concat(" ", ingredient.ingredientText ?? ""),
                    "ingredientAmount": null,
                    "ingredientUnit": null,
                    "apiFoodName": null,
                    "carbs": null
                }
            })
        }).flat();
    }
}

/**
 * Gets HTML from web page.
 * Pulls recipe info including ingredients from HTML.
 * Gets the nutritional info of all the ingredients.
 * @param {string} url recipe url
 * @returns recipe with nutrition info
 */
async function myRecipes(url) {
    let response = await axios.get(url);
    const root = parse(response.data.toString());

    // Not using the info node for the ingredients because there is more information
    // in the checkbox-list-input tag later
    // that makes it much easier to parse
    const infoNode = root.querySelector('script[type=application/ld+json]');
    const infoContent = (JSON.parse(infoNode.innerHTML));

    const recipeName = getRecipeName();
    let yieldsAmount = getYieldsAmount(infoContent[1].recipeYield); // How many servings
    let instructions = getInstructions();
    let parsedIngredients = getIngredients();

    const ingredientsWithNutrition = await getNutritionalInfo({
        yieldsAmount,
        parsedIngredients
    });

    const totalCarbs = calculateTotalCarbs(ingredientsWithNutrition);
    const carbsPerServing = calculateCarbsPerServing(totalCarbs, yieldsAmount);

    return ({
        recipeName: recipeName,
        yields: yieldsAmount,
        instructions: instructions,
        ingredients: ingredientsWithNutrition,
        totalCarbs: totalCarbs,
        carbsPerServing: carbsPerServing,
        type: "manually calculated"
    });

    /**
     * Pulls the ingredients from the HTML
     * @returns ingredients array
     */
    function getIngredients() {
        const ingredientList = root.querySelectorAll('.ingredients-item');
        let parsedIngredients = [];
        ingredientList.forEach(ingredient => {
            const checkboxListInput = ingredient.querySelector('.checkbox-list-input');

            // decode html special characters
            let ingredientAmount = convertFractionToFloat(checkboxListInput.getAttribute('data-quantity'));
            let ingredientAmountRounded = roundDecimalPlaces(ingredientAmount, 2);
            let ingredientUnit = checkboxListInput.getAttribute('data-unit');

            let ingredientName = getIngredientName(checkboxListInput);

            parsedIngredients.push({
                ingredientName,
                ingredientAmount: ingredientAmountRounded,
                ingredientUnit
            });

        });

        return parsedIngredients;
    }

    /**
     * Gets the name of an ingredient and cleans it.
     * @param {object} checkboxListInput HTML wrapper containing ingredient data
     * @returns Parsed and cleaned ingredient name
     */
    function getIngredientName(checkboxListInput) {
        let ingredientName = decode(checkboxListInput.getAttribute('data-ingredient'));

        // Deals with the case of the ingredient being wrapped in a link
        if (ingredientName.includes("<a href=")) {
            ingredientName = parse(ingredientName).innerText;
        }

        // Deals with cases such as 'cheese, sliced' or 'bread, toasted'
        if (ingredientName.includes(',')) {
            ingredientName = ingredientName.split(',').slice(0, -1).join();
        }

        // Remove (extra descriptions with parentheses)
        ingredientName = ingredientName.replace(/\([\w\W]*\)+/i, '');
        return ingredientName;
    }

    /**
     * Pulls the instructions from the HTML data.
     * @returns a string containing all instructions
     */
    function getInstructions() {
        let instructions = infoContent[1].recipeInstructions;
        instructions = instructions.map(instruction => { return instruction.text; });
        return instructions.join('\n');
    }

    /**
     * Pulls the recipe name from the HTML
     * @returns the recipe name
     */
    function getRecipeName() {
        return infoContent[1].name;
    }

    /**
     * Calculates the total carbs in the recipe.
     * @param {array} ingredients array of ingredients
     * @returns the total carbs of the ingredients
     */
    function calculateTotalCarbs(ingredients) {
        return ingredients
            .filter(ingredient => { return ingredient.recipeIngredientCarbs != null })
            .map(ingredient => { return parseFloat(ingredient.recipeIngredientCarbs) })
            .reduce((prev, curr) => prev + curr, 0);
    }

    /**
     * Calculates the carbs per serving
     * @param {float} totalCarbs recipe total carbs
     * @param {int} yieldsAmount how many servings
     * @returns the carbs per serving
     */
    function calculateCarbsPerServing(totalCarbs, yieldsAmount) {
        return totalCarbs / parseFloat(yieldsAmount);
    }
}

/**
 * Pulls html info from recipe web page.
 * All info is stored in a JS object called props.
 * Pull the info needed from that object.
 * @param {string} url url of recipe
 * @returns recipe with nutrition info
 */
async function allRecipes(url) {

    let response = await axios.get(url);

    const root = parse(response.data.toString());
    // const infoNode = root.getElementById('__NEXT_DATA__');
    const infoNode = root.querySelector('[type="application/ld+json"]');
    const infoContent = (JSON.parse(infoNode.innerHTML))[1];
    const carbsPerServing = getCarbs(infoContent.nutrition);
    const yieldsAmount = getYieldsAmount(infoContent.recipeYield);
    const ingredients = getIngredients(); // store ingredients and their amounts together
    const instructions = getInstructions();

    return {
        recipeName: infoContent.name,
        yields: yieldsAmount,
        instructions: instructions,
        ingredients: ingredients,
        carbsPerServing: carbsPerServing,
        type: "included with recipe"
    }

    function getCarbs(nutritionalInfo) {
        const carbsString = nutritionalInfo.carbohydrateContent;
        return carbsString.match(/\d+/)[0];
    }

    function getInstructions() {
        return infoContent.recipeInstructions.map(instruction => {
            return instruction.text;
        }).join('\n');
    }

    function getIngredients() {
        return infoContent.recipeIngredient.map(ingredient => {
            return {
                ingredientName: ingredient,
                "ingredientAmount": null,
                "ingredientUnit": null,
                "apiFoodName": null,
                "carbs": null
            }
        });
    }
}

// Good Housekeeping actually provides the nutrition information!!!!!!!
// None of this was necessary lol
async function scrapeGoodHousekeeping(url) {
    let response = await axios.get(url);

    const root = parse(response.data.toString());
    const ingredientList = root.querySelectorAll('.ingredient-item');

    const yieldsAmount = removeTabsAndReturns(root.querySelector('.yields-amount').childNodes[0].text);
    const yieldsUnit = removeTabsAndReturns(root.querySelector('.yields-unit').text);

    ingredientList.forEach(ingredient => {
        let ingredientAmount = ingredient.querySelector('.ingredient-amount')?.innerHTML;

        // Ref: https://stackoverflow.com/a/22921273
        ingredientAmount = removeTabsAndReturns(ingredientAmount);

        let ingredientDescription = ingredient.querySelector('.ingredient-description')
            ?.querySelector('p')?.innerHTML;

        // Deals with cases such as 'cheese, sliced' or 'bread, toasted'
        if (ingredientDescription.includes(',')) {
            ingredientDescription = ingredientDescription.split(',').slice(0, -1).join();
        }
    });

    return ({ list: "kljflaksjdf" });
}

/**
 * Gets how many a recipe serves
 * @param {string} string Serving size description (e.g. serves 10-12)
 * @returns float with serving size
 */
function getYieldsAmount(string) {
    // Regex matches patterns: serves 10-12 or serves 10 to 12 or serves 12
    let unParsedYield = string.match(/\d+\s?(-|to)?\s?\d*/);
    unParsedYield = unParsedYield[0].match(/\d+/g);

    return unParsedYield.reduce((prev, curr) => {
        return (parseFloat(prev) + parseFloat(curr));
    }) / unParsedYield.length;
}

module.exports = { scrapeNutritionInfo, searchRecipes, saveRecipe, getRecipesByUserId, getRecipesWithFilter };