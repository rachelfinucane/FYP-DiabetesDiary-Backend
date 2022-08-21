const axios = require('axios');
// import { parse } from 'node-html-parser';
const { parse } = require('node-html-parser')
const { decode } = require('html-entities');
const parseFract = require('parse-fraction');
const convert = require('convert-units')

const weightDict = {
    'pounds': 'lb',
    'pound': 'lb',
    'lbs': 'lb',
    'lb.': 'lb',
    'lbs.': 'lb',
    'lb': 'lb',

    'ounces': 'oz',
    'ounce': 'oz',
    'oz.': 'oz',
    'oz': 'oz',

    'grams': 'g',
    'gram': 'g',
    'grammes': 'g',
    'g': 'g',

    'kilograms': 'kg',
    'kilogram': 'kg',
    'kilos': 'kg',
    'kilo': 'kg',
    'kg': 'kg'
};

const volumes = ['cup', 'cups', 'gallon', 'gallons', 'l', 'liter', 'liters',
    'ml', 'milliliter', 'milliliters', 'quart', 'tsp', 'teaspoon',
    'tbsp', 'tbspn', 'tablespoon', 'tablespoons'];

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

    let x = await getNutritionalInfo({
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
            let ingredientAmount = convertFractionToFloat(checkboxListInput
                .getAttribute('data-quantity'));
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

async function getNutritionalInfo(recipe) {
    console.log(recipe);
    const ingredients = recipe.parsedIngredients;

    let results = await Promise.all(
        ingredients.map(async (ingredient) => {
            const apiKey = process.env.USDA_API_KEY;
            const pageSize = 10;
            const dataType = 'Branded';
            const query = ingredient.ingredientName;

            const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&pageSize=${pageSize}&query=${query}&dataType=${dataType}`;

            let response = await axios.get(url);

            let apiFoodResult = response.data.foods;

            // // Survey (FNNDS): tend to be raw ingredients, e.g. carrots, cream, lemon zest
            // let surveyAPIFoods = totalResult.filter(food => {
            //     return food.dataType.trim().toLowerCase() === 'survey (fndds)'
            // });

            // // Branded food e.g. panko breadcrumbs
            // let apiFoodResult = totalResult.filter(food => {
            //     return food.dataType.trim().toLowerCase() === 'branded'
            // });

            // if ingredientUnit is weight type
            if (ingredient.ingredientUnit.trim().toLowerCase() in weightDict) {

                // Find the first matching ingredient from the API
                // That has the info in grams
                let matchingAPIFood = apiFoodResult.find(food => {

                    // Want the first food in grams only
                    if (food.servingSizeUnit.trim().toLowerCase() !== 'g' ||
                        food === null || food === undefined) {
                        return false;
                    }

                    /* Each food has a list of nutrients
                    * We want nutrients calculated from value per serving size measure only
                    * Also double-checking that the nutrient information is stored in grams
                    */
                    return food.foodNutrients.some(nutrient => {
                        return (nutrient.derivationDescription.trim() === 'Calculated from value per serving size measure'
                            && nutrient.unitName === 'G')
                    });
                });
                if (matchingAPIFood) {
                    let carbInfo = matchingAPIFood.foodNutrients.find((nutrient) => {
                        return nutrient.nutrientName === 'Carbohydrate, by difference';
                    });

                    // Convert our ingredient weight to grams
                    let recipeIngredientWeight = convert(ingredient.ingredientAmount)
                        // pull the standardised unit e.g. g not grams
                        .from(weightDict[ingredient.ingredientUnit])
                        .to('g');

                    let apiFoodServingSize = matchingAPIFood.servingSize;
                    let carbsPerServing = carbInfo.value;

                    let recipeIngredientCarbs = (carbsPerServing / apiFoodServingSize) * recipeIngredientWeight;

                    return recipeIngredientCarbs;

                } else {
                    return "No Info Avalilabe"
                }
            }
            else {
                // let foodsWithMatchingUnits = surveyFoods.filter(food => {
                //     return food.foodMeasures.filter(foodMeasure => {
                //         let unit = weightDict[ingredient.ingredientUnit.trim().toLowerCase()];
                //         let foodMeasureUnit = foodMeasure.disseminationText.toString().trim().toLowerCase();

                //         // Matches pattern 1 oz, 25g, 1/4 kg, 0.25 lbs
                //         // The number pattern came from here:
                //         // https://www.regextester.com/94462
                //         let unitRegex = new RegExp(`[0-9]+[,.]?[0-9]*([\\/][0-9]+[,.]?[0-9]*)?\\s*${unit}`, 'i');

                //         return foodMeasureUnit.match(unitRegex) !== null;
                //     });
                // });

                // look for any that match volume!

            }
            return ({ hello: 'hello' });
        })
    );
    console.log(results);
}

module.exports = { scrapeNutritionInfo };