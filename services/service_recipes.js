const axios = require('axios');
// import { parse } from 'node-html-parser';
const { parse } = require('node-html-parser')
const { decode } = require('html-entities');
const parseFract = require('parse-fraction');

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
    }

    console.log("Could not process request: url was not to a supported recipe site");
}

async function scrapeBBC(url) {

    let response = await axios.get(url);

    const root = parse(response.data.toString());
    const infoNode = root.getElementById('__NEXT_DATA__');
    const infoContent = (JSON.parse(infoNode.innerHTML)).props.pageProps;
    return {
        title: infoContent.title,
        description: infoContent.description,
        ingredients: infoContent.ingredients,
        nutritionalInfo: infoContent.nutritionalInfo,
        servings: infoContent.servings
    }
}

// TODO
// plus 1tbsp pattern
// if in cups go survey
async function myRecipes(url) {
    let response = await axios.get(url);
    const root = parse(response.data.toString());

    // Not using the info node for the ingredients because there is more information
    // in the checkbox-list-input tag later
    // that makes it much easier to parse
    const infoNode = root.querySelector('script[type=application/ld+json]');
    const infoContent = (JSON.parse(infoNode.innerHTML));

    const recipeName = getRecipeName();
    let yieldsAmount = getYieldsAmount();
    let instructions = getInstructions();
    let parsedIngredients = getIngredients();

    getNutritionalInfo({
        recipeName,
        yieldsAmount,
        instructions,
        parsedIngredients
    });

    return ({
        recipeName,
        yieldsAmount,
        instructions,
        parsedIngredients
    });

    function getIngredients() {
        const ingredientList = root.querySelectorAll('.ingredients-item');
        let parsedIngredients = [];
        ingredientList.forEach(ingredient => {
            const checkboxListInput = ingredient.querySelector('.checkbox-list-input');

            // decode html special characters
            let ingredientAmount = convertFractionToFloat(checkboxListInput.getAttribute('data-quantity'));
            let ingredientUnit = checkboxListInput.getAttribute('data-unit');

            let ingredientName = getIngredientName(checkboxListInput);

            parsedIngredients.push({
                ingredientName,
                ingredientAmount,
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
        return instructions;
    }

    function getYieldsAmount() {
        const unParsedYield = infoContent[1].recipeYield.match(/\d+/g);

        let yieldsAmount = unParsedYield.reduce((prev, curr) => {
            return (parseInt(prev) + parseInt(curr)) / unParsedYield.length;
        });
        return yieldsAmount;
    }

    function getRecipeName() {
        return infoContent[1].name;
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
    console.log('yieldsAmount:', yieldsAmount, '\nyeildsUnit:', yieldsUnit);

    ingredientList.forEach(ingredient => {
        let ingredientAmount = ingredient.querySelector('.ingredient-amount')?.innerHTML;

        // Ref: https://stackoverflow.com/a/22921273
        ingredientAmount = removeTabsAndReturns(ingredientAmount);
        console.log(ingredientAmount);

        let ingredientDescription = ingredient.querySelector('.ingredient-description')
            ?.querySelector('p')?.innerHTML;

        // Deals with cases such as 'cheese, sliced' or 'bread, toasted'
        if (ingredientDescription.includes(',')) {
            ingredientDescription = ingredientDescription.split(',').slice(0, -1).join();
        }

        console.log(ingredientDescription);
    });

    // let template = { ingredients:[ingredientName, ingredientAmount, ingredientUnit], yieldsAmount, yieldsUnit };
    return ({ list: "kljflaksjdf" });
}
// // Ref: https://stackoverflow.com/a/22921273

function removeTabsAndReturns(string) {
    if (string) {
        return string.replace(/[\n\r\t]+/g, '');
    }
}

function convertFractionToFloat(numberString) {
    let fraction = parseFract(numberString);
    return fraction[0] / fraction[1];
}

function getNutritionalInfo(recipe) {
    console.log(recipe);
    const ingredients = recipe.parsedIngredients;

    ingredients.map(ingredient => {
        	// search api for the ingredient
            // if unit is a weight
                // take first result
                // convert ingredient to grams (do before now?)
                // store per 100g
                // store per amount given in recipe also
            // if unit is a volume
                // take first result that matches the unit (e.g. cup, floz, ml, l)
                // store value from api (per cup, L etc)
                // store per amount given in recipe also

            // ALTERNATIVELY
           // take first 5 results that match units (convert recipe to grams)
           // store per api amount
           // store per amount specified in recipe also
    });
}

module.exports = { scrapeNutritionInfo };