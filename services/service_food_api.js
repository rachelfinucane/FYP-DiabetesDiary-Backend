/**
 * This file handles all business logic for the Nutrition API.
 */

const axios = require('axios');
const convert = require('convert-units');
const { weightDict, volumeDict, convertFractionToFloat } = require('../helpers/recipes.js');

/**
 * For every ingredient in a recipe, searches the USDA Nutrition API
 * and pulls the nutrition information for that ingredient.
 * @param {object} recipe an objecgt with recipe ingredients
 * @returns a recipe object containing nutritional info for all ingredients
 */
async function getNutritionalInfo(recipe) {
    const ingredients = recipe.parsedIngredients;

    return await Promise.all(
        ingredients.map(async (ingredient) => {
            let apiFoodList = await getMatchingApiFoods(ingredient);

            // If the ingredient we are looking at is measured in weight
            // Then we can only look at API ingredients that are also measured in weight
            if (ingredient.ingredientUnit.trim().toLowerCase() in weightDict) {
                // Now pull a matching food from the API results
                let matchingAPIFood = getAPIFoodByServingSize(apiFoodList, 'g');
                if (matchingAPIFood) {
                    return extractNutritionFromAPIFood(matchingAPIFood, ingredient, 'g', weightDict);
                }
            }
            // If the ingredient we are looking at is measured in volume
            // Then we can only look at API ingredients that are also measured in volume
            else if (ingredient.ingredientUnit.trim().toLowerCase() in volumeDict) {

                // First check servingSizeUnit to see if ml is available
                // This is how the API officially records their serving sizes
                let matchingAPIFood = getAPIFoodByServingSize(apiFoodList, 'ml');
                if (matchingAPIFood) {
                    return extractNutritionFromAPIFood(matchingAPIFood, ingredient,
                        'ml', volumeDict);
                } else {
                    // If there aren't any foods measured in ml, check householdServingFullText
                    // This is the manufacturer description of serving size
                    // And is more likely to use cups, which is a volume and can be converted
                    // Could expand this to look for quarts etc, but cups seem most common
                    matchingAPIFood = getAPIFoodByServingDescription(apiFoodList,
                        'cup', volumeDict);
                    if (matchingAPIFood) {
                        return extractNutritionFromAPIFood(matchingAPIFood, ingredient,
                            'cup', volumeDict);
                    }
                }
            }
            // If no matching food is found
            return {
                ingredientName: ingredient.ingredientName,
                ingredientAmount: ingredient.ingredientAmount,
                ingredientUnit: ingredient.ingredientUnit,
                apiFoodName: null,
                recipeIngredientCarbs: null
            };
        })
    );
}

async function getMatchingApiFoods(ingredient) {
    const apiKey = process.env.USDA_API_KEY;
    const pageSize = 20;
    const dataType = 'Branded';
    const query = ingredient.ingredientName;
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&pageSize=${pageSize}&query=${query}&dataType=${dataType}`;

    // Make request to Nutrition API
    let response = await axios.get(url);

    // An array of matching API foods
    let apiFoodList = response.data.foods;
    return apiFoodList;
}

/**
 * Looks through an array of results from the Nutrition API.
 * Takes the first result that uses the units we want to specify serving size.
 * @param {object} apiFoodList an array of foods returned from the Nutrition API
 * @param {string} unit desired unit to search for
 * @returns the first food in the array that matches the unit we are searching for
 */
function getAPIFoodByServingSize(apiFoodList, unit) {
    // Find the first matching ingredient from the API
    // That has the info in the unit specified (e.g. g, ml)
    return matchingAPIFood = apiFoodList.find(food => {
        // Want the first food in specified unit (g, ml) only
        if (food.servingSizeUnit.trim().toLowerCase() !== unit ||
            food === null || food === undefined) {
            return false;
        }

        /* Each food has a list of nutrients
        * We want nutrients calculated from value per serving size measure only
        * Also double-checking that the nutrient information is stored in grams
        */
        return food.foodNutrients.some(nutrient => {
            return (nutrient.derivationDescription.trim() === 'Calculated from value per serving size measure'
                && nutrient.unitName === 'G'
                && nutrient.nutrientName === 'Carbohydrate, by difference');
        });
    });
}

/**
 * This takes an ingredient from our recipe and a food from the Nutrition API.
 * 1. It pulls the carbohydrate information from the API food 
 * 2. It converts the unit of our recipe ingredient to either g or ml 
 *      depending on if we're working with weight or volume
 * 3. Given the carbs per serving, serving size, and amount of ingredient used
 *      it calculates the carbs in the recipe ingredient.
 * 
 * @param {object} food a single food from the Nutrition API
 * @param {object} ingredient our ingredient that we want to calculate the nutrition for
 * @param {string} unit the unit we are working in, either ml or g
 * @param {object} unitDict the dictionary for the unit we are working in, either weightDict or volumeDict
 * @returns An object containing our ingredient name, amount, unit of measurement, 
 *  name of the matching API food, and the carbs in our ingredient
 */
function extractNutritionFromAPIFood(food, ingredient, unit, unitDict) {
    // 1. Pull Carbs per serving from the API Food
    let carbInfo = food.foodNutrients.find((nutrient) => {
        return nutrient.nutrientName === 'Carbohydrate, by difference';
    });

    // 2. Convert our ingredient measure to specified unit (e.g. to ml or to g)
    // Depending on if we're working with volume or weight
    let recipeIngredientAmount = convert(ingredient.ingredientAmount)
        // pull the standardised unit e.g. g not grams
        .from(unitDict[ingredient.ingredientUnit])
        .to(unit);

    // 3. Calculate the carbs in the Recipe ingredient (e.g. from BBC, MyRecipes)
    let apiFoodServingSize = food.servingSize;
    let carbsPerServing = carbInfo.value;
    let recipeIngredientCarbs = ((carbsPerServing / apiFoodServingSize) * recipeIngredientAmount).toFixed(2);

    return {
        ingredientName: ingredient.ingredientName,
        ingredientAmount: ingredient.ingredientAmount,
        ingredientUnit: ingredient.ingredientUnit,
        apiFoodName: food.description,
        recipeIngredientCarbs
    };
}


/**
 * Given an array of foods from the Nutrition Api, 
 * this function scans through and grabs one that has "cups" in the
 * serving size description. 
 * @param {object} apiFoodList an array of foods returned by the Food API
 * @param {string} unit the unit we're looking for in the serving description (usually cups)
 * @param {object} unitDict either weightDict or volumeDict, used to standardize ml, mils, millilitres etc.
 * @returns an API food that has a serving size that matches our specified unit
 */
function getAPIFoodByServingDescription(apiFoodList, unit, unitDict) {

    // Construct regex that searches the serving description for 
    // any mention of our specified unit
    // usually cups
    let unitRegex = constructRegexSearchForUnit(unitDict, unit);

    let food = findMatchByServingDescription(apiFoodList, unitRegex);

    if (food) {
        let matchedServingDescription = food.householdServingFullText.match(unitRegex);
        let [amount, descriptionUnit] = matchedServingDescription.input.split(' ');
        amount = convertFractionToFloat(amount).toFixed(2);
        food.servingSize = amount;
        food.servingSizeUnit = descriptionUnit;
        return food;
    }
}

/**
 * Example: if we are looking to pull the info "2 cups" from a serving size description
 * 1. pull all variation of 'cups' from the dictionary (cup, cups, cup. etc.)
 * 2. concatenate them together with | so that the regex will search for any of these variations
 * 3. create the regex
 * 3. return the regex
 * @param {object} unitDict dictionary to pull unit information from
 * @param {string} unit the unit we are searching for (usually cups)
 * @returns RegExp
 */
 function constructRegexSearchForUnit(unitDict, unit) {
    let unitVariants = Object.keys(unitDict).filter(key => unitDict[key] === unit).join('|');
    // Matches pattern 1 oz, 25g, 1/4 kg, 0.25 lbs
    // The number pattern came from here:
    // https://www.regextester.com/94462
    let unitRegex = new RegExp(`[0-9]+[,.]?[0-9]*([\\/][0-9]+[,.]?[0-9]*)?\\s(${unitVariants})s*?`, 'i');
    return unitRegex;
}

/**
 * Given an array of Nutrition API foods, scans through all of them
 * and finds one that matches the RegExp
 * and also contains carb info that is measured in grams
 * @param {object} apiFoodList array of foods from the nutrition API
 * @param {RegExp} unitRegex a regular expression
 * @returns a matching food or null
 */
function findMatchByServingDescription(apiFoodList, unitRegex) {
    return apiFoodList.find(food => {

        let manufactureServingDescription = food.householdServingFullText?.trim();
        
        if (manufactureServingDescription) {
            if (manufactureServingDescription.match(unitRegex)) {
                /* Each food has a list of nutrients
                * We want nutrients calculated from value per serving size measure only
                * Also double-checking that the nutrient information is stored in grams
                */
                return food.foodNutrients.some(nutrient => {
                    return (nutrient.derivationDescription.trim() ===
                        'Calculated from value per serving size measure'
                        && nutrient.unitName === 'G'
                        && nutrient.nutrientName === 'Carbohydrate, by difference');
                });
            }
            return false;
        }
        return false;
    });
}

module.exports = { getNutritionalInfo };