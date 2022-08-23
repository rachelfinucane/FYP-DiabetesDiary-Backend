const axios = require('axios');
const { parse } = require('node-html-parser')
const { decode } = require('html-entities');
const { removeTabsAndReturns, convertFractionToFloat } = require('../helpers/recipes.js');
const { roundDecimalPlaces } = require('../helpers/helpers.js');
const { getNutritionalInfo } = require('./service_food_api.js');
const { handleGetRecipesByUserId, handleInsertRecipe, handleGetRecipesWithFilter } = require('../models/models_recipes.js');
const { json } = require('express');

async function getRecipesWithFilter(userId, filters){
    return await handleGetRecipesWithFilter(userId, filters);
}

async function searchRecipes(recipeSite, keywords) {
    const googleAPIKey = process.env['GOOGLE_SEARCH_API_KEY'];
    const googleSearchEngine = process.env['GOOGLE_PROGRAMMABLE_SEARCH_ENGINE'];

    const recipeSiteUrl = getRecipeSiteUrl(recipeSite);
    let query = recipeSiteUrl.concat(' ', keywords);

    const googleBaseUrl = new URL('https://www.googleapis.com/customsearch/');
    const googleUrlSubdirectory = `v1?key=${googleAPIKey}&cx=${googleSearchEngine}&q=${query}`;

    const googleUrl = new URL(googleUrlSubdirectory, googleBaseUrl);

    try {
        const response = await axios.get(googleUrl.href);
        const result = response.data;
        return result.items;
    } catch (err) {
        console.log(err);
        throw new Error("Could not connect to the Google Search API");
    }
}

async function saveRecipe(url, userId) {
    result = await scrapeNutritionInfo(url);
    console.log(result);
    return await handleInsertRecipe(result, userId);
}

async function getRecipesByUserId(userId) {
    let results = await handleGetRecipesByUserId(userId);
    JSON.parse(results.recipe);
    return JSON.parse(results.recipe);
}

function getRecipeSiteUrl(recipeSite) {
    let siteDict = {
        'BBC Good Food': 'site:https://www.bbcgoodfood.com/recipes/ -https://www.bbcgoodfood.com/recipes/collection',
        'MyRecipes': 'site:https://www.myrecipes.com/recipe/',
        'All': '-https://www.bbcgoodfood.com/recipes/collection' // Custom search engine is set up to pull from the above site only
    };

    let recipeSiteUrl = siteDict[recipeSite];
    if (recipeSiteUrl === undefined) {
        throw new Error("Could not search for recipes. Invalid recipeSite provided.");
    }
    return recipeSiteUrl;
}

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
    } else {
        throw new Error("Could not process request to scrape nutritional info: url was not to a supported recipe site");
    }
}

async function scrapeBBC(url) {

    let response = await axios.get(url);

    const root = parse(response.data.toString());
    const infoNode = root.getElementById('__NEXT_DATA__');
    const infoContent = (JSON.parse(infoNode.innerHTML)).props.pageProps;
    const carbsPerServing = getCarbs(infoContent.nutritionalInfo);
    const yieldsAmount = getYieldsAmount(infoContent.servings);
    const ingredients = infoContent.ingredients; // store ingredients and their amounts together
    const instructions = getInstructions();
    return {
        recipeName: infoContent.title,
        yields: yieldsAmount,
        instructions: instructions.join('\n'),
        // description: infoContent.description,
        ingredients: getIngredients(),
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
                    ingredientName: ingredient.quantityText?.concat(" ", ingredient?.ingredientText),
                    "ingredientAmount": null,
                    "ingredientUnit": null,
                    "apiFoodName": null,
                    "carbs": null
                }
            })
        }).flat();
    }
}

// TODO
// remove accents
async function myRecipes(url) {
    let response = await axios.get(url);
    const root = parse(response.data.toString());

    // Not using the info node for the ingredients because there is more information
    // in the checkbox-list-input tag later
    // that makes it much easier to parse
    const infoNode = root.querySelector('script[type=application/ld+json]');
    const infoContent = (JSON.parse(infoNode.innerHTML));

    const recipeName = getRecipeName();
    let yieldsAmount = getYieldsAmount(infoContent[1].recipeYield);
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
                ingredientAmount:ingredientAmountRounded,
                ingredientUnit
            });

        });

        return parsedIngredients;
    }

    function getIngredientName(checkboxListInput) {
        let ingredientName = decode(checkboxListInput.getAttribute('data-ingredient'));
        // Deals with cases such as 'cheese, sliced' or 'bread, toasted'
        if (ingredientName.includes(',')) {
            ingredientName = ingredientName.split(',').slice(0, -1).join();
        }

        // Remove (extra descriptions with parentheses)
        ingredientName = ingredientName.replace(/\([\w\W]*\)+/i, '');
        return ingredientName;
    }

    function getInstructions() {
        let instructions = infoContent[1].recipeInstructions;
        instructions = instructions.map(instruction => { return instruction.text; });
        return instructions.join('\n');
    }

    function getRecipeName() {
        return infoContent[1].name;
    }

    function calculateTotalCarbs(ingredients) {
        return ingredients
            .filter(ingredient => { return ingredient.recipeIngredientCarbs != null })
            .map(ingredient => { return parseFloat(ingredient.recipeIngredientCarbs) })
            .reduce((prev, curr) => { return prev + curr });
    }

    function calculateCarbsPerServing(totalCarbs, yieldsAmount) {
        return totalCarbs / parseFloat(yieldsAmount);
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

    // let template = { ingredients:[ingredientName, ingredientAmount, ingredientUnit], yieldsAmount, yieldsUnit };
    return ({ list: "kljflaksjdf" });
}

function getYieldsAmount(string) {
    // Regex matches patterns: serves 10-12 or serves 10 to 12 or serves 12
    let unParsedYield = string.match(/\d+\s?(-|to)?\s?\d*/);
    unParsedYield = unParsedYield[0].match(/\d+/g);

    return unParsedYield.reduce((prev, curr) => {
        return (parseFloat(prev) + parseFloat(curr));
    }) / unParsedYield.length;
}

module.exports = { scrapeNutritionInfo, searchRecipes, saveRecipe, getRecipesByUserId, getRecipesWithFilter};